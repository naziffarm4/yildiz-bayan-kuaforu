-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Misafir & Salon Müşteri Profilleri İzni
-- 0014_allow_guest_profiles_and_appointments.sql
-- Şartname Madde 3, 4: Kayıtsız/misafir ve işletmeye gelen randevular
-- ============================================================================

-- 1. profiles tablosundaki auth.users(id) hard foreign key kısıtlamasını kaldır.
-- Böylece auth hesabı olmayan misafir müşteriler de salonda müşteri kartı olarak tutulabilir.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. appointments tablosundaki musteri_id alanını nullable yap.
-- Olası profil uyuşmazlığında randevu kaydı (ad, soyad, telefon) asla kaybolmaz.
ALTER TABLE public.appointments ALTER COLUMN musteri_id DROP NOT NULL;

-- 3. Misafir olarak randevu alan müşterinin sonradan hesap açması durumunda (Şartname Madde 3):
-- handle_new_user tetikleyicisini eski misafir randevularını yeni hesaba aktaracak şekilde güncelle.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_user_meta JSONB;
  parsed_first_name TEXT;
  parsed_last_name TEXT;
  parsed_phone TEXT;
  full_name TEXT;
  existing_guest_id UUID;
  existing_puan INTEGER := 0;
BEGIN
  raw_user_meta := COALESCE(new.raw_user_meta_data, '{}'::jsonb);

  parsed_first_name := COALESCE(
    NULLIF(TRIM(raw_user_meta->>'ad'), ''),
    NULLIF(TRIM(raw_user_meta->>'first_name'), ''),
    NULLIF(TRIM(raw_user_meta->>'given_name'), '')
  );

  parsed_last_name := COALESCE(
    NULLIF(TRIM(raw_user_meta->>'soyad'), ''),
    NULLIF(TRIM(raw_user_meta->>'soyad'), ''),
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
    parsed_phone := '0599' || lpad(abs(('x' || substr(md5(new.id::text), 1, 8))::bit(32)::bigint % 10000000)::text, 7, '0');
  END IF;

  -- Aynı telefon numarasıyla daha önceden oluşturulmuş bir misafir profili var mı kontrol et
  SELECT id, toplam_puan INTO existing_guest_id, existing_puan
  FROM public.profiles
  WHERE telefon = parsed_phone AND id <> new.id
  LIMIT 1;

  IF existing_guest_id IS NOT NULL THEN
    -- Eski misafir randevularını ve müşteri notlarını yeni auth kullanıcısına devret
    UPDATE public.appointments SET musteri_id = new.id WHERE musteri_id = existing_guest_id;
    UPDATE public.customer_notes SET profile_id = new.id WHERE profile_id = existing_guest_id;
    DELETE FROM public.profiles WHERE id = existing_guest_id;
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
    existing_puan,
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
