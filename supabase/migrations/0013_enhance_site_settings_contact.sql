-- Migration 0013: site_settings tablosuna adres ve google_maps_url alanlarını ekle ve güncelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'adres'
  ) THEN
    ALTER TABLE site_settings
    ADD COLUMN adres TEXT NOT NULL DEFAULT 'Bağdat Caddesi No: 342, Kadıköy / İstanbul';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'google_maps_url'
  ) THEN
    ALTER TABLE site_settings
    ADD COLUMN google_maps_url TEXT NOT NULL DEFAULT 'https://maps.google.com/?cid=8333635848754942930';
  END IF;
END $$;

-- Var olan kaydı güncel kuaför adresi ve harita linkiyle güncelle
UPDATE site_settings
SET
  adres = 'Bağdat Caddesi No: 342, Kadıköy / İstanbul',
  google_maps_url = 'https://maps.google.com/?cid=8333635848754942930'
WHERE id IS NOT NULL;
