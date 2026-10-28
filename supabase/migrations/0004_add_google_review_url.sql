-- ============================================================================
-- Migration 0004: Google Doğrulanmış Yorum Bağlantısı Ekleme
-- ============================================================================

ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS google_review_url TEXT;

-- 3 Doğrulanmış Google Yorum Linkinin Güncellenmesi
UPDATE customer_reviews
SET google_review_url = 'https://share.google/Ecq4YeYWcyOD1XNDn'
WHERE musteri_adi = 'Selin Doğan';

UPDATE customer_reviews
SET google_review_url = 'https://share.google/4sHXUzq8HV2fIVqoc'
WHERE musteri_adi = 'Deniz Yılmaz';

UPDATE customer_reviews
SET google_review_url = 'https://share.google/mdjSlYWTmShVQbEMJ'
WHERE musteri_adi = 'Gizem Vural';
