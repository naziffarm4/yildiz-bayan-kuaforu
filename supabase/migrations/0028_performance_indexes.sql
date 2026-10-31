-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Performance Indexes (Bölüm 5)
-- 0028_performance_indexes.sql
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_olusturulma_tarihi
  ON public.payments (olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_musteri_telefon
  ON public.appointments (musteri_telefon);
