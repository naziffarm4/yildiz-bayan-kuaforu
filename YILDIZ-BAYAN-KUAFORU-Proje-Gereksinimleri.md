# YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)

## 1. Genel Bakış

**İşletme Adı:** YILDIZ BAYAN KUAFÖRÜ  
**Platformlar:**  
- Website + Mobil Uygulama → Müşteri kullanımı  
- Web Admin/Çalışan Paneli → Personel işlemleri (öncelikli)  
- Mobil Uygulama → Müşteri + personel modu (bildirim + randevu onayı)  
- Electron → İşletme masaüstü (offline destek için yerel veri katmanı gerekir)

**Geliştirme Sırası:** Önce web arayüzü (müşteri + admin/çalışan paneli) mock verilerle tamamlanacak → veritabanı ve backend → mobil → en son Electron.

**Tasarım Notu:** Detaylı görsel tasarım önce web için yapılacak. Mobil ve Electron aynı renk paletini, bileşenleri ve tasarım dilini kullanacak; ekran boyutuna ve platforma göre uyarlanacak.

**Logo:** Şeffaf arka planlı (altın yıldız + pembe saç silüeti + makas).  
**Dil:** Sadece Türkçe.  
**Tasarım:** Standart AI tarzı olmayacak. Zarif, lüks hisli, özgün düzen.

---

## 2. Teknoloji Yığını

| Katman              | Teknoloji                          |
|---------------------|------------------------------------|
| Web                 | Next.js (App Router) + React       |
| UI                  | Tailwind CSS + shadcn/ui           |
| Durum Yönetimi      | Zustand (Küresel Reaktif State)    |
| Canlı Senkronizasyon| Soket / Realtime (Zustand + BroadcastChannel + Supabase WebSockets) |
| Mobil               | React Native (Expo)                |
| Masaüstü            | Electron                           |
| Ortak Bileşenler    | Monorepo (Turborepo / pnpm)        |
| Veritabanı          | Supabase (PostgreSQL)              |
| Kimlik Doğrulama    | Supabase Auth                      |
| Gerçek Zamanlı      | Supabase Realtime                  |
| Dosya Depolama      | Supabase Storage                   |

**Hosting Önerisi:**
- Web (Next.js): Vercel
- Veritabanı + Auth + Realtime + Storage: Supabase
- Mobil: Expo EAS
- Electron: Manuel dağıtım

### 2.1 Kod Kalitesi Kuralları (KESİN KURAL — İstisnasız)

Aşağıdaki kurallar tüm paketler (web, mobil, Electron, ortak paketler, backend) için zorunludur. Bu kontrollerden herhangi biri başarısızsa iş **tamamlanmış sayılmaz**.

- **TypeScript zorunlu:** Tüm kod TypeScript ile yazılır, `strict: true` açıktır (`noImplicitAny`, `strictNullChecks` dahil).
- **`any` YASAK:** Hiçbir dosyada `any` tipi kullanılmaz (açık `any`, `as any`, `any[]`, `Record<string, any>` dahil).
  - Bilinmeyen veri için `unknown` + tip daraltma (type guard / Zod şeması) kullanılır.
  - ESLint kuralı `@typescript-eslint/no-explicit-any: "error"` olarak ayarlanır.
  - `// @ts-ignore`, `// @ts-nocheck` ve `eslint-disable` ile bu kuralı aşmak yasaktır. `// @ts-expect-error` yalnızca açıklama ile ve zorunlu durumlarda kullanılabilir.
- **Lint:** ESLint (+ Prettier) tüm projede çalışır. `pnpm lint` **sıfır hata ve sıfır uyarı** ile geçmelidir.
- **Type-check:** `pnpm type-check` (`tsc --noEmit`) **sıfır hata** ile geçmelidir.
- **Testler:** Her özellik/değişiklik için test yazılır ve `pnpm test` tamamen geçmelidir.
  - Birim testleri: Vitest (web/ortak paketler), Jest (React Native).
  - İş kuralları (komisyon, puan, paket iadesi, kasa hesapları, indirim sırası, randevu çakışması, bekleyen randevu süresi) için birim testleri **zorunludur**.
  - Kritik akışlar (randevu alma, onay, kasa işlemi) için E2E testleri: Playwright.
- **Her görev sonunda sırasıyla çalıştırılır:** `pnpm lint` → `pnpm type-check` → `pnpm test`. Üçü de geçmeden görev teslim edilmez.
- **CI:** Aynı üç kontrol CI'da (GitHub Actions) her push/PR'da çalışır; başarısızsa birleştirme yapılmaz.

### 2.2 Durum Yönetimi ve Canlı Soket Mimarisi (Zustand & Hybrid Socket)
- **Tek Gerçek Kaynak (Single Source of Truth):** Proje genelinde veri parçalanmasını ve Context re-render gecikmelerini önlemek amacıyla reaktif küresel durum yönetimi için **Zustand** kullanılır (`useGalleryStore`, `useReviewStore`, `useAppointmentStore` vb.).
- **Üç Katmanlı Canlı Senkronizasyon (Triple-Sync):**
  1. *İyimser Güncelleme (Optimistic UI - 0ms):* Kullanıcı etkileşimi (beğeni, yorum, randevu onayı) anında bellekteki Zustand store'una işlenir ve arayüze 0 gecikmeyle yansır.
  2. *Yerel Sekmeler Arası Soket (BroadcastChannel API - 0ms):* Aynı tarayıcıda açık olan web ve admin sekmeleri arasında sunucu trafiğine ihtiyaç duymadan anında eşitleme sağlanır.
  3. *Uzak Cihazlar Arası Canlı Soket (Supabase WebSockets & Heartbeat):* Farklı cihazlardaki kullanıcılar ve adminler için singleton Supabase Realtime kanalı ile canlı veri akışı sağlanır; ağ kesintilerine karşı akıllı arka plan kalp atışı (polling fallback) ile verilerin tazeliği güvenceye alınır.

---

## 3. Kullanıcı Rolleri ve Giriş

**Roller:**
- **Admin:** Tam yetki
- **Çalışan:** 
  - Tüm randevuları görebilir ve onaylayabilir
  - Kasa işlemi yapabilir
  - Kendi komisyonunu görebilir
  - Müşteri bilgilerini görebilir
  - Alerji notu erişimi veritabanı düzeyinde (Supabase RLS) kısıtlanır.
- **Müşteri:** Randevu alma, geçmiş görüntüleme, kampanyalar

**Müşteri Profili:**
- Ad, soyad
- Telefon
- E-posta
- Adres (isteğe bağlı)
- Tercih ettiği çalışan (isteğe bağlı)

**Giriş Yöntemleri (Hepsi):**
- Telefon numarası + SMS kodu
- E-posta + şifre
- Google ile giriş

Kayıt olmadan da randevu alınabilir. Ancak kayıtsız randevuda **SMS kodu ile telefon doğrulaması zorunludur**. Sonradan hesap oluşturulabilir.

---

## 4. Randevu Sistemi

- Online randevu, tek takvim
- Çoklu hizmet + çoklu randevu
- Telefon zorunlu + isteğe bağlı not
- Süre hizmete göre otomatik hesaplanır.  
  Çalışana göre değişmez, ancak **admin onay sırasında o randevu için uzatabilir**.
- Hizmetler arasında genel tampon süre vardır (admin ayarlayabilir).
- Çalışma saatleri dışı → WhatsApp / telefon yönlendirme
- Özel günler: Admin tarih seçip o güne özel açılış-kapanış saati girer (**özel gün her zaman önceliklidir**).
- Google İşletme’den saatler varsayılan olarak çekilir.

**Onay Süreci:**
- Admin veya çalışan onaylar
- Çalışan dropdown’dan seçilir (izinli veya hasta olan çalışanlar listede görünmez)
- Çakışma uyarısı gösterilir (yine de onaylanabilir)
- Bir randevuya birden fazla çalışan atanabilir
- Kasa işlemini kim yaptıysa ismi yazılır

**Randevu Durumları:**
`Beklemede` → `Onaylandı` → `Tamamlandı` / `İptal Edildi` / `Gelmedi` / `Süresi Doldu`

**Ek Özellikler:**
- “İlk boş saate al”: Sistem otomatik en yakın uygun saati önerir. Daha erken istenirse WhatsApp/telefon yönlendirmesi yapılır.
- Müşteri iptal/erteleme yapabilir (süre sınırı yok)
- Bekleme listesi **yoktur**.

**Randevusuz Müşteri / Manuel Randevu:**
- Admin veya çalışan randevu oluşturabilir.
- Telefon numarası zorunlu. Kayıtlı değilse otomatik müşteri kaydı oluşturulur.
- Randevu kaynağı seçilir: Telefon / WhatsApp / İşletmeye Geldi (raporlarda ayrı gösterilir).
- Bu randevular hemen onaylı olur.
- Bildirim gider (SMS / WhatsApp / e-posta). **İstisna:** “İşletmeye Geldi” seçildiyse bildirim gitmez.
- Çalışan kendi adına da randevu oluşturabilir.
- Randevusuz gelen müşteri için doğrudan kasa işlemi de açılabilir.

**Çoklu Çalışan:**
- Bir randevuya birden fazla çalışan atanabilir.
- Süre = hizmetlerin toplamı.
- Komisyon hizmet bazında hesaplanır (her hizmeti yapan çalışanın oranına göre).
- Kasada toplam tutar tek seferde alınır, raporda çalışan bazlı dağılım görünür.

**Bekleyen Randevu:**
- Bekleyen randevu slotu geçici olarak bloke eder (varsayılan 30 dakika, admin değiştirebilir).
- Süre **yalnızca çalışma saatleri içinde** işler.
- Süre dolunca otomatik iptal olur, müşteriye bildirim gider ve durum “Süresi Doldu” olarak kaydedilir (iptal oranını etkilemez).

**Paket / Seans:**
- Online paket satışı **yoktur**.
- Sadece salonda satın alınabilir.
- Admin aç/kapa yapabilir.
- Randevu sırasında otomatik düşüm yapılır.
- e-Fatura ayarı açıksa paket satışında da kesilir.
- Paket iadesi: Kalan seans × (müşterinin ödediği net tutar ÷ seans sayısı) üzerinden hesaplanır.

**Sadakat Puanı:**
- Puan, işlem tamamlandığında (tahsilat anında) kazanılır.
- Puanla veya paketle ödenen kısımdan puan kazanılmaz.
- Veresiyede puan tahsilat anında verilir.
- Müşteri hem randevu alırken hem kasa sırasında puanını kullanabilir.

**Gelmedi Durumu:**
- Admin veya çalışan işaretler.
- Müşteriye bildirim gider.

**Bildirimler (SMS + E-posta + WhatsApp):**
- Talep, onay, red, iptal/erteleme
- Hatırlatma: 1 gün önce + 1 saat önce
- Müşteri hangi bildirim kanallarını almak istediğini seçebilir

---

## 5. Kasa Sistemi (Tek Kasa)

- Randevu hizmetleri otomatik gelir
- Hizmet ekleme/çıkarma yapılabilir
- İndirim: yüzde + sabit tutar
- Ödeme yöntemleri ayrı takip: Nakit, Kart (bilgi amaçlı), EFT/Havale
- e-Fatura entegrasyonu (önerilen: Paraşüt). Admin açıp kapatabilir. Açıksa e-fatura düzenlenir, kapalıysa düzenlenmez.
- Gün sonu kapanış + günlük ciro raporu
- Kasa sonrası müşteriye görünmeyen not
- Müşteri geçmişinde işlem + ücret görünür
- İşlemi yapan çalışanın ismi kaydedilir

---

## 6. Çalışan Komisyonu

- Admin her çalışan için ayrı komisyon oranı belirleyebilir.
- Oran yüzde olarak tanımlanır (hizmet tutarı üzerinden).
- İade sonrası mahsup **sonraki hakediş dönemine** yazılır.
- Hakediş dönemi admin tarafından belirlenir (aylık önerilir).

---

## 7. Sadakat Puanı (Öneri)

Admin tarafından açılıp kapatılabilir. Önerilen basit sistem (admin istediği zaman değiştirebilir):

- Her **10 TL** harcamaya **1 puan**
- **100 puan = 50 TL** indirim olarak kullanılabilir
- Puan kazanma ve harcama oranları admin panelinden ayarlanabilir

---

## 8. Kampanya ve Paketler

- Sadakat sistemi (admin aç/kapa)
- Paket / seans satışı (admin aç/kapa veya promosyon)
- Süre bazlı kampanya / indirim kodu
- Aktif kampanyalar ana sayfada görünür

---

## 9. Stok Takibi

- Ürün adı + miktar
- Düşük stok uyarısı
- Tedarikçi bilgisi

---

## 10. Admin Paneli

- Hizmet, çalışan, galeri yönetimi
- Çalışma saatleri + özel günler
- Detaylı dashboard
- Raporlar: Günlük ciro, çalışan bazlı ciro, hizmet bazlı satış, iptal oranı, yeni müşteri sayısı, randevu kaynağı dağılımı ve işletme için gerekli diğer raporlar
- Çalışan performans raporları
- Komisyon yönetimi
- Stok yönetimi
- Kampanya ve sadakat ayarları
- Kasa ve ciro raporları
- Veri dışa aktarma (randevu, müşteri, ciro → Excel / PDF)

---

## 11. Hizmetler

Spa, cilt bakımı ve masaj **hariç** tüm bayan kuaför hizmetleri.  
**Fiyatlar müşteri arayüzünde gösterilmez** (paket ve kampanyalar hariç).

Admin hizmet ekleyebilir, düzenleyebilir ve **pasife alabilir** (silme yoktur).  
Her hizmete ortalama süre tanımlanabilir ve admin tarafından güncellenebilir.

### Örnek Hizmet Listesi (Admin tarafından düzenlenebilir)

| Hizmet                  | Tahmini Süre |
|-------------------------|--------------|
| Saç Kesimi              | 45 dk        |
| Fön                     | 30 dk        |
| Boya                    | 120 dk       |
| Röfle / Balyaj          | 150 dk       |
| Keratin / Botoks        | 180 dk       |
| Saç Kaynak              | 180 dk       |
| Gelin Saçı              | 90 dk        |
| Saç Örgüsü              | 60 dk        |
| Manikür                 | 45 dk        |
| Pedikür                 | 60 dk        |
| Ağda (Kol)              | 20 dk        |
| Ağda (Bacak)            | 30 dk        |
| Saç Bakımı              | 30 dk        |

---

## 12. Renk Paleti (BeautyZone Resmi Salon Paleti)

Proje genelinde referans alınan BeautyZone lüks kuaför salonu tasarım şablonunun orijinal renk paleti esas alınmıştır.

| Kullanım                   | Renk Adı / Tanımı                 | Hex Kodu   | CSS Değişkeni             |
|----------------------------|-----------------------------------|------------|---------------------------|
| **Ana Vurgu (Primary)**    | Canlı Salon Pembesi / Fuşya       | `#ff5ea5`  | `--color-primary`         |
| **Primary Hover**          | Koyu Canlı Pembe                  | `#ed3d8b`  | `--color-primary-hover`   |
| **İkincil Vurgu**          | Canlı Turkuaz / Mint              | `#00becf`  | `--color-secondary`       |
| **Secondary Hover**        | Koyu Turkuaz                      | `#00a9b8`  | `--color-secondary-hover` |
| **Koyu Başlık & Hero**     | Lüks Derin Mürdüm / Bordo         | `#320016`  | `--color-dark`            |
| **TopBar Arka Planı**      | Canlı Salon Pembesi               | `#ff5ea5`  | `--color-bg-topbar`       |
| **Ana Arka Plan**          | Saf Beyaz                         | `#FFFFFF`  | `--color-bg-primary`      |
| **İkincil Arka Plan**      | Lüks Açık Gri / Bej               | `#F8F9FA`  | `--color-bg-secondary`    |
| **Lüks Aksan**             | Soft Altın                        | `#C9A96E`  | `--color-gold`            |
| **Ana Metin**              | Koyu Gri / Nötr                   | `#2C2C2C`  | `--color-text-primary`    |
| **İkincil Metin**          | Orta Gri                          | `#6B6B6B`  | `--color-text-secondary`  |
| **Kenarlık (Border)**      | Açık Gri                          | `#E5E0D8`  | `--color-border`          |
| **Hafif Kenarlık**         | Çok Açık Gri                      | `#F0F0F0`  | `--color-border-light`    |

> **MİMARİ KURAL (Zorunlu):**
> Renkler kesinlikle bileşenler (JSX) içinde hardcoded hex kodları (örn: `bg-[#...]`, `text-[#...]`) olarak **kullanılamaz**. Tüm renkler `apps/web/src/app/globals.css` içerisindeki CSS değişkenlerinde tanımlanır ve Tailwind CSS token'ları (`bg-primary`, `text-dark`, `border-main` vb.) üzerinden çağrılır.

---

## 13. Tasarım Detayları

**Genel:** Zarif ve lüks his. Responsive (önce web). Animasyonlar + lazy loading.

> **Not:** Aşağıdaki tasarım detayları öncelikle web sitesi için geçerlidir. Mobil ve Electron uygulamaları aynı bileşenleri ve renk paletini kullanacak, ancak platforma özel düzenlemeler yapılacaktır.

### Ana Sayfa
- Zarif slider
- Son 5 yorum (Google + site içi karışık, en son eklenenler)
- Akışkan / asimetrik hizmet düzeni
- Aktif kampanyalar
- Galeri önizleme
- Güçlü randevu çağrısı

### Galeri
- Kategorili ızgara
- Scroll ile lazy load (infinite scroll)
- Lightbox

### İletişim
- Adres + Google Harita (yol tarifi)
- Telefon, WhatsApp, form, çalışma saatleri
- Sosyal medya: Instagram, Facebook, TikTok (header, footer, iletişim)

### Hakkımızda
- Hikaye odaklı, görsel ağırlıklı zarif düzen

---

## 14. Gerçek Zamanlı Güncelleme

Sadece randevu, takvim ve personel bildirimleri için sayfa yenilenmeden anında yansır.

---

## 15. Ek Kararlar ve Detaylar

### Yasal
- KVKK aydınlatma metni, açık rıza ve veri silme/dışa aktarma hakkı eklenecek.
- Hesap silindiğinde kişisel veriler anonimleştirilir.  
  **İstisna:** Yüz içeren fotoğraflar ve alerji notları silinir (anonimleştirilemez).
- Kampanya bildirimi olmayacak (sadece randevu bildirimleri).

### Randevu
- Çalışan–hizmet yetkinlik eşleştirmesi olacak.
- Hizmet süresi sabittir (çalışana göre değişmez).  
  Ancak admin onay sırasında o randevu için süreyi uzatabilir.
- Hizmetler arasında tampon süre vardır.
- Çoklu hizmette sıra admin/kuaför tarafından belirlenir.
- Bekleme listesi yoktur.
- Bekleyen randevu slotu geçici bloke eder (varsayılan 30 dk).

### Kasa
- İptal/iade, bahşiş, bölünmüş ödeme, veresiye ve gider girişi olacak.
- Komisyon indirimli tutar üzerinden hesaplanır.
- Puanla ödenen kısım için de komisyon verilir.
- Paket komisyonu seans kullanıldığında doğar.

### Müşteri
- Müşteri kartında boya formülü, alerji notu ve önce/sonra fotoğraf tutulabilir.
- Admin mükerrer müşteri kayıtlarını birleştirebilir.
- Yorum moderasyonu vardır (admin onaylar).

### Stok
- Hizmete bağlı otomatik stok düşümü yapılır.

### Bildirim ve Entegrasyon
- SMS sağlayıcısı admin tarafından seçilebilir (adaptör yapısı).
- WhatsApp Business API entegrasyonu yapılacak.
- Mobil push bildirimi olacak.
- Electron offline çalışabilir (sonra senkronize edilir).

### Diğer
- Otomatik veritabanı yedekleme.
- Denetim kaydı (audit log) tutulacak.
- Gerçek zamanlı güncelleme randevu, takvim ve personel bildirimleri için geçerlidir.
- Doğum günü kampanyası yoktur.

### Teknik Ekler
- **i18n:** Tüm metinler çeviri dosyalarında tutulacak (ileride İngilizce kolay eklenebilsin).
- **Erişilebilirlik:** Temel WCAG uyumu (yeterli kontrast, klavye ile gezinme, görsellere alt metin).
- **Performans:** Ana sayfa yüklenme hedefi 3 saniyenin altında; galeri lazy load.
- **Galeri:** Görsel başına maksimum 5 MB, yüklemede otomatik sıkıştırma.
- **Hata izleme:** Sentry.
- **Analitik:** Plausible (çerezsiz).
- **E-posta servisi:** Resend.
- Admin ve çalışan hesapları için **2FA** (iki adımlı doğrulama) önerilir (zorunlu değil, admin açabilir).

## 16. Diğer Kararlar

- Google İşletme’den saatler ve yorumlar otomatik çekilir.
- Müşteri yorumları moderasyonludur.
- Galeri fotoğraflarına beğeni ve yorum yapılabilir.
- Tek şube.
- Dil şu an Türkçe (i18n hazır).
- Personel işlemleri (onay, kasa) öncelikle web panelinden yapılacak; Electron sonra eklenecek.
- Doğum tarihi toplanmaz (veri minimizasyonu).

## 17. Açık Riskler ve Dikkat Edilmesi Gerekenler

- **Alerji notu** özel nitelikli kişisel veri sayılabilir → ayrı açık rıza ve erişim kısıtlaması gerekir.
- **Anonimleştirme** ile mali kayıtlar yasal saklama süresine tabi olabilir → muhasebeci/avukat ile netleştirilmeli.
- **Yurt dışı veri aktarımı** (Vercel, Supabase) KVKK kurallarına tabi → hukuki değerlendirme önerilir.
- **Electron offline** kapsamı dar tutulacak (öncelikle kasa kaydı + takvim görüntüleme).
- **Vercel** ticari kullanım için Pro plan gerektirir; zamanlanmış görevler için de Pro gerekir.
- SMS ve WhatsApp Business onay süreçleri zaman alabilir.
- OTP SMS’lere rate limit konulmalı.
- Google İşletme API onayı gelmezse manuel girilen saatler geçerli olur.
- e-Arşiv fatura ve yazarkasa (ÖKC) yükümlülüğü muhasebeci ile teyit edilmeli.
- Doğum tarihi toplanmaz.

## 18. Netleşen Kararlar

### Personel Bildirimi
- Yeni randevu talebinde web paneli bildirimi + mobil push + SMS/WhatsApp gider.
- Admin hangi kanalların aktif olacağını seçer.
- Aynı randevuyu birden fazla kişi aynı anda onaylayamaz.  
  İlk onaylayan kazanır, diğerine “Bu randevu zaten onaylandı” mesajı gösterilir.

### Çalışan İzin / Hastalık
- Admin takvim üzerinden tarih seçerek izin veya hasta işaretler.

### Kasa Kuralları
- **Tahsilat** (kasaya giren para) ile **Ciro** (hizmet bazlı gelir) ayrı raporlanır.
- Gün sonu kasa farkı **yalnızca nakit** tahsilat üzerinden hesaplanır (kart ve EFT fiziksel sayılmaz).
- Paket satışında tahsilat hemen, ciro seans kullanıldığında doğar.
- İade ve kapanış sonrası düzeltme **yalnızca admin** yapabilir.  
  Kasa açıkken çalışan sınırlı iade yapabilir (admin belirlediği limite kadar).
- İade: komisyon geri alınır, puan düzeltilir, gerekirse iade faturası kesilir.
- Veresiye yalnızca **kayıtlı (SMS doğrulanmış)** müşteriye verilir.  
  Komisyon **tahsilat anında** doğar.  
  Misafir → kayıtlı geçişi: Hesap açıp SMS doğrulaması yapınca kayıtlı olur.  
  Mükerrer birleştirmede açık veresiye borcu birleşen kayda taşınır.  
  Açık veresiye borcu olan müşteri hesabını silemez (önce borç kapatılmalıdır).
- Bahşiş komisyona dahil edilmez.
- Çalışan indirim limiti admin tarafından belirlenir.
- İndirim kodu + puan + paket birlikte kullanılabilir:  
  Önce paket seansı düşülür → kalan tutara indirim kodu uygulanır → en son puan kullanılır.  
  (Paketle tamamen kapanan kalemde kod ve puan uygulanmaz.)

### Paket
- Paketler **süresizdir**.
- Ciro ve komisyon **seans kullanıldığında** doğar (müşterinin ödediği net tutar ÷ seans sayısı üzerinden).
- Paket iadesi de aynı formülle hesaplanır (kalan seans × net tutar ÷ seans sayısı).
- Kullanılmayan seanslar yanmaz.
- Hesap silme talebinde kalan seans varsa uyarı gösterilir.  
  Seçenekler: iade talep et / seansları kullanana kadar hesabı açık tut.

### İçerik Yönetimi
- Slider, hakkımızda ve iletişim bilgileri admin panelinden düzenlenebilir.

### Galeri
- Beğeni ve yorum için giriş zorunludur.
- Yorumlar admin onayından sonra yayınlanır.

---

**Belge Tarihi:** 17 Ekim 2026  
**Durum:** Yapısal düzenlemeler yapıldı. Ana kurallar tutarlı. Backend’e geçilebilir.

**Not:** Mock arayüz aşamasında ortaya çıkan yeni detaylar bu belgeye doğrudan eklenmeyecek; ayrı bir “Notlar / Değişiklik Talepleri” dosyasında tutulacaktır. Ana gereksinim belgesi stabil kalacaktır.
