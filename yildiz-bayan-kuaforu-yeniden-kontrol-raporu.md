# Yıldız Bayan Kuaförü – Yeniden Kontrol Raporu

**Tarih:** 29.10.2026, 16:30 (TSİ)
**Depo:** github.com/naziffarm4/yildiz-bayan-kuaforu
**İncelenen aralık:** `753a9c2..b7ef2b0` (6 yeni commit, 158 dosya, +5755 / −2613 satır)
**Yöntem:** Salt okuma. Hiçbir şey push edilmedi. Testler Node 26.13.0 ve pnpm 9.15.9 ile yapıldı.
**Not:** Aynı saate birden fazla randevu alınabilmesi bilinçli bir tasarım kararıdır, bulgu olarak sayılmadı.

## 1. Özet

**Puan: 8/10** (önceki rapor: 6/10)

Önceki 20 bulgunun durumu:
- **14 düzeltildi.** Kritik bulguların ikisi de kapandı: K1 (girişsiz admin uç noktası) ve K2 (Next 15'e geçiş).
- **6 kısmen düzeltildi.**
- **0 tamamen açık.**

Yeni bulgular: **7** (0 kritik, 1 yüksek, 4 orta, 2 düşük).

| Kontrol | Sonuç |
|---|---|
| `pnpm install --frozen-lockfile` | Başarılı |
| `tsc --noEmit` | 0 hata |
| `next lint` | 0 uyarı |
| Vitest | 21 dosya, **234/234 test geçti** (önceki: 203) |
| `next build` | Başarılı. Ortak JS 103 kB, middleware 94,9 kB, sayfalar 244–271 kB |
| `pnpm audit --prod` | **1 yüksek** (zod). Önceki: 30 açık, bunların 3'ü kritik. |
| `pnpm audit` (geliştirme bağımlılıkları dahil) | 13 açık: 3 kritik (vitest/tinypool), 2 yüksek, 7 orta, 1 düşük. Hepsi yalnızca geliştirme ortamında. |
| Smoke testi (`next start`) | `/`, `/hizmetler`, `/randevu`, `/kvkk`: 200. `/admin`: 307 (giriş sayfasına yönlendirme). |
| Sır taraması (yeni commit'ler) | Yeni bir anahtar veya token bulunmadı. `.env` dosyası izlenmiyor. |

### Yeni commit'ler (saatler TSİ)

| Commit | Saat | Açıklama |
|---|---|---|
| fc08110 | 29.10 06:37 | security: 6 fazlı sertleştirme, RBAC, RLS, CI/CD, KVKK |
| 4277b49 | 15:33 | docs: denetim raporu depoya eklendi |
| 314639b | 15:42 | vercel.json cron tanımları ve KVKK onayı (O6, O8) |
| a1126dc | 15:56 | Geçmiş tarih, aktif hizmet ve çalışma saati doğrulaması (O9, D1) |
| 06adb91 | 16:12 | Next 15.5.28 ve React 19 geçişi (K2) |
| b7ef2b0 | 16:20 | postcss override ≥8.5.23 |

## 2. Önceki bulguların durumu

| ID | Bulgu | Durum | Kanıt |
|---|---|---|---|
| K1 | Girişsiz admin senkronizasyonu | ✅ Düzeltildi | `api/admin/sync/google-reviews/route.ts:7` artık `withAdminAuth` kullanıyor. Canlı test: girişsiz POST isteği `401 Yetkisiz erişim` döndü. |
| K2 | Next 14 CVE'leri | ✅ Düzeltildi | `next ^15.5.28`, `react ^19`. Üretim audit'inde Next ile ilgili açık kalmadı. |
| Y1 | Açık yönlendirme | ✅ Düzeltildi | `lib/safe-redirect.ts` dosyası `//`, `\`, kontrol karakterleri ve farklı origin'leri reddediyor. Canlı test: `next=/\evil.com` isteği `/giris` sayfasına yönlendirdi. |
| Y2 | Hız sınırı ve captcha yok | 🟡 Kısmen | `lib/rate-limit.ts` eklendi, ancak **bellek içi** çalışıyor ve captcha yok (bkz. YN-2). |
| Y3 | Sahte yorumlar doğrudan yayına çıkıyor | 🟡 Kısmen | `api/reviews/route.ts:92` artık `aktif: false` (moderasyon) ve RLS politikası `aktif=false` zorunlu tutuyor. Ancak uç nokta hâlâ girişsiz ve `randevu_id` isteğe bağlı, yani spam moderasyon kuyruğuna düşebilir. |
| Y4 | Galeri yorumları girişsiz ve moderasyonsuz | ✅ Düzeltildi | `api/gallery/comments/route.ts:183` giriş istiyor, satır 242'de `aktif:false`. Ancak onay mekanizması eksik (bkz. YN-3). |
| O1 | Beğeni yarış durumu | 🟡 Kısmen | `gallery_likes` tablosu ve PK ile kullanıcı başına tek beğeni sağlandı. Ancak route hâlâ oku-yaz yapıyor ve atomik `toggle_gallery_like` RPC'sini kullanmıyor (bkz. YN-1 ve YN-4). |
| O2 | CSP ve HSTS yok | ✅ Düzeltildi | `next.config.mjs` CSP, HSTS (preload) ve COOP ekliyor; canlı yanıtta başlıklar görüldü. Zayıf nokta: `'unsafe-eval'` (bkz. YN-6). |
| O3 | Hata mesajı sızıntısı | 🟡 Kısmen | Herkese açık uç noktalar `safeErrorResponse` kullanıyor. Ancak `admin/settings/route.ts:27,34,168`, `admin/sync/...:26` ve `cron/sync-google-reviews:25` hâlâ `err.message` döndürüyor. Bunlar yalnızca admin ve cron uç noktaları, risk düşük. |
| O4 | Telefonla profile bağlama ve `select *` | ✅ Düzeltildi (ana risk) | `api/appointments/route.ts:355-384` oturumsuz isteklerde mevcut profile bağlama yapmıyor. Satır 419'daki `select("*")` yalnızca kullanıcının kendi randevu satırını döndürüyor. Depoda toplam 21 `select("*")` kaldı; optimizasyon olarak daraltılması önerilir. |
| O5 | Calisan rolü tam yetkili | 🟡 Kısmen | Silme, hizmet, galeri ve ayar işlemleri artık yalnızca Admin'de. Ancak `inventory`, `suppliers` ve `upload` uç noktalarında POST/PATCH/DELETE hâlâ `withStaffOrAdminAuth` (personel de yapabiliyor). Bu bilinçli bir karar ise sorun yok. |
| O6 | Cron zamanlanmamış | ✅ Düzeltildi | `vercel.json` eklendi: her 15 dakikada ve her gün 04:00 UTC. Cron route'ları `verifyCronRequest` ile korunuyor (timing-safe karşılaştırma). Not: Vercel **Hobby** planında 15 dakikalık cron'a izin verilmez, Pro plan gerekir (bkz. YN-5). |
| O7 | Eski CRON anahtarı git geçmişinde | 🟡 Açık / doğrulanamadı | Git geçmişi değiştirilmedi. Anahtarın Vercel'de değiştirilip değiştirilmediği depodan görülemiyor. Değiştirilmediyse hâlâ risk var. |
| O8 | KVKK | 🟡 Kısmen | `/kvkk` sayfası (saklama süresi dahil) ve sihirbazdaki onay kutusu eklendi. Ancak sunucu tarafında `kvkkOnay` **isteğe bağlı** (`api/appointments/route.ts:32-33`) ve veritabanına kaydedilmiyor. Bu yüzden onay ispatlanamaz (bkz. YN-7). |
| O9 | Tarih, saat ve süre doğrulaması | ✅ Düzeltildi | Geçmiş tarih, aktif hizmet (satır 305) ve çalışma saati (satır 270-286) sunucuda kontrol ediliyor. Süre hizmetlerden hesaplanıyor. |
| D1 | Gereksiz alanlar, sınırsız metin | ✅ Düzeltildi | zod şemalarında `.max()` sınırları var. |
| D2 | Admin gövde doğrulaması yok | ✅ Düzeltildi | 6 admin route'u `parseJsonBody` ve zod kullanıyor. |
| D3 | Büyük store dosyası | ⚪ Açık (kod kalitesi) | `stores/app-store.ts` 1411 satır. |
| D4 | Node 20 | ✅ Düzeltildi | `.nvmrc` = 22 ve `engines >=22` (bkz. YN-5). |
| D5 | Araç çıktıları depoda | 🟡 Kısmen | `.gitignore` güncellendi ve scriptlerde üretim ortamı koruması var. Ancak 33 `graphify-out` dosyası hâlâ izleniyor. |
| Node bölümü | Node 24/26 hazırlığı | 🟡 Kısmen | Next 15 ve React 19 geçişi tamam. `engines` açık uçlu bırakıldı (YN-5). zod 4 geçişi yapılmadı (YN-6). |

## 3. Yeni bulgular

### YN-1 (Yüksek) – `toggle_gallery_like` fonksiyonu başka kullanıcı adına beğeni yaptırıyor
- **Konum:** `supabase/migrations/0019_gallery_likes_and_constraints.sql`. Fonksiyon `SECURITY DEFINER`, `p_user_id` parametresini dışarıdan alıyor ve `GRANT EXECUTE ... TO authenticated` ile yetkilendirilmiş.
- **Saldırı:** Giriş yapmış herhangi bir kullanıcı, PostgREST üzerinden şu isteği gönderebilir:

  `POST /rest/v1/rpc/toggle_gallery_like {"p_gallery_id":"…","p_user_id":"<başka kullanıcı>"}`

  Fonksiyon RLS'i atladığı için başka kullanıcılar adına beğeni ekleyip kaldırabilir ve sayaçları şişirebilir. Kullanıcı UUID'leri bilinmese bile rastgele UUID'lerle FK hatası alınır. Ancak sızan herhangi bir profil ID'si yeterlidir.
- **Düzeltme:** `p_user_id` parametresini kaldırıp fonksiyon içinde `auth.uid()` kullanın:
```sql
CREATE OR REPLACE FUNCTION public.toggle_gallery_like(p_gallery_id UUID, p_action TEXT DEFAULT 'like')
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid UUID := auth.uid(); ...
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  -- p_user_id yerine v_uid
```
  Alternatif: yetkiyi yalnızca `service_role`'e verin (`REVOKE EXECUTE ... FROM authenticated`). Route zaten service role ile çalışıyor.
- **Efor:** 15 dakika. **Doğrulama:** Normal bir kullanıcı JWT'siyle başka bir `p_user_id` gönderildiğinde hata alınmalı.

### YN-2 (Orta) – Hız sınırı sunucusuz ortamda etkisiz, IP başlığı sahtelenebilir
- **Konum:** `lib/rate-limit.ts:1-13`. Sayaçlar `Map` içinde tutuluyor. Vercel'de her örneğin belleği ayrı olduğu ve soğuk başlangıçta sıfırlandığı için limit pratikte aşılabilir. Idempotency anahtarları da aynı sorunu taşıyor.
- **Ek sorun:** `x-forwarded-for` başlığının ilk değeri kullanılıyor. Vercel dışı bir ortamda veya proxy arkasında bu değer istemci tarafından belirlenebilir.
- **Düzeltme:** Upstash Redis ile `@upstash/ratelimit` kullanın veya limiti Supabase tablosunda tutun. Vercel'de `x-real-ip` ya da `request.ip` tercih edin. Randevu ve yorum formlarına Cloudflare Turnstile ekleyin.
- **Efor:** 2–3 saat.

### YN-3 (Orta) – Galeri yorumlarını onaylayacak bir uç nokta yok
- **Konum:** `api/admin/gallery/comments/route.ts`. Yalnızca GET ve DELETE var, `aktif=true` yapan bir PATCH yok. Yorumlar `aktif:false` olarak kaydediliyor (`api/gallery/comments/route.ts:242`) ve herkese açık GET yalnızca `aktif=true` olanları döndürüyor.
- **Etki:** Hiçbir yorum yayına çıkamıyor. Bu bir işlev hatası; moderasyon akışı yarım kalmış.
- **Düzeltme:** `PATCH = withAdminAuth(...)` ekleyin. Uç nokta `{id, aktif:boolean}` almalı ve `gallery-manager.tsx` dosyasına onay butonu eklenmeli. `recordAuditLog` ile kayıt tutulmalı.
- **Efor:** 1 saat.

### YN-4 (Orta) – Beğeni route'u atomik RPC yerine oku-yaz yapıyor, insert hatasını yok sayıyor
- **Konum:** `api/gallery/like/route.ts:326-389`.
  - Sayaç önce okunuyor (`currentCount`), sonra `currentCount ± 1` yazılıyor. Eşzamanlı isteklerde güncellemeler kaybolabilir.
  - Satır 351'deki insert'in hatası kontrol edilmiyor. Insert başarısız olsa bile sayaç artıyor.
  - Satır 365-377'deki tip dönüşümleri, test mock'larına uydurulmuş bir kod kokusu.
- **Düzeltme:** YN-1 düzeltildikten sonra route'ta tek bir çağrı yeterli:

  `const { data } = await supabase.rpc("toggle_gallery_like", { p_gallery_id: galleryId, p_action: action });`
- **Efor:** 30 dakika.

### YN-5 (Orta) – Node sürümü açık uçlu, Vercel cron sıklığı plana bağlı
- **Konum:** `package.json` içinde `"engines": {"node": ">=22.0.0"}`, `.nvmrc` içinde `22`.
- **Sorun:** Vercel `>=` aralığında desteklenen en yüksek sürümü seçer. Vercel Node 26'yı eklediğinde proje test edilmeden otomatik olarak yükseltilebilir. Ayrıca `.nvmrc` (22) ile Vercel varsayılanı (24) farklı.
- **Düzeltme:** `"node": "24.x"` kullanın, `.nvmrc` dosyasını `24` yapın ve Vercel ayarlarında da 24.x seçin. `packageManager` değeri hâlâ `pnpm@9.4.0`; `pnpm@9.15.9` yapılmalı.
- **Cron notu:** `*/15 * * * *` zamanlaması Hobby planda deploy hatası verir. Plan Hobby ise günde bir kez çalışacak şekilde ayarlayın. Plan bilgisi depodan doğrulanamadı.
- **Efor:** 10 dakika.

### YN-6 (Düşük) – Kalan bağımlılık açıkları ve zayıf CSP
- **zod:** Üretimdeki tek yüksek açık zod'da (bellek tüketimi). `zod ^3.24.2` → `4.6.6` ve üstü gerekiyor. Bu majör bir geçiş; `required_error` gibi API'ler değişti. Ayrı bir PR'da yapın.
- **Geliştirme bağımlılıkları:** vitest 1.6.1, tinypool ve vite'ta 3 kritik açık var. Yalnızca geliştirme ortamını etkiliyor. vitest 3 veya üstüne yükseltin.
- **CSP:** `script-src 'unsafe-inline' 'unsafe-eval'` kullanılıyor. Üretimde `'unsafe-eval'` gereksiz. Nonce tabanlı CSP'ye geçilmesi önerilir.

### YN-7 (Düşük) – Denetim raporları herkese açık depoda, KVKK onayı kaydedilmiyor
- **Raporlar:** `yildiz-bayan-kuaforu-denetim-raporu.md` ve `YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md` depoya commit edildi. Raporlar saldırı adımlarını ve eski CRON anahtarının maskelenmiş ön ekini içeriyor.
  - Açıkların çoğu kapandığı için risk düşük.
  - Ancak YN-1 ve O7 kapanana kadar raporları özel bir yerde tutmak daha güvenli.
  - O7 için CRON_SECRET'ı mutlaka değiştirin.
- **KVKK onayı:** `kvkkOnay` sunucuda isteğe bağlı ve veritabanına yazılmıyor. Şemada `.refine(v => v === true)` ile zorunlu tutun ve `appointments` tablosuna `kvkk_onay_tarihi TIMESTAMPTZ` alanı ekleyin.

## 4. Optimizasyon notları
- First Load JS 87 kB'tan 103 kB'a çıktı. Bu artış React 19 ve Next 15 nedeniyle beklenen bir değişim. Sayfalar 244–271 kB aralığında. En büyük sayfa `/` (271 kB); ağır bileşenler için `next/dynamic` kullanılabilir.
- 21 `select("*")` var; yalnızca gereken sütunları seçmek veri trafiğini azaltır.
- 0021 migration'ındaki indeksler (`appointments(durum, tarih_saat)`, `(musteri_id, tarih_saat)` vb.) yerinde ve iyi bir iyileştirme.
- `app-store.ts` (1411 satır) parçalara ayrılmalı.

## 5. Öncelik listesi
1. **YN-1:** RPC yetki açığı (15 dakika). Önce migration yazılmalı.
2. **O7:** CRON_SECRET'ı değiştirin. Ardından raporları özel bir yere taşımayı değerlendirin (YN-7).
3. **YN-3 ve YN-4:** Yorum onay PATCH uç noktası ve beğeni route'unun RPC'ye geçirilmesi.
4. **YN-5:** `engines` 24.x, `.nvmrc` 24, pnpm sürümü ve cron sıklığının plana göre ayarlanması.
5. **YN-2:** Kalıcı hız sınırı ve Turnstile.
6. **YN-7:** KVKK onayının sunucuda zorunlu tutulup kaydedilmesi.
7. **YN-6:** zod 4 ve vitest 3+ yükseltmeleri, CSP nonce.
8. D3, D5 ve `select("*")` temizliği.

## 6. Doğrulanamayanlar
- Supabase'de migration 0018–0021'in gerçekten uygulanıp uygulanmadığı (canlı veritabanına erişim yok).
- Vercel plan tipi ve ortam değişkenleri (CRON_SECRET değişti mi, en az 32 karakter mi).
- Gerçek Supabase ile giriş ve randevu uçtan uca akışı. Smoke testi sahte ortam değişkenleriyle yapıldı.
