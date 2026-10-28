-- Migration 0008: Galeri Beğeni ve Yorum Tablosu (Likes & Comments)

-- 1. gallery_items tablosuna begeni_sayisi sütunu ekle (varsa koru)
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS begeni_sayisi INTEGER DEFAULT 0;

-- 2. gallery_comments tablosu
CREATE TABLE IF NOT EXISTS gallery_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_item_id UUID NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
    musteri_adi TEXT NOT NULL,
    yorum TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT true,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_gallery_comments_item ON gallery_comments(gallery_item_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_aktif ON gallery_comments(aktif);

-- 3. Row Level Security (RLS)
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'gallery_comments_public_select' AND tablename = 'gallery_comments'
  ) THEN
    CREATE POLICY "gallery_comments_public_select" ON gallery_comments FOR SELECT USING (aktif = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'gallery_comments_public_insert' AND tablename = 'gallery_comments'
  ) THEN
    CREATE POLICY "gallery_comments_public_insert" ON gallery_comments FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'gallery_comments_admin_manage' AND tablename = 'gallery_comments'
  ) THEN
    CREATE POLICY "gallery_comments_admin_manage" ON gallery_comments FOR ALL USING (public.is_admin());
  END IF;
END $$;
