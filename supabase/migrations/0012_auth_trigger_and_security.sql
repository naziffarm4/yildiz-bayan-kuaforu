-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Auth Trigger & Security Hardening
-- 0012_auth_trigger_and_security.sql
-- ============================================================================

-- 1. YENİ KULLANICI KAYIT TETİKLEYİCİSİ (handle_new_user)
-- auth.users tablosuna yeni kullanıcı eklendiğinde otomatik olarak public.profiles tablosuna Musteri rolüyle kaydeder.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_user_meta JSONB;
  parsed_first_name TEXT;
  parsed_last_name TEXT;
  parsed_phone TEXT;
  full_name TEXT;
BEGIN
  raw_user_meta := COALESCE(new.raw_user_meta_data, '{}'::jsonb);

  parsed_first_name := COALESCE(
    NULLIF(TRIM(raw_user_meta->>'ad'), ''),
    NULLIF(TRIM(raw_user_meta->>'first_name'), ''),
    NULLIF(TRIM(raw_user_meta->>'given_name'), '')
  );

  parsed_last_name := COALESCE(
    NULLIF(TRIM(raw_user_meta->>'soyad'), ''),
    NULLIF(TRIM(raw_user_meta->>'last_name'), ''),
    NULLIF(TRIM(raw_user_meta->>'family_name'), ''),
    ''
  );

  full_name := COALESCE(
    NULLIF(TRIM(raw_user_meta->>'full_name'), ''),
    NULLIF(TRIM(raw_user_meta->>'name'), '')
  );

  IF parsed_first_name IS NULL AND full_name IS NOT NULL THEN
    IF position(' ' in full_name) > 0 THEN
      parsed_first_name := split_part(full_name, ' ', 1);
      parsed_last_name := substring(full_name from position(' ' in full_name) + 1);
    ELSE
      parsed_first_name := full_name;
    END IF;
  END IF;

  IF parsed_first_name IS NULL OR parsed_first_name = '' THEN
    parsed_first_name := 'Değerli';
    parsed_last_name := 'Müşterimiz';
  END IF;

  parsed_phone := COALESCE(
    NULLIF(TRIM(new.phone), ''),
    NULLIF(TRIM(raw_user_meta->>'telefon'), ''),
    NULLIF(TRIM(raw_user_meta->>'phone'), '')
  );

  IF parsed_phone IS NULL THEN
    -- Telefon numarası sağlanmadıysa (örn. OAuth/E-posta ile ilk kayıt) benzersiz geçici 11 haneli numara üretilir
    parsed_phone := '0599' || lpad(abs(('x' || substr(md5(new.id::text), 1, 8))::bit(32)::bigint % 10000000)::text, 7, '0');
  END IF;

  INSERT INTO public.profiles (
    id,
    ad,
    soyad,
    telefon,
    eposta,
    rol,
    toplam_puan,
    sms_dogrulandi
  ) VALUES (
    new.id,
    parsed_first_name,
    parsed_last_name,
    parsed_phone,
    new.email,
    'Musteri',
    0,
    (new.phone_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    eposta = COALESCE(EXCLUDED.eposta, public.profiles.eposta),
    telefon = CASE
      WHEN public.profiles.telefon LIKE '0599%' AND EXCLUDED.telefon NOT LIKE '0599%' THEN EXCLUDED.telefon
      ELSE public.profiles.telefon
    END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users tablosu üzerinde AFTER INSERT tetikleyicisi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PROFİL GÜNCELLEMELERİNDE ROL KISITLAMASININ PEKİŞTİRİLMESİ (RLS & TRIGGER)
-- Kullanıcıların kendi rollerini 'Admin' veya 'Calisan' olarak yükseltmesini engeller.
-- Rol sadece Admin rolündeki bir kullanıcı veya service_role tarafından güncellenebilir.

-- Var olan update politikasını kaldır ve sıkılaştırılmış olanı tanımla
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (
  public.is_admin()
  OR (
    auth.uid() = id
    AND rol = (SELECT p.rol FROM public.profiles p WHERE p.id = auth.uid())
  )
);

-- Ekstra Güvenlik Katmanı: BEFORE UPDATE Trigger (Direct SQL veya bypass denemelerine karşı)
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rol IS DISTINCT FROM OLD.rol THEN
    IF NOT public.is_admin() AND current_user <> 'service_role' THEN
      RAISE EXCEPTION 'Yetkisiz rol değişikliği: Rolünüzü değiştiremezsiniz.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();
