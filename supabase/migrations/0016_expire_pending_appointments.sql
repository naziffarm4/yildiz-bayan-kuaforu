-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Faz 2: Bekleyen Randevu Otomatik Süre Dolumu
-- 0016_expire_pending_appointments.sql
-- Şartname Madde 4 & 15:
-- "Bekleyen randevu slotu geçici olarak bloke eder (varsayılan 30 dakika,
-- admin değiştirebilir). Süre dolunca otomatik iptal olur ve durum
-- 'Süresi Doldu' olarak kaydedilir (iptal oranını etkilemez)."
-- ============================================================================

CREATE OR REPLACE FUNCTION public.expire_pending_appointments()
RETURNS INTEGER AS $$
DECLARE
  v_timeout_minutes INTEGER;
  v_expired_count INTEGER := 0;
BEGIN
  SELECT COALESCE(s.blokaj_sure_dakika, s.tampon_sure_dakika, 30)
  INTO v_timeout_minutes
  FROM public.site_settings s
  LIMIT 1;

  IF v_timeout_minutes IS NULL OR v_timeout_minutes <= 0 THEN
    v_timeout_minutes := 30;
  END IF;

  WITH expired AS (
    UPDATE public.appointments
    SET durum = 'Süresi Doldu'
    WHERE durum = 'Beklemede'
      AND olusturulma_tarihi <= (NOW() - make_interval(mins => v_timeout_minutes))
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_expired_count FROM expired;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_pending_appointments() TO service_role;
