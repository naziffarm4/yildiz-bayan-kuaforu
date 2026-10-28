-- Migration 0007: Galeri Geliştirmesi (Video, Kapak, Açıklama, Stilist) ve Storage Bucket
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS medya_turu TEXT NOT NULL DEFAULT 'image';
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS kapak_url TEXT;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS aciklama TEXT;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS stilist TEXT DEFAULT 'Yıldız Aksoy';

-- Supabase Storage 'salon-media' Public Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-media',
  'salon-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Erişim Politikaları (RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Salon Media Public View' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Salon Media Public View" ON storage.objects FOR SELECT USING (bucket_id = 'salon-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Salon Media Admin Manage' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Salon Media Admin Manage" ON storage.objects FOR ALL USING (bucket_id = 'salon-media');
  END IF;
END $$;
