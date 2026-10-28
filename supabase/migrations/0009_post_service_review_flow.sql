-- Migration 0009: Kasa (POS) Sonrası Otomatik Memnuniyet & Değerlendirme Akışı

-- 1. customer_reviews tablosuna randevu_id ve kaynak sütunlarını ekle
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS randevu_id UUID REFERENCES appointments(id) ON DELETE SET NULL;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS kaynak TEXT DEFAULT 'Hizmet Sonrası';

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_customer_reviews_randevu ON customer_reviews(randevu_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_kaynak ON customer_reviews(kaynak);

-- 3. Public / Anonim Değerlendirme Ekleme İzni (RLS Politikası Doğrulama)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'customer_reviews_public_insert' AND tablename = 'customer_reviews'
  ) THEN
    CREATE POLICY "customer_reviews_public_insert" ON customer_reviews FOR INSERT WITH CHECK (true);
  END IF;
END $$;
