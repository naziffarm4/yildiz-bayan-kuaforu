-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - KVKK Consent Timestamp (YN-7)
-- 0023_appointments_kvkk_consent.sql
-- ============================================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS kvkk_onay_tarihi TIMESTAMPTZ;
