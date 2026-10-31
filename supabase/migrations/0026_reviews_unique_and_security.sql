-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Customer Reviews Appointment Uniqueness (O-5)
-- 0026_reviews_unique_and_security.sql
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_reviews_unique_appointment
  ON public.customer_reviews (randevu_id)
  WHERE randevu_id IS NOT NULL;
