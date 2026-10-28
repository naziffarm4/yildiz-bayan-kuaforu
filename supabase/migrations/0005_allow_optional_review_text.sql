-- Migration 0005: Google Metinsiz Puanlama Desteği (Yorum Sütununu Opsiyonel Yapma)
ALTER TABLE customer_reviews ALTER COLUMN yorum DROP NOT NULL;
