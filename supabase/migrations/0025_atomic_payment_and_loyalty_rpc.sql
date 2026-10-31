-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Atomic POS Payment & Loyalty RPC (Y3)
-- 0025_atomic_payment_and_loyalty_rpc.sql
-- ============================================================================

-- 1. Randevu başına tek ödeme kısıtlaması (mükerrer tahsilatı önler)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_appointment
  ON public.payments (randevu_id)
  WHERE randevu_id IS NOT NULL;

-- 2. Kasa (POS) tahsilat ve sadakat puanı işlemini tek transaction içinde yürüten atomik RPC
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
  v_current_points INTEGER := 0;
  v_inserted_payment public.payments%ROWTYPE;
BEGIN
  -- 1. Müşteri puanı harcanıyorsa bakiyenin yeterli olduğunu kilitleyerek doğrula
  IF p_musteri_id IS NOT NULL AND COALESCE(p_kullanilan_puan, 0) > 0 THEN
    SELECT COALESCE(toplam_puan, 0)
    INTO v_current_points
    FROM public.profiles
    WHERE id = p_musteri_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Müşteri profili bulunamadı.';
    END IF;

    IF v_current_points < p_kullanilan_puan THEN
      RAISE EXCEPTION 'Yetersiz sadakat puanı bakiyesi.';
    END IF;
  END IF;

  -- 2. Ödeme satırını ekle
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
    p_musteri_id,
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

  -- 3. Sadakat puanı hareketlerini ve müşteri profil bakiyesini güncelle
  IF p_musteri_id IS NOT NULL THEN
    IF COALESCE(p_kullanilan_puan, 0) > 0 THEN
      INSERT INTO public.loyalty_ledger (
        musteri_id,
        puan,
        islem_tipi,
        payment_id
      ) VALUES (
        p_musteri_id,
        -p_kullanilan_puan,
        'HARCAMA'::public.loyalty_transaction_type,
        v_inserted_payment.id
      );
    END IF;

    -- Şartname Madde 4: Veresiyede puan tahsilat anında verilir, veresiye açılışında puan kazanılmaz
    IF COALESCE(p_kazanilan_puan, 0) > 0 AND NOT COALESCE(p_veresiye, false) THEN
      INSERT INTO public.loyalty_ledger (
        musteri_id,
        puan,
        islem_tipi,
        payment_id
      ) VALUES (
        p_musteri_id,
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
    WHERE id = p_musteri_id;
  END IF;

  -- 4. Randevu varsa durumunu Tamamlandı olarak güncelle
  IF p_randevu_id IS NOT NULL THEN
    UPDATE public.appointments
    SET durum = 'Tamamlandı'::public.appointment_status
    WHERE id = p_randevu_id;
  END IF;

  RETURN to_jsonb(v_inserted_payment);
END;
$$;

-- 3. Doğrudan tablo yazma yetkilerini kapat; RPC yalnızca sunucu (service_role) üzerinden çağrılabilir
REVOKE INSERT, UPDATE, DELETE ON public.payments, public.loyalty_ledger FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.record_payment_transaction(
  UUID, UUID, UUID, UUID, TEXT[], NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, public.payment_method, NUMERIC, BOOLEAN, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_payment_transaction(
  UUID, UUID, UUID, UUID, TEXT[], NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, public.payment_method, NUMERIC, BOOLEAN, TEXT
) TO service_role;
