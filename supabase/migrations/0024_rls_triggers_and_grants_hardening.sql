-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Trigger Hardening, Least-Privilege Grants & Indexes
-- 0024_rls_triggers_and_grants_hardening.sql
-- ============================================================================

-- 1. Y2: SECURITY DEFINER tetikleyicilerde current_user yerine session_user kontrolü
CREATE OR REPLACE FUNCTION public.enforce_customer_appointment_constraints()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(public.is_staff_or_admin(), false)
     OR COALESCE(auth.role(), '') = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin')
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

    IF NEW.tarih_saat IS DISTINCT FROM OLD.tarih_saat AND NEW.durum <> 'İptal Edildi' THEN
      NEW.durum := 'Beklemede';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(public.is_admin(), false)
     OR COALESCE(auth.role(), '') = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin')
  THEN
    RETURN NEW;
  END IF;

  IF NEW.rol IS DISTINCT FROM OLD.rol THEN
    RAISE EXCEPTION 'Yetkisiz rol değişikliği: Rolünüzü değiştiremezsiniz.';
  END IF;

  IF NEW.toplam_puan IS DISTINCT FROM OLD.toplam_puan THEN
    RAISE EXCEPTION 'Yetkisiz puan değişikliği: Sadakat puanı doğrudan güncellenemez.';
  END IF;

  IF NEW.sms_dogrulandi IS DISTINCT FROM OLD.sms_dogrulandi THEN
    RAISE EXCEPTION 'Yetkisiz doğrulama durumu değişikliği: SMS doğrulama durumu doğrudan güncellenemez.';
  END IF;

  IF NEW.telefon IS DISTINCT FROM OLD.telefon THEN
    RAISE EXCEPTION 'Telefon numarası doğrudan değiştirilemez.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Y2: Müşterinin kendi randevusunu güvenle iptal edebilmesi için SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.cancel_my_appointment(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_updated INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Giriş yapılması zorunludur.';
  END IF;

  UPDATE public.appointments
  SET durum = 'İptal Edildi'
  WHERE id = p_appointment_id
    AND musteri_id = v_uid
    AND durum IN ('Beklemede', 'Onaylandı');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'İptal edilebilir randevu bulunamadı veya yetkiniz yok.';
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_my_appointment(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_appointment(UUID) TO authenticated, service_role;

-- 3. Y2, O-1, O-2: Doğrudan tablo yazma yetkilerini geri al (En Az Ayrıcalık)
REVOKE INSERT, UPDATE, DELETE ON public.appointments FROM anon, authenticated;
REVOKE INSERT ON public.profiles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.gallery_likes FROM anon, authenticated;

-- 4. P-5 & O-6: Aynı telefon ve saatte aktif randevu tekillik indeksi
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_phone_time
  ON public.appointments (musteri_telefon, tarih_saat)
  WHERE durum IN ('Beklemede', 'Onaylandı');
