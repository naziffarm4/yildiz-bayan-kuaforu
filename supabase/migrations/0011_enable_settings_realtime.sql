-- Migration 0011: site_settings tablosunu supabase_realtime yayınına ekle

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  END IF;
END $$;
