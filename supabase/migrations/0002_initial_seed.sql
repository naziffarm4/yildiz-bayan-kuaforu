-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Başlangıç Verileri (Seed Data)
-- %100 Otomatik UUID Mimarisi (gen_random_uuid())
-- ============================================================================

-- 1. SİTE AYARLARI
INSERT INTO site_settings (
    salon_adi,
    slogan,
    telefon,
    whatsapp,
    instagram,
    tiktok,
    facebook,
    calisma_saatleri,
    tampon_sure_dakika,
    blokaj_sure_dakika,
    hero_baslik,
    hero_aciklama,
    kampanya_metni,
    hakkimizda_hikaye
) VALUES (
    'YILDIZ BAYAN KUAFÖRÜ',
    'Zarif Dokunuşlar, Kusursuz Güzellik',
    '+90 216 555 00 00',
    '+90 532 999 10 20',
    '@yildizbayankuaforu',
    '@yildizkuafor',
    'Yıldız Bayan Kuaförü',
    '{"hafta_ici": "09:00 - 20:00", "cumartesi": "09:00 - 20:30", "pazar": "10:00 - 18:00 (Özel Randevulu)"}'::jsonb,
    15,
    30,
    'Zarafet ve Ustalığın Kişiselleştirilmiş Buluşması',
    'YILDIZ BAYAN KUAFÖRÜ’nde her dokunuş saç dokunuza ve tarzınıza özel tasarlanır. Kusursuz balyaj, tasarım kesim, haute couture gelin saçları ve spa bakımlarıyla sıra beklemeden, huzur dolu lüks bir atmosferde güzelliğinizi taçlandırın.',
    'Tüm saç bakım ve keratin seanslarında %15 bahar indirimi!',
    'YILDIZ BAYAN KUAFÖRÜ, İstanbul''un kalbi Bağdat Caddesi''nde, kalabalık ve gürültülü salon alışkanlıklarını geride bırakmak amacıyla kuruldu. Amacımız fabrikasyon kesim ve boyalar değil; yüz hatlarınızı, ten alt tonunuzu ve yaşam tarzınızı kusursuzca yansıtan haute couture saç tasarımları üretmektir.'
);

-- 2. HİZMETLER
INSERT INTO services (ad, kategori, tahmini_sure_dakika, fiyat, aktif, aciklama)
VALUES
    ('Tasarım Saç Kesimi & Şekillendirme', 'Saç Tasarımı', 45, 650.00, true, 'Yüz hatlarınıza ve saç dokunuza özel analiz, şampuan masajı ve editorial fön dokunuşu.'),
    ('Klasik & Hacimli Moda Fönü', 'Saç Tasarımı', 30, 300.00, true, 'İpeksi parlaklık kazandıran fırça tekniği, doğal hacim ve gün boyu kalıcı sabitleyici bakım.'),
    ('Dip Boya & Parlaklık Glaze', 'Renklendirme', 75, 1100.00, true, 'Amonyaksız organik pigmentler ile kusursuz beyaz kapama ve parlaklık kürü.'),
    ('Komple Röfle / Balyaj / French Ombre', 'Renklendirme', 150, 2800.00, true, 'Güneşten açılmış gibi doğal ton geçişleri, bağ güçlendirici Olaplex koruması ve kişiye özel tonlama.'),
    ('Keratin Botoksu & Derin Moleküler Bakım', 'Bakım & Tedavi', 150, 2400.00, true, 'Yıpranmış saç liflerini onaran, elektriklenmeyi önleyen ve 4 aya kadar ipeksi pürüzsüzlük sunan yoğun kür.'),
    ('Haute Couture Gelin Saçı & Duvak Tasarımı', 'Özel Gün', 90, 3200.00, true, 'Gelinlik silüetinize, yaka kesimine ve yüzünüze özel tasarlanan, prova dahil lüks topuz ve dalga tasarımı.'),
    ('Medikal Manikür & Kalıcı CND Oje', 'El & Ayak Bakımı', 50, 550.00, true, 'Kuru manikür tekniğiyle kusursuz tırnak eti temizliği, tırnak plağı güçlendirme ve 3 hafta kalıcı parlaklık.'),
    ('Aromaterapik Spa Pedikür', 'El & Ayak Bakımı', 60, 650.00, true, 'Deniz tuzu banyosu, ölü deri arındırıcı peeling, nemlendirici parafin maskesi ve tırnak şekillendirme.'),
    ('İpek Kirpik & Kaş Laminasyon Mimarisi', 'Bakım & Tedavi', 70, 950.00, true, 'Birebir tekli takılan hafif ipek kirpikler ve kaşlara yukarı doğru taranmış dolgun form veren keratin laminasyon.');

-- 3. TEDARİKÇİLER
INSERT INTO suppliers (firma_adi, yetkili_kisi, telefon, whatsapp, eposta, kategoriler, adres)
VALUES
    ('L''Oréal Türkiye Profesyonel', 'Canan Yılmaz', '+90 216 444 57 32', '+90 532 111 22 33', 'siparis@loreal-pro.com.tr', ARRAY['Boya & Oksidan', 'Şampuan & Bakım'], 'Maslak No: 15, Sarıyer / İstanbul'),
    ('Doğan Kozmetik Ltd.', 'Ahmet Doğan', '+90 212 555 90 80', '+90 533 444 55 66', 'info@dogankozmetik.com', ARRAY['Bakım & Tedavi', 'Olaplex', 'Moroccanoil'], 'Şişli Merkez Mah. No: 44, İstanbul');

-- 4. STOK KALEMLERİ
INSERT INTO inventory (urun_adi, kategori, miktar, birim, kritik_seviye, supplier_id)
VALUES
    ('L''Oréal Professionnel İnoa Saç Boyası No: 7.1', 'Boya & Oksidan', 4, 'Tüp', 6, (SELECT id FROM suppliers WHERE firma_adi = 'L''Oréal Türkiye Profesyonel' LIMIT 1)),
    ('Olaplex No. 1 Bond Multiplier Keratin Koruyucu', 'Bakım & Tedavi', 3, 'Şişe (525ml)', 5, (SELECT id FROM suppliers WHERE firma_adi = 'Doğan Kozmetik Ltd.' LIMIT 1)),
    ('Schwarzkopf Blondme Toz Açıcı 450gr', 'Açıcı & Röfle', 14, 'Kutu', 5, (SELECT id FROM suppliers WHERE firma_adi = 'L''Oréal Türkiye Profesyonel' LIMIT 1)),
    ('CND Shellac Kalıcı Oje - Romantique', 'Tırnak & Bakım', 8, 'Adet', 3, (SELECT id FROM suppliers WHERE firma_adi = 'Doğan Kozmetik Ltd.' LIMIT 1)),
    ('Moroccanoil Treatment Saç Bakım Yağı 100ml', 'Şampuan & Yağ', 18, 'Şişe', 6, (SELECT id FROM suppliers WHERE firma_adi = 'Doğan Kozmetik Ltd.' LIMIT 1));

-- 5. GALERİ
INSERT INTO gallery_items (url, baslik, kategori, sira)
VALUES
    ('https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=80', 'Altın Bal Balyaj & Editorial Dalgalar', 'Renklendirme & Balyaj', 1),
    ('https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80', 'Vogue Tarzı Katlı Kesim & Hacimli Fön', 'Saç Tasarım', 2),
    ('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=1000&q=80', 'Romantik Fransız Örgü & Gelin Tacı', 'Gelin & Topuz', 3),
    ('https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80', 'Minimalist Nude & Rose Gold Nail Art', 'Nail Art & Spa', 4),
    ('https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1000&q=80', 'Platin İncisi Ombre & Keratin Botoks', 'Renklendirme & Balyaj', 5),
    ('https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80', 'Haute Couture Düşük Ense Topuzu', 'Gelin & Topuz', 6);

-- 6. MÜŞTERİ YORUMLARI (Onaylı / Aktif)
INSERT INTO customer_reviews (musteri_adi, yorum, puan, hizmet_turu, aktif, google_review_url)
VALUES
    ('Selin Doğan', 'Yıldız Hanım''ın saç kesimi ve balyajdaki ustalığı inanılmaz. Salonun temizliği, nezaketi ve ikramları kendinizi çok özel hissettiriyor.', 5, 'Tasarım Kesim & Balyaj', true, 'https://share.google/Ecq4YeYWcyOD1XNDn'),
    ('Büşra Çelik', 'Düğün günüm için gelin saçımı Merve Hanım tasarladı, gece boyunca hiç bozulmadı ve herkes hayran kaldı. İyi ki varsınız!', 5, 'Gelin Saçı & Duvak', true, NULL),
    ('Deniz Yılmaz', 'Keratin bakımı sonrası saçlarım ipek gibi oldu. Online randevu alıp beklemeden doğrudan koltuğa geçmek büyük konfor.', 5, 'Keratin Botoksu', true, 'https://share.google/4sHXUzq8HV2fIVqoc'),
    ('Aylin Karaca', 'Medikal manikür ve kalıcı oje için tek adresim Seda Hanım. Titizlik ve hijyen standartları 10 numara.', 5, 'Medikal Manikür', true, NULL),
    ('Gizem Vural', 'Bağdat Caddesi''nin en nezih ve kaliteli kuaförü. Fönün kalıcılığı ve kullanılan ürünlerin kokusu bile fark yaratıyor.', 5, 'Moda Fönü', true, 'https://share.google/mdjSlYWTmShVQbEMJ');
