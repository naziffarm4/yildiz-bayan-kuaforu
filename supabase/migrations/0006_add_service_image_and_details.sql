-- Migration 0006: Hizmetler Tablosuna Görsel, Detay ve Sıralama Sütunlarının Eklenmesi

ALTER TABLE services ADD COLUMN IF NOT EXISTS gorsel_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS detay TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sira INTEGER DEFAULT 0;

-- 9 Mevcut Hizmetin Haute Coiffure Görselleri ve Sıralarının Güncellenmesi
UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
    sira = 1
WHERE ad LIKE '%Tasarım Saç Kesimi%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    sira = 2
WHERE ad LIKE '%Klasik%Fön%' OR ad LIKE '%Moda Fönü%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    sira = 3
WHERE ad LIKE '%Dip Boya%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    sira = 4
WHERE ad LIKE '%Röfle%' OR ad LIKE '%Balyaj%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
    sira = 5
WHERE ad LIKE '%Keratin%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=800&q=80',
    sira = 6
WHERE ad LIKE '%Gelin Saçı%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    sira = 7
WHERE ad LIKE '%Medikal Manikür%' OR ad LIKE '%Manikür%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80',
    sira = 8
WHERE ad LIKE '%Pedikür%';

UPDATE services
SET gorsel_url = 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=800&q=80',
    sira = 9
WHERE ad LIKE '%Kirpik%' OR ad LIKE '%Laminasyon%';
