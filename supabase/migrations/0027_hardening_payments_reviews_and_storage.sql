-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Hardening Payments, Veresiye/Refund, Reviews & Storage
-- 0027_hardening_payments_reviews_and_storage.sql
-- ============================================================================

-- 1. payments tablosunda misafir / kayıtsız kasa işlemlerine izin vermek için musteri_id nullable güvencesi
ALTER TABLE public.payments ALTER COLUMN musteri_id DROP NOT NULL;

-- 2. loyalty_transaction_type enum'ına DUZELTME değerini ekle (varsa atla)
ALTER TYPE public.loyalty_transaction_type ADD VALUE IF NOT EXISTS 'DUZELTME';

-- 3. record_payment_transaction RPC sıkılaştırması (randevu kilitleme, durum ve müşteri doğrulaması)
CREATE OR REPLACE FUNCTION public.record_payment_transaction(
  p_id UUID,
  p_randevu_id UUID,
  p_musteri_id UUID,
  p_islemi_yapan_calisan_id UUID,
  p_hizmet_adlari TEXT[],
  p_toplam_tutar NUMERIC,
  p_odenen_tutar NUMERIC,
  p_indirim_tutari NUMERIC,
  p_kullanilan_puan INTEGER,
  p_kazanilan_puan INTEGER,
  p_odeme_yontemi public.payment_method,
  p_bahsis_tutari NUMERIC,
  p_veresiye BOOLEAN,
  p_gizli_not TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_appt public.appointments%ROWTYPE;
  v_effective_musteri_id UUID := p_musteri_id;
  v_current_points INTEGER := 0;
  v_inserted_payment public.payments%ROWTYPE;
BEGIN
  -- 1. Randevu varsa kilitleyerek doğrula
  IF p_randevu_id IS NOT NULL THEN
    SELECT *
    INTO v_appt
    FROM public.appointments
    WHERE id = p_randevu_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Randevu bulunamadı.';
    END IF;

    IF v_appt.durum = 'Tamamlandı'::public.appointment_status THEN
      RAISE EXCEPTION 'Bu randevu için ödeme zaten alınmış.' USING ERRCODE = '23505';
    END IF;

    IF v_appt.durum NOT IN ('Beklemede'::public.appointment_status, 'Onaylandı'::public.appointment_status) THEN
      RAISE EXCEPTION 'İptal edilmiş veya süresi dolmuş randevu için tahsilat yapılamaz.';
    END IF;

    IF v_effective_musteri_id IS NULL THEN
      v_effective_musteri_id := v_appt.musteri_id;
    ELSIF v_appt.musteri_id IS NOT NULL AND v_effective_musteri_id <> v_appt.musteri_id THEN
      RAISE EXCEPTION 'Randevu müşteri kimliği uyuşmuyor.';
    END IF;
  END IF;

  -- 2. Müşteri puanı harcanıyorsa bakiyenin yeterli olduğunu kilitleyerek doğrula
  IF v_effective_musteri_id IS NOT NULL AND COALESCE(p_kullanilan_puan, 0) > 0 THEN
    SELECT COALESCE(toplam_puan, 0)
    INTO v_current_points
    FROM public.profiles
    WHERE id = v_effective_musteri_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Müşteri profili bulunamadı.';
    END IF;

    IF v_current_points < p_kullanilan_puan THEN
      RAISE EXCEPTION 'Yetersiz sadakat puanı bakiyesi.';
    END IF;
  END IF;

  -- 3. Ödeme satırını ekle
  INSERT INTO public.payments (
    id,
    randevu_id,
    musteri_id,
    islemi_yapan_calisan_id,
    hizmet_adlari,
    toplam_tutar,
    odenen_tutar,
    indirim_tutari,
    kullanilan_puan,
    odeme_yontemi,
    bahsis_tutari,
    veresiye,
    gizli_not
  ) VALUES (
    COALESCE(p_id, gen_random_uuid()),
    p_randevu_id,
    v_effective_musteri_id,
    p_islemi_yapan_calisan_id,
    COALESCE(p_hizmet_adlari, '{}'::text[]),
    GREATEST(0, COALESCE(p_toplam_tutar, 0)),
    GREATEST(0, COALESCE(p_odenen_tutar, 0)),
    GREATEST(0, COALESCE(p_indirim_tutari, 0)),
    GREATEST(0, COALESCE(p_kullanilan_puan, 0)),
    COALESCE(p_odeme_yontemi, 'Nakit'::public.payment_method),
    GREATEST(0, COALESCE(p_bahsis_tutari, 0)),
    COALESCE(p_veresiye, false),
    p_gizli_not
  )
  RETURNING * INTO v_inserted_payment;

  -- 4. Sadakat puanı hareketlerini ve müşteri profil bakiyesini güncelle
  IF v_effective_musteri_id IS NOT NULL THEN
    IF COALESCE(p_kullanilan_puan, 0) > 0 THEN
      INSERT INTO public.loyalty_ledger (
        musteri_id,
        puan,
        islem_tipi,
        payment_id
      ) VALUES (
        v_effective_musteri_id,
        -p_kullanilan_puan,
        'HARCAMA'::public.loyalty_transaction_type,
        v_inserted_payment.id
      );
    END IF;

    -- Şartname Madde 4: Veresiyede puan tahsilat anında verilir
    IF COALESCE(p_kazanilan_puan, 0) > 0 AND NOT COALESCE(p_veresiye, false) THEN
      INSERT INTO public.loyalty_ledger (
        musteri_id,
        puan,
        islem_tipi,
        payment_id
      ) VALUES (
        v_effective_musteri_id,
        p_kazanilan_puan,
        'KAZANIM'::public.loyalty_transaction_type,
        v_inserted_payment.id
      );
    END IF;

    UPDATE public.profiles
    SET toplam_puan = GREATEST(
      0,
      COALESCE(toplam_puan, 0)
      - GREATEST(0, COALESCE(p_kullanilan_puan, 0))
      + (CASE WHEN COALESCE(p_veresiye, false) THEN 0 ELSE GREATEST(0, COALESCE(p_kazanilan_puan, 0)) END)
    )
    WHERE id = v_effective_musteri_id;
  END IF;

  -- 5. Randevu varsa durumunu Tamamlandı olarak güncelle
  IF p_randevu_id IS NOT NULL THEN
    UPDATE public.appointments
    SET durum = 'Tamamlandı'::public.appointment_status
    WHERE id = p_randevu_id;
  END IF;

  RETURN to_jsonb(v_inserted_payment);
END;
$$;

-- 4. Veresiye Tahsilatı ve Ödeme İadesi RPC'si (Şartname Bölüm 4, 5, 18)
CREATE OR REPLACE FUNCTION public.settle_or_refund_payment(
  p_payment_id UUID,
  p_action TEXT,
  p_odeme_yontemi public.payment_method DEFAULT 'Nakit'::public.payment_method
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_earned_points INTEGER := 0;
  v_spent_points INTEGER := 0;
BEGIN
  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ödeme kaydı bulunamadı.';
  END IF;

  IF p_action = 'settle_veresiye' THEN
    IF NOT COALESCE(v_payment.veresiye, false) THEN
      RAISE EXCEPTION 'Bu ödeme kaydı açık veresiye durumunda değil.';
    END IF;

    UPDATE public.payments
    SET veresiye = false,
        odeme_yontemi = COALESCE(p_odeme_yontemi, 'Nakit'::public.payment_method)
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    IF v_payment.musteri_id IS NOT NULL THEN
      v_earned_points := GREATEST(0, FLOOR(COALESCE(v_payment.odenen_tutar, 0) / 10)::INTEGER);
      IF v_earned_points > 0 THEN
        INSERT INTO public.loyalty_ledger (
          musteri_id,
          puan,
          islem_tipi,
          payment_id
        ) VALUES (
          v_payment.musteri_id,
          v_earned_points,
          'KAZANIM'::public.loyalty_transaction_type,
          v_payment.id
        );

        UPDATE public.profiles
        SET toplam_puan = GREATEST(0, COALESCE(toplam_puan, 0) + v_earned_points)
        WHERE id = v_payment.musteri_id;
      END IF;
    END IF;

    RETURN to_jsonb(v_payment);
  ELSIF p_action = 'refund' THEN
    v_earned_points := CASE
      WHEN COALESCE(v_payment.veresiye, false) THEN 0
      ELSE GREATEST(0, FLOOR(COALESCE(v_payment.odenen_tutar, 0) / 10)::INTEGER)
    END;
    v_spent_points := GREATEST(0, COALESCE(v_payment.kullanilan_puan, 0));

    UPDATE public.payments
    SET odenen_tutar = 0,
        veresiye = false,
        gizli_not = TRIM(BOTH ' ' FROM COALESCE(gizli_not, '') || ' [İADE EDİLDİ]')
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    IF v_payment.musteri_id IS NOT NULL THEN
      IF v_earned_points > 0 THEN
        INSERT INTO public.loyalty_ledger (
          musteri_id,
          puan,
          islem_tipi,
          payment_id
        ) VALUES (
          v_payment.musteri_id,
          -v_earned_points,
          'DUZELTME'::public.loyalty_transaction_type,
          v_payment.id
        );
      END IF;

      IF v_spent_points > 0 THEN
        INSERT INTO public.loyalty_ledger (
          musteri_id,
          puan,
          islem_tipi,
          payment_id
        ) VALUES (
          v_payment.musteri_id,
          v_spent_points,
          'DUZELTME'::public.loyalty_transaction_type,
          v_payment.id
        );
      END IF;

      UPDATE public.profiles
      SET toplam_puan = GREATEST(
        0,
        COALESCE(toplam_puan, 0) - v_earned_points + v_spent_points
      )
      WHERE id = v_payment.musteri_id;
    END IF;

    RETURN to_jsonb(v_payment);
  ELSE
    RAISE EXCEPTION 'Geçersiz ödeme işlemi: %', p_action;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_or_refund_payment(UUID, TEXT, public.payment_method)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_or_refund_payment(UUID, TEXT, public.payment_method)
  TO service_role;

-- 5. Doğrudan tablo yazma yetkilerini kaldır & veritabanı kısıtlarını uygula
REVOKE INSERT, UPDATE, DELETE ON public.customer_reviews, public.gallery_comments, public.audit_logs
  FROM anon, authenticated;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_toplam_puan_nonnegative;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_toplam_puan_nonnegative CHECK (toplam_puan >= 0);

ALTER TABLE public.gallery_comments DROP CONSTRAINT IF EXISTS chk_gallery_comments_yorum_len;
ALTER TABLE public.gallery_comments ADD CONSTRAINT chk_gallery_comments_yorum_len CHECK (char_length(yorum) <= 500);

ALTER TABLE public.customer_reviews DROP CONSTRAINT IF EXISTS chk_customer_reviews_yorum_len;
ALTER TABLE public.customer_reviews ADD CONSTRAINT chk_customer_reviews_yorum_len CHECK (yorum IS NULL OR char_length(yorum) <= 1000);

UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']
WHERE id = 'salon-media';
