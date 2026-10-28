-- 0017_remove_mock_names_and_sync_admin.sql
-- Kurgusal "Yıldız Aksoy" adını kaldırır ve gerçek Admin profil adıyla senkronize eder.

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
