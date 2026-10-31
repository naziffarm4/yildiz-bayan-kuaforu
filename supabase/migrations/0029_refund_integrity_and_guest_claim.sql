-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Refund Integrity, Reversal Ledger & Hardening
-- 0029_refund_integrity_and_guest_claim.sql
-- ============================================================================

-- 1. N1 & N2: İade Sütunları ve payment_refunds Ters Kayıt Tablosu
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS iade_tarihi TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS iade_eden_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS iade_tutari NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (iade_tutari >= 0);

CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE RESTRICT,
  iade_tutari NUMERIC(10,2) NOT NULL CHECK (iade_tutari >= 0),
  iptal_edilen_bahsis NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (iptal_edilen_bahsis >= 0),
  geri_alinan_puan INTEGER NOT NULL DEFAULT 0 CHECK (geri_alinan_puan >= 0),
  iade_edilen_puan INTEGER NOT NULL DEFAULT 0 CHECK (iade_edilen_puan >= 0),
  iade_eden_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sebep TEXT,
  olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_refunds_select_admin" ON public.payment_refunds;
CREATE POLICY "payment_refunds_select_admin"
  ON public.payment_refunds
  FOR SELECT
  USING (public.is_admin());

REVOKE ALL ON public.payment_refunds FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payment_refunds TO authenticated;
GRANT ALL ON public.payment_refunds TO service_role;

-- 2. N1, N2, N3: settle_or_refund_payment RPC Yeniden Tasarımı
DROP FUNCTION IF EXISTS public.settle_or_refund_payment(UUID, TEXT, public.payment_method);

CREATE OR REPLACE FUNCTION public.settle_or_refund_payment(
  p_payment_id UUID,
  p_action TEXT,
  p_odeme_yontemi public.payment_method DEFAULT 'Nakit'::public.payment_method,
  p_actor_id UUID DEFAULT NULL,
  p_earned_points INTEGER DEFAULT NULL,
  p_sebep TEXT DEFAULT NULL
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

  -- N1 Koruması: İade edilmiş ödeme üzerinde tekrar iade veya veresiye kapama yapılamaz
  IF v_payment.iade_tarihi IS NOT NULL THEN
    RAISE EXCEPTION 'Bu ödeme zaten iade edilmiş.' USING ERRCODE = '23505';
  END IF;

  IF p_action = 'settle_veresiye' THEN
    IF NOT COALESCE(v_payment.veresiye, false) THEN
      RAISE EXCEPTION 'Bu ödeme kaydı açık veresiye durumunda değil.';
    END IF;

    v_earned_points := GREATEST(
      0,
      COALESCE(p_earned_points, FLOOR(COALESCE(v_payment.odenen_tutar, 0) / 10)::INTEGER)
    );

    UPDATE public.payments
    SET veresiye = false,
        odeme_yontemi = COALESCE(p_odeme_yontemi, 'Nakit'::public.payment_method)
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    IF v_payment.musteri_id IS NOT NULL AND v_earned_points > 0 THEN
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

    RETURN to_jsonb(v_payment);
  ELSIF p_action = 'refund' THEN
    -- N3: Kazanılan ve harcanan gerçek puanları loyalty_ledger üzerinden oku
    SELECT COALESCE(SUM(puan), 0)::INTEGER
    INTO v_earned_points
    FROM public.loyalty_ledger
    WHERE payment_id = p_payment_id
      AND islem_tipi = 'KAZANIM'::public.loyalty_transaction_type
      AND puan > 0;

    SELECT COALESCE(SUM(ABS(puan)), 0)::INTEGER
    INTO v_spent_points
    FROM public.loyalty_ledger
    WHERE payment_id = p_payment_id
      AND islem_tipi = 'HARCAMA'::public.loyalty_transaction_type
      AND puan < 0;

    -- N2: Orijinal odenen_tutar değiştirilmez; iade bilgileri ve ters kayıt işlenir
    UPDATE public.payments
    SET iade_tarihi = TIMEZONE('utc', NOW()),
        iade_eden_id = p_actor_id,
        iade_tutari = v_payment.odenen_tutar,
        veresiye = false,
        gizli_not = TRIM(BOTH ' ' FROM COALESCE(gizli_not, '') || ' [İADE EDİLDİ]')
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    INSERT INTO public.payment_refunds (
      payment_id,
      iade_tutari,
      iptal_edilen_bahsis,
      geri_alinan_puan,
      iade_edilen_puan,
      iade_eden_id,
      sebep
    ) VALUES (
      v_payment.id,
      v_payment.odenen_tutar,
      COALESCE(v_payment.bahsis_tutari, 0),
      v_earned_points,
      v_spent_points,
      p_actor_id,
      p_sebep
    );

    IF v_payment.randevu_id IS NOT NULL THEN
      UPDATE public.appointments
      SET durum = 'İptal Edildi'::public.appointment_status
      WHERE id = v_payment.randevu_id;
    END IF;

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

REVOKE EXECUTE ON FUNCTION public.settle_or_refund_payment(UUID, TEXT, public.payment_method, UUID, INTEGER, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_or_refund_payment(UUID, TEXT, public.payment_method, UUID, INTEGER, TEXT)
  TO service_role;
