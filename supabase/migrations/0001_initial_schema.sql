-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Supabase Initial Schema & RLS Policies
-- Şartname Bölüm: 2, 3, 4, 5, 6, 7, 9, 11, 14, 15
-- ============================================================================

-- 0. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('Admin', 'Calisan', 'Musteri');
CREATE TYPE appointment_status AS ENUM ('Beklemede', 'Onaylandı', 'Tamamlandı', 'İptal Edildi', 'Gelmedi', 'Süresi Doldu');
CREATE TYPE appointment_source AS ENUM ('Web', 'Telefon', 'WhatsApp', 'İşletmeye Geldi');
CREATE TYPE payment_method AS ENUM ('Nakit', 'Kart', 'Havale_EFT', 'Veresiye');
CREATE TYPE loyalty_transaction_type AS ENUM ('KAZANIM', 'HARCAMA', 'İADE');

-- 1. PROFILES (auth.users referanslı temel kullanıcı tablosu)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    telefon TEXT NOT NULL UNIQUE,
    eposta TEXT,
    rol user_role NOT NULL DEFAULT 'Musteri',
    toplam_puan INTEGER NOT NULL DEFAULT 0 CHECK (toplam_puan >= 0),
    sms_dogrulandi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_profiles_telefon ON profiles(telefon);
CREATE INDEX idx_profiles_rol ON profiles(rol);

-- 2. STAFF DETAILS (Personel detayları ve komisyon)
CREATE TABLE staff_details (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    unvan TEXT NOT NULL,
    komisyon_orani NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (komisyon_orani >= 0 AND komisyon_orani <= 100),
    izinli BOOLEAN NOT NULL DEFAULT FALSE,
    yetkinlik_hizmet_idleri UUID[] NOT NULL DEFAULT '{}'
);

-- 3. CUSTOMER NOTES (Boya formülü ve özel nitelikli alerji notu)
CREATE TABLE customer_notes (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    alerji_notu TEXT,
    boya_formulu TEXT
);

-- 4. SERVICES (Kuaför Hizmetleri)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad TEXT NOT NULL,
    kategori TEXT NOT NULL,
    tahmini_sure_dakika INTEGER NOT NULL CHECK (tahmini_sure_dakika > 0),
    fiyat NUMERIC(10,2) NOT NULL CHECK (fiyat >= 0),
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    aciklama TEXT,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_services_aktif ON services(aktif);
CREATE INDEX idx_services_kategori ON services(kategori);

-- 5. APPOINTMENTS (Randevu Yönetimi)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    musteri_ad_soyad TEXT NOT NULL,
    musteri_telefon TEXT NOT NULL,
    hizmet_idleri UUID[] NOT NULL,
    calisan_idleri UUID[] NOT NULL,
    tarih_saat TIMESTAMPTZ NOT NULL,
    toplam_sure_dakika INTEGER NOT NULL CHECK (toplam_sure_dakika > 0),
    durum appointment_status NOT NULL DEFAULT 'Beklemede',
    kaynak appointment_source NOT NULL DEFAULT 'Web',
    notlar TEXT,
    onaylayan_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_appointments_musteri ON appointments(musteri_id);
CREATE INDEX idx_appointments_tarih ON appointments(tarih_saat);
CREATE INDEX idx_appointments_durum ON appointments(durum);

-- 6. SUPPLIERS (Tedarikçiler)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firma_adi TEXT NOT NULL,
    yetkili_kisi TEXT NOT NULL,
    telefon TEXT NOT NULL,
    whatsapp TEXT,
    eposta TEXT,
    kategoriler TEXT[] NOT NULL DEFAULT '{}',
    adres TEXT,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 7. INVENTORY (Stok Yönetimi)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urun_adi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    miktar NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (miktar >= 0),
    birim TEXT NOT NULL,
    kritik_seviye NUMERIC(10,2) NOT NULL DEFAULT 5 CHECK (kritik_seviye >= 0),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_inventory_kritik ON inventory(miktar, kritik_seviye);

-- 8. PAYMENTS (Kasa ve Tahsilat)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    randevu_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    musteri_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    islemi_yapan_calisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    hizmet_adlari TEXT[] NOT NULL DEFAULT '{}',
    toplam_tutar NUMERIC(10,2) NOT NULL CHECK (toplam_tutar >= 0),
    odenen_tutar NUMERIC(10,2) NOT NULL CHECK (odenen_tutar >= 0),
    indirim_tutari NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (indirim_tutari >= 0),
    kullanilan_puan INTEGER NOT NULL DEFAULT 0 CHECK (kullanilan_puan >= 0),
    odeme_yontemi payment_method NOT NULL DEFAULT 'Nakit',
    bahsis_tutari NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (bahsis_tutari >= 0),
    veresiye BOOLEAN NOT NULL DEFAULT FALSE,
    gizli_not TEXT,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_payments_musteri ON payments(musteri_id);
CREATE INDEX idx_payments_randevu ON payments(randevu_id);
CREATE INDEX idx_payments_tarih ON payments(olusturulma_tarihi);

-- 9. LOYALTY LEDGER (Sadakat Puan Hareketleri)
CREATE TABLE loyalty_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    puan INTEGER NOT NULL,
    islem_tipi loyalty_transaction_type NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_loyalty_musteri ON loyalty_ledger(musteri_id);

-- 10. SITE SETTINGS (Tek Satırlı Salon Ayarları)
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_adi TEXT NOT NULL DEFAULT 'Yıldız Bayan Kuaförü',
    slogan TEXT NOT NULL DEFAULT 'Zarafet ve Güzelliğin Buluşma Noktası',
    telefon TEXT NOT NULL DEFAULT '0555 123 4567',
    whatsapp TEXT NOT NULL DEFAULT '905551234567',
    instagram TEXT NOT NULL DEFAULT '@yildizbayan_kuaforu',
    tiktok TEXT NOT NULL DEFAULT '@yildizbayan_kuaforu',
    facebook TEXT NOT NULL DEFAULT 'yildizbayankuaforu',
    calisma_saatleri JSONB NOT NULL DEFAULT '{"hafta_ici": "09:00 - 19:30", "cumartesi": "09:00 - 20:00", "pazar": "Kapalı"}'::jsonb,
    tampon_sure_dakika INTEGER NOT NULL DEFAULT 15 CHECK (tampon_sure_dakika >= 0),
    blokaj_sure_dakika INTEGER NOT NULL DEFAULT 30 CHECK (blokaj_sure_dakika >= 0),
    hero_baslik TEXT NOT NULL DEFAULT 'Işıltınızı Yıldız ile Keşfedin',
    hero_aciklama TEXT NOT NULL DEFAULT 'Modern saç tasarımları ve kişiye özel profesyonel dokunuşlar.',
    kampanya_metni TEXT NOT NULL DEFAULT 'Tüm saç bakım ve keratin seanslarında %15 bahar indirimi!',
    hakkimizda_hikaye TEXT NOT NULL DEFAULT '20 yılı aşkın mesleki tecrübemiz ile zarafeti ve estetiği birleştiriyoruz.',
    sayfa_metinleri JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sayfa_metinleri JSONB DEFAULT '{}'::jsonb;

-- 11. GALLERY ITEMS (Galeri)
CREATE TABLE gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    baslik TEXT NOT NULL,
    kategori TEXT NOT NULL,
    sira INTEGER NOT NULL DEFAULT 0,
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_gallery_sira ON gallery_items(sira);

-- 12. CUSTOMER REVIEWS (Müşteri Yorumları ve Moderasyon)
CREATE TABLE customer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_adi TEXT NOT NULL,
    yorum TEXT NOT NULL,
    puan INTEGER NOT NULL CHECK (puan >= 1 AND puan <= 5),
    hizmet_turu TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT FALSE, -- Moderasyon: Varsayılan olarak kapalı, admin onaylar
    google_review_url TEXT, -- Orijinal Google yorum bağlantısı
    olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_reviews_aktif ON customer_reviews(aktif);

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
    SELECT rol FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.get_auth_user_role() = 'Admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.get_auth_user_role() IN ('Admin', 'Calisan'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self_or_staff"
ON profiles FOR SELECT
USING (auth.uid() = id OR public.is_staff_or_admin());

CREATE POLICY "profiles_insert_self"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self_or_admin"
ON profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- STAFF DETAILS
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_details_select"
ON staff_details FOR SELECT
USING (public.is_admin() OR (public.is_staff_or_admin() AND auth.uid() = profile_id));

CREATE POLICY "staff_details_manage_admin"
ON staff_details FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- CUSTOMER NOTES (Müşteriler asla erişemez, sadece Çalışan ve Admin)
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_notes_staff_and_admin_all"
ON customer_notes FOR ALL
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

-- SERVICES (Herkes okur, sadece admin yönetir)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_public_select"
ON services FOR SELECT
USING (TRUE);

CREATE POLICY "services_admin_manage"
ON services FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- APPOINTMENTS (Müşteri kendi randevusunu görür ve ekler; personel hepsini yönetir)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select"
ON appointments FOR SELECT
USING (auth.uid() = musteri_id OR public.is_staff_or_admin());

CREATE POLICY "appointments_insert"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = musteri_id OR public.is_staff_or_admin());

CREATE POLICY "appointments_update"
ON appointments FOR UPDATE
USING (public.is_staff_or_admin() OR auth.uid() = musteri_id)
WITH CHECK (public.is_staff_or_admin() OR auth.uid() = musteri_id);

CREATE POLICY "appointments_delete_admin"
ON appointments FOR DELETE
USING (public.is_admin());

-- SUPPLIERS (Sadece çalışan ve admin)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_staff_select"
ON suppliers FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "suppliers_staff_manage"
ON suppliers FOR ALL
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

-- INVENTORY (Sadece çalışan ve admin)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_staff_select"
ON inventory FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "inventory_staff_manage"
ON inventory FOR ALL
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

-- PAYMENTS (Sadece çalışan ve admin)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_staff_select"
ON payments FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "payments_staff_manage"
ON payments FOR ALL
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

-- LOYALTY LEDGER
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_select_self_or_staff"
ON loyalty_ledger FOR SELECT
USING (auth.uid() = musteri_id OR public.is_staff_or_admin());

CREATE POLICY "loyalty_manage_staff"
ON loyalty_ledger FOR ALL
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

-- SITE SETTINGS (Herkes okur, sadece admin düzenler)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_select"
ON site_settings FOR SELECT
USING (TRUE);

CREATE POLICY "site_settings_admin_manage"
ON site_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- GALLERY ITEMS (Herkes okur, admin yönetir)
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_items_public_select"
ON gallery_items FOR SELECT
USING (TRUE);

CREATE POLICY "gallery_items_admin_manage"
ON gallery_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- CUSTOMER REVIEWS (Aktif olanları herkes okur, pasifleri ve yönetimi admin yapar)
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_reviews_select"
ON customer_reviews FOR SELECT
USING (aktif = TRUE OR public.is_admin());

CREATE POLICY "customer_reviews_insert"
ON customer_reviews FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "customer_reviews_manage_admin"
ON customer_reviews FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- SUPABASE POSTGRESQL ROLLERİ İÇİN ŞEMA VE TABLO ERİŞİM YETKİLERİ (GRANT)
-- ============================================================================

-- Supabase Standart Rolleri için Tablo ve Şema Erişim Yetkileri
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Gelecekte oluşturulacak tüm tablolar için otomatik yetkilendirme
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
