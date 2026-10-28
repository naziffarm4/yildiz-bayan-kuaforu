-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Faz 1: Veritabanı Güvenlik Sıkılaştırması & RLS
-- 0015_security_hardening_and_rls.sql
-- Şartname Madde 3, 4, 14, 16, 18
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. S1: 'salon-media' Storage Politikası Sıkılaştırması
-- Okuma (SELECT) herkese açık kalır; yazma/güncelleme/silme yalnızca
-- authenticated ve is_staff_or_admin() kontrolünden geçen kullanıcılara açılır.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Salon Media Admin Manage" ON storage.objects;
DROP POLICY IF EXISTS "Salon Media Staff Manage" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Salon Media Public View'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Salon Media Public View"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'salon-media');
  END IF;
END $$;

CREATE POLICY "Salon Media Staff Manage"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'salon-media' AND public.is_staff_or_admin())
WITH CHECK (bucket_id = 'salon-media' AND public.is_staff_or_admin());

-- ----------------------------------------------------------------------------
-- 2. S2: handle_new_user Trigger Güvenliği (Şartname Madde 3 & 18)
-- - İstemci beyanlı raw_user_meta_data->>'telefon' ile mevcut auth.users
--   kullanıcısının profili ASLA silinmez veya üzerine yazılmaz.
-- - Yalnızca auth.users karşılığı olmayan gerçek misafir profilleri ve
--   yalnızca new.phone_confirmed_at IS NOT NULL ise otomatik devralınır.
-- - Devralma sırasında appointments, customer_notes, payments ve loyalty_ledger
--   referansları new.id'ye taşındıktan sonra eski misafir profili silinir.
-- - Telefon çakışması varsa benzersiz yedek telefon üretilir.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_user_meta JSONB;
  parsed_first_name TEXT;
  parsed_last_name TEXT;
  parsed_phone TEXT;
  fallback_phone TEXT;
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

  fallback_phone := '0599' || lpad(abs(('x' || substr(md5(new.id::text), 1, 8))::bit(32)::bigint % 10000000)::text, 7, '0');

  parsed_phone := COALESCE(
    NULLIF(TRIM(new.phone), ''),
    NULLIF(TRIM(raw_user_meta->>'telefon'), ''),
    NULLIF(TRIM(raw_user_meta->>'phone'), ''),
    fallback_phone
  );

  -- Yalnızca telefon doğrulaması tamamlanmış (phone_confirmed_at IS NOT NULL)
  -- kullanıcılarda ve yalnızca auth.users kaydı bulunmayan gerçek misafir
  -- profillerinde otomatik devralma yapılır.
  IF new.phone_confirmed_at IS NOT NULL THEN
    SELECT public.profiles.id, public.profiles.toplam_puan
    INTO existing_guest_id, existing_puan
    FROM public.profiles
    WHERE public.profiles.telefon = parsed_phone
      AND public.profiles.id <> new.id
      AND NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = public.profiles.id
      )
    LIMIT 1;

    IF existing_guest_id IS NOT NULL THEN
      -- Yeni profil eklenirken UNIQUE(telefon) çakışmasını önlemek için misafir telefonunu geçici boşa çıkar
      UPDATE public.profiles
      SET telefon = 'claimed-' || existing_guest_id::text
      WHERE id = existing_guest_id;
    END IF;
  END IF;

  -- Eğer telefon başka bir kayıtlı kullanıcıda (veya doğrulanmamış hesapta) zaten varsa
  -- UNIQUE çakışmasını önlemek için benzersiz yedek telefon üret
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.telefon = parsed_phone AND p.id <> new.id
  ) THEN
    parsed_phone := fallback_phone;
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

  IF existing_guest_id IS NOT NULL THEN
    -- Referansları yeni auth kullanıcısına güvenle taşı ve eski misafir profilini sil
    UPDATE public.appointments SET musteri_id = new.id WHERE musteri_id = existing_guest_id;
    UPDATE public.customer_notes SET profile_id = new.id WHERE profile_id = existing_guest_id;
    UPDATE public.payments SET musteri_id = new.id WHERE musteri_id = existing_guest_id;
    UPDATE public.loyalty_ledger SET musteri_id = new.id WHERE musteri_id = existing_guest_id;
    DELETE FROM public.profiles WHERE id = existing_guest_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. S3: appointments Müşteri Yetki Kısıtlaması (RLS & Trigger)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
CREATE POLICY "appointments_insert"
ON public.appointments FOR INSERT
WITH CHECK (
  public.is_staff_or_admin()
  OR (
    auth.uid() = musteri_id
    AND durum = 'Beklemede'
    AND calisan_idleri = '{}'::uuid[]
    AND onaylayan_id IS NULL
  )
);

DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
CREATE POLICY "appointments_update"
ON public.appointments FOR UPDATE
USING (public.is_staff_or_admin() OR auth.uid() = musteri_id)
WITH CHECK (
  public.is_staff_or_admin()
  OR (
    auth.uid() = musteri_id
    AND durum IN ('Beklemede', 'İptal Edildi')
  )
);

CREATE OR REPLACE FUNCTION public.enforce_customer_appointment_constraints()
RETURNS TRIGGER AS $$
BEGIN
  -- Personel, Admin veya sunucu tarafı service_role işlemleri kısıtlamadan muaftır
  IF COALESCE(public.is_staff_or_admin(), false)
     OR COALESCE(auth.role(), '') = 'service_role'
     OR current_user IN ('service_role', 'postgres', 'supabase_admin')
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'Beklemede' THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Müşteriler yalnızca Beklemede durumunda randevu oluşturabilir.';
    END IF;

    IF NEW.calisan_idleri <> '{}'::uuid[] THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Müşteriler doğrudan çalışan ataması yapamaz.';
    END IF;

    IF NEW.onaylayan_id IS NOT NULL THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Müşteriler onaylayan_id belirleyemez.';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF auth.uid() IS DISTINCT FROM OLD.musteri_id OR NEW.musteri_id IS DISTINCT FROM OLD.musteri_id THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Yalnızca kendi randevunuzu güncelleyebilirsiniz.';
    END IF;

    IF NEW.onaylayan_id IS DISTINCT FROM OLD.onaylayan_id THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Müşteriler onaylayan_id alanını değiştiremez.';
    END IF;

    IF NEW.calisan_idleri IS DISTINCT FROM OLD.calisan_idleri THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Müşteriler calisan_idleri alanını değiştiremez.';
    END IF;

    IF NEW.durum IN ('Onaylandı', 'Tamamlandı', 'Gelmedi', 'Süresi Doldu') THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Müşteriler randevu durumunu Onaylandı veya Tamamlandı yapamaz.';
    END IF;

    -- Erteleme (tarih_saat değişikliği) durumunda randevu durumu Beklemede'ye çekilir
    IF NEW.tarih_saat IS DISTINCT FROM OLD.tarih_saat AND NEW.durum <> 'İptal Edildi' THEN
      NEW.durum := 'Beklemede';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_customer_appointment_constraints ON public.appointments;
CREATE TRIGGER trg_enforce_customer_appointment_constraints
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_appointment_constraints();

-- ----------------------------------------------------------------------------
-- 4. S8: customer_reviews ve gallery_comments INSERT Politikaları
-- (Şartname Madde 16 & 18: Galeri yorumları giriş zorunludur ve moderasyonludur;
-- müşteri yorumları moderasyonludur, aktif = false ile başlar.)
-- ----------------------------------------------------------------------------
ALTER TABLE public.gallery_comments ALTER COLUMN aktif SET DEFAULT false;

DROP POLICY IF EXISTS "gallery_comments_public_insert" ON public.gallery_comments;
DROP POLICY IF EXISTS "gallery_comments_authenticated_insert" ON public.gallery_comments;

CREATE POLICY "gallery_comments_authenticated_insert"
ON public.gallery_comments
FOR INSERT
TO authenticated
WITH CHECK (aktif = false);

ALTER TABLE public.customer_reviews ALTER COLUMN aktif SET DEFAULT false;

DROP POLICY IF EXISTS "customer_reviews_insert" ON public.customer_reviews;
DROP POLICY IF EXISTS "customer_reviews_public_insert" ON public.customer_reviews;

CREATE POLICY "customer_reviews_public_insert"
ON public.customer_reviews
FOR INSERT
WITH CHECK (aktif = false);

-- ----------------------------------------------------------------------------
-- 5. Realtime Yayını: public.appointments tablosunu idempotent olarak ekle
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;
