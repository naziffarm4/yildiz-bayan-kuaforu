-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Audit Logs & Composite Indexes (Bölüm 15 & P-03)
-- 0021_audit_logs_and_indexes.sql
-- ============================================================================

-- 1. Denetim İzi (Audit Log) Tablosu
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Yalnızca Admin rolü denetim kayıtlarını okuyabilir; UPDATE ve DELETE kapalıdır (değiştirilemez kayıt)
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_staff_or_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_staff_or_admin"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

REVOKE ALL ON public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- 2. Sık Sorgulanan Sütunlar İçin Bileşik İndeksler (P-03)
CREATE INDEX IF NOT EXISTS idx_appointments_durum_tarih
  ON public.appointments (durum, tarih_saat DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_musteri_tarih
  ON public.appointments (musteri_id, tarih_saat DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_comments_item_aktif
  ON public.gallery_comments (gallery_item_id, aktif);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_aktif_tarih
  ON public.customer_reviews (aktif, olusturulma_tarihi DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);
