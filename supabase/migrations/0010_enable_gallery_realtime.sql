-- Migration 0010: Galeri ve Yorumlar için Supabase Realtime Yayını Etkinleştirme

DO $$
BEGIN
  -- 1. gallery_items tablosunu supabase_realtime yayınına ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'gallery_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gallery_items;
  END IF;

  -- 2. gallery_comments tablosunu supabase_realtime yayınına ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'gallery_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gallery_comments;
  END IF;

  -- 3. customer_reviews tablosunu supabase_realtime yayınına ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'customer_reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE customer_reviews;
  END IF;
END $$;
