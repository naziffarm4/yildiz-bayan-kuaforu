-- 0017_remove_mock_names_and_sync_admin.sql
-- Kurgusal "Yıldız Aksoy" adını kaldırır ve gerçek Admin profil adıyla senkronize eder.

-- Önceki migration'lardan (0007, 0008, 0013) canlı veritabanında eksik kalmış olabilecek sütunları idempotent olarak tamamla
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS medya_turu TEXT NOT NULL DEFAULT 'image';
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS kapak_url TEXT;
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS aciklama TEXT;
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS stilist TEXT DEFAULT 'Yıldız Bayan Kuaförü';
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS begeni_sayisi INTEGER DEFAULT 0;

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS sayfa_metinleri JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adres TEXT NOT NULL DEFAULT 'Bağdat Caddesi No: 342, Kadıköy / İstanbul';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS google_maps_url TEXT NOT NULL DEFAULT 'https://maps.google.com/?cid=8333635848754942930';

ALTER TABLE public.gallery_items
  ALTER COLUMN stilist SET DEFAULT 'Yıldız Bayan Kuaförü';

DO $$
DECLARE
  v_admin_name TEXT;
BEGIN
  SELECT NULLIF(TRIM(COALESCE(ad, '') || ' ' || COALESCE(soyad, '')), '')
  INTO v_admin_name
  FROM public.profiles
  WHERE rol = 'Admin'
    AND TRIM(COALESCE(ad, '') || ' ' || COALESCE(soyad, '')) <> 'Yıldız Aksoy'
  ORDER BY olusturulma_tarihi ASC NULLS LAST
  LIMIT 1;

  IF v_admin_name IS NULL OR v_admin_name = '' THEN
    v_admin_name := 'Yıldız Bayan Kuaförü';
  END IF;

  UPDATE public.gallery_items
  SET stilist = v_admin_name
  WHERE stilist = 'Yıldız Aksoy' OR stilist IS NULL OR TRIM(stilist) = '';

  UPDATE public.site_settings
  SET sayfa_metinleri = REPLACE(
    REPLACE(sayfa_metinleri::text, 'Yıldız Aksoy', v_admin_name),
    'Yıldız Hanım ile Randevu Oluştur →',
    'Randevu Oluştur →'
  )::jsonb
  WHERE sayfa_metinleri IS NOT NULL
    AND (
      sayfa_metinleri::text LIKE '%Yıldız Aksoy%'
      OR sayfa_metinleri::text LIKE '%Yıldız Hanım%'
    );
END $$;
