# YILDIZ BAYAN KUAFÖRÜ — Güvenlik, Optimizasyon ve Kod Kalitesi İnceleme Raporu

| | |
|---|---|
| **Depo** | `github.com/naziffarm4/yildiz-bayan-kuaforu` |
| **İncelenen commit** | `753a9c2` (fix(db): ensure gallery_items and site_settings columns exist in 0017 migration) |
| **Rapor tarihi** | 29 Ekim 2026 |
| **Kapsam** | `apps/web`, `packages/ui`, `packages/types`, `supabase/migrations`, `scripts`, yapılandırma dosyaları |
| **Yöntem** | Statik kod incelemesi + `pnpm install --frozen-lockfile`, `pnpm audit`, `pnpm type-check`, `pnpm lint`, `pnpm test` çalıştırıldı |
| **Kapsam dışı** | Canlı Supabase/Vercel ortamı, canlı RLS davranışı, Google Cloud/Supabase panel ayarları (aşağıda "doğrulanmalı" olarak işaretlendi) |

---

## 1. Yönetici Özeti

Kod tabanı disiplinli: lint 0 uyarı, type-check temiz, 203 test geçiyor, `any` ve `console.log` kullanımı yok, admin API'lerinin çoğu merkezi bir guard ile korunuyor ve oturum çerez tabanlı (`@supabase/ssr`), token'lar `localStorage`'a yazılmıyor. Ancak **canlıya çıkmadan önce kapatılması gereken** bulgular var:

| # | Önem | Bulgu |
|---|------|-------|
| G-01 | 🔴 Kritik | `next@14.2.35` için `pnpm audit`: **3 kritik, 9 yüksek** zafiyet; düzeltmeler yalnızca 15.5.x hattında |
| G-02 | 🔴 Yüksek | `/api/admin/sync/google-reviews` **kimlik doğrulamasız** → Google API kotası/maliyet suistimali ve DB yazımı |
| G-03 | 🔴 Yüksek | Müşteri, kendi `profiles` satırında `toplam_puan` ve `sms_dogrulandi` alanlarını doğrudan REST ile değiştirebilir |
| G-04 | 🔴 Yüksek | SMS ile giriş **sahte**: kod istemcide üretiliyor, ekranda gösteriliyor; üretimde hiç SMS gitmiyor; geliştirme modunda Admin kimliği taklit edilebiliyor |
| G-05 | 🟠 Orta-Yüksek | Herkese açık yazma uçları (yorum, değerlendirme, beğeni) moderasyonu ve şartnameyi **atlıyor**, hız sınırı yok |
| G-06 | 🟠 Orta-Yüksek | `/api/appointments`: telefon bilgisiyle başkasının hesabına randevu eklenebilir; doğrulama/çakışma/hız sınırı yok |
| G-07 | 🟠 Orta | `/auth/callback` açık yönlendirme (open redirect) — `next=/\evil.com` ile doğrulandı |
| G-08 | 🟠 Orta | RLS'in "yalnızca Admin" niyeti `service_role` kullanan API'lerde devre dışı: **Çalışan** her şeyi silebilir/değiştirebilir |

Güvenlik dışında en büyük kazanç alanları: sitenin tamamen istemci tarafında render edilmesi (SEO/LCP), Realtime olaylarında tam yeniden yükleme ve 50 MB yüklemenin Vercel sınırına takılması.

---

## 2. Otomatik Kalite Kapısı Sonuçları

| Kontrol | Sonuç |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ Başarılı |
| `pnpm type-check` | ✅ 3/3 paket temiz |
| `pnpm lint` (`--max-warnings 0`) | ✅ 0 hata, 0 uyarı |
| `pnpm test` | ✅ 21 dosya / 203 test geçti (web) |
| `any`, `@ts-ignore`, `eslint-disable` | ✅ 0 kullanım |
| `console.log` | ✅ 0 kullanım |
| Kaynak kodda sır / anahtar | ✅ Bulunmadı (`eyJ…`, `AIza…`, `sb_secret…` taraması) |
| `pnpm audit` (tümü) | ❌ 43 bulgu: 6 kritik, 14 yüksek, 20 orta, 3 düşük |
| `pnpm audit --prod` | ❌ 27 bulgu: **3 kritik, 12 yüksek**, 13 orta, 2 düşük (hepsi `next`, `postcss`, `zod`) |

---

## 3. Güvenlik Bulguları

### G-01 🔴 Next.js 14.2.35 — düzeltilmemiş kritik/yüksek zafiyetler

`apps/web/package.json` → `next ^14.2.5`, kilit dosyada `14.2.35`. Bu, 14.x hattının son sürümü; ancak `pnpm audit` aşağıdaki zafiyetleri **yalnızca 15.5.x ve üstünde** düzeltilmiş gösteriyor.

Kritik (3):
- Image Optimization API — AVIF dosyalarıyla kimlik doğrulamasız RCE (GHSA-2xp9-vwfh-vxw4, düzeltme ≥15.5.24)
- Image Optimization API — SVG dosyalarıyla kimlik doğrulamasız RCE (GHSA-2464-fhr4-w9xw, düzeltme ≥15.5.28)
- Windows barındırmalı sunucularda kimlik doğrulamasız RCE (GHSA-p293-qw3h-jr36) — Vercel/Linux'ta geçerli değil

Yüksek (9, seçilmiş): Server Components / Server Actions DoS, WebSocket upgrade SSRF, rewrites SSRF, custom server SSRF.

**Uygulanabilirlik notu:** Projede `rewrites` ve Server Actions kullanımını görmedim; Windows RCE Vercel'de geçerli değil. Ancak `next.config.mjs` görsel optimizasyonunu `*.supabase.co` / `*.supabase.in` / `images.unsplash.com` için açık tutuyor, yani Image Optimizer zafiyetleri **sizin yapılandırmanız için geçerli olabilir**. Her durumda 14.x hattında yama çıkmayacağı için yükseltme gerekiyor.

**Çözüm:** `next` ≥ 15.5.28 (güncel 15.5.x yaması) sürümüne geçin. Göç notları:
- App Router, Next 15'te **React 19** gerektirir (`react`, `react-dom`, `@types/react*`).
- `cookies()` artık **asenkron**: `lib/supabase/server.ts`, `lib/auth/api-guard.ts`, `auth/callback/route.ts`, `api/appointments`, `api/gallery/like` etkilenir (`await cookies()`; `createClient()` async olacak).
- `pnpm dlx @next/codemod@canary upgrade latest` çoğu değişikliği otomatik yapar.
- Geçiş tamamlanana kadar geçici önlem: `images.remotePatterns` listesini daraltın (özel `*.supabase.co` yerine kendi proje alt alan adınız), AVIF formatını `images.formats` ile kapatın.

Diğer bağımlılıklar:
- `zod@3.25.76` — oversized collection DoS (yüksek). Zod 4.6.6+ gerektiriyor; en azından istek gövdelerine boyut sınırı koyun.
- `postcss@8.4.31` (next içinde) — Next yükseltmesiyle gelir.
- `vitest@1.6.1` / `vite` / `tinypool` / `esbuild` — yalnızca geliştirme bağımlılığı; Vitest 3.2.6+ sürümüne geçin. Üretimi etkilemez, CI/geliştirici makinesini etkiler.
- Otomatik takip yok (`.github/` dizini yok) → Dependabot veya Renovate ekleyin.

---

### G-02 🔴 `/api/admin/sync/google-reviews` — kimlik doğrulaması yok

Dosya: `apps/web/src/app/api/admin/sync/google-reviews/route.ts`

Diğer 9 `/api/admin/*` rotasının tamamı `withStaffOrAdminAuth` ile korunuyor; bu rota **korunmuyor**. `GET` ve `POST` herkese açık ve `?force=true` ile 6 saatlik kota korumasını atlıyor.

Etkisi: (1) Google Places API faturası/kotası tüketilebilir, (2) servis anahtarıyla `site_settings` ve `customer_reviews` tablolarına yazılır, (3) Google'dan gelen yorumlar `aktif: true` ile eklenir.

```ts
// düzeltme
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
export const POST = withStaffOrAdminAuth(async (request) => { /* mevcut gövde */ });
// GET'i kaldırın (yan etkili işlem GET olmamalı)
```

Ek olarak: Google Cloud Console'da API anahtarını yalnızca **Places API (New)** ile ve sunucu IP'sine/yönlendirene göre kısıtlayın; günlük kota üst sınırı koyun.

Kalıcı önlem: `app/api/admin/**/route.ts` dosyalarını tarayıp hepsinin guard kullandığını doğrulayan bir test ekleyin (bu açık mevcut testlerde yakalanmamış).

---

### G-03 🔴 `profiles` tablosunda self-update ile puan / doğrulama değiştirme

Dosyalar: `supabase/migrations/0001_initial_schema.sql` (profiles politikası), `0012_auth_trigger_and_security.sql`

`profiles_update_self_or_admin` politikası ve `prevent_self_role_escalation` tetikleyicisi yalnızca **`rol`** alanını koruyor. Anon anahtarı herkese açık olduğundan, giriş yapmış herhangi bir müşteri tarayıcı konsolundan şunu çalıştırabilir:

```js
await supabase.from("profiles").update({ toplam_puan: 999999, sms_dogrulandi: true }).eq("id", myId)
```

Sadakat puanı iş kuralı olduğu için (şartname: komisyon, puan, kasa) bu doğrudan para/indirim riski. `telefon` ve `eposta` da serbestçe değiştirilebiliyor; `telefon` alanı misafir profil devralma ve randevu eşleştirmede kullanılıyor.

**Çözüm (iki katmanlı):**
```sql
-- 1) Sütun bazlı yetki: yalnızca güvenli alanlar güncellenebilsin
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT  UPDATE (ad, soyad, eposta) ON public.profiles TO authenticated;
-- telefon değişikliği doğrulama (OTP) gerektirdiği için ayrı bir sunucu uç noktasından yapılmalı

-- 2) Tetikleyici ile korunan alanlar
IF NEW.toplam_puan IS DISTINCT FROM OLD.toplam_puan
   OR NEW.sms_dogrulandi IS DISTINCT FROM OLD.sms_dogrulandi THEN
  IF NOT (public.is_admin() OR current_user = 'service_role') THEN
    RAISE EXCEPTION 'Yetkisiz alan değişikliği';
  END IF;
END IF;
```
Admin ve Çalışan için puan değişikliği yalnızca sunucu tarafında (`loyalty_ledger` üzerinden) yapılmalı.

---

### G-04 🔴 Giriş akışı: SMS doğrulama sahte, geliştirme arka kapıları kodda

Dosyalar: `app/giris/page.tsx`, `lib/auth-context.tsx`, `stores/auth-store.ts`

1. **Kod istemcide üretiliyor ve ekranda gösteriliyor.** `handleSendOtp` kodu `Math.random()` ile üretir, "Doğrulama Kodu:" rozetinde gösterir ve "(Otomatik Doldur)" düğmesi sunar. Hiçbir yerde `supabase.auth.signInWithOtp` çağrılmıyor, yani **SMS hiç gönderilmiyor**.
2. **Sunucu doğrulaması (`verifyOtp`) gerçek kapı.** Üretimde kod hiç üretilmediği için bu çağrı başarısız olur ve kullanıcı "Giriş yapılamadı" görür → telefonla giriş **üretimde fiilen çalışmaz**. (İstemci kontrolü tek başına güvenlik sağlamaz; asıl koruma sunucudaki doğrulamadır — bu iyi bir şey, ama arayüz yanıltıcı.)
3. **Geliştirme sahte kullanıcısı (`getDevAuthUser`).** `NODE_ENV !== "production"` ise ve Supabase hata verirse (yanlış şifre dahil) kod sessizce sahte kullanıcı üretir. Tanımlayıcı `admin`, `yildiz@` veya `…1000001` içeriyorsa **Admin rolü** atanır. Sabit kullanıcı ID'leri ve personel adları (Elif, Merve, Seda) üretim kodunda duruyor.
   - Sunucu rotaları gerçek oturum istediği için `/admin` ve API'ler bu yolla açılmaz; ama arayüz Admin gibi davranır.
   - `next start` her zaman `NODE_ENV=production` kullanır; risk, kamuya açık bir `next dev` veya yanlış ayarlanmış ortamdır.
4. `updatePassword` (auth-store) hata durumunda geliştirme modunda **başarılı** döner; `registerWithEmail` ve `loginWithGoogle` de sahte kullanıcı üretir.

**Çözüm:**
- Gerçek akış: `supabase.auth.signInWithOtp({ phone })` (Twilio/Supabase Phone provider) → `verifyOtp`. Kod, `Math.random` ve "otomatik doldur" tamamen kaldırılmalı. Alternatif: SMS maliyeti nedeniyle yalnızca e-posta/Google girişi bırakın.
- Sahte kullanıcıları `tests/` veya `__mocks__/` altına taşıyın; üretim kodundan `getDevAuthUser` ve tüm `NODE_ENV !== "production"` dallarını silin. Gerekirse açık bir `NEXT_PUBLIC_MOCK_AUTH=1` bayrağı kullanın ve bu bayrak set iken `next build`'in hata vermesini sağlayın.
- OTP için hız sınırı ve CAPTCHA (Cloudflare Turnstile) ekleyin; SMS maliyet suistimali gerçek bir risk.

---

### G-05 🟠 Herkese açık yazma uçları: moderasyon atlanıyor, hız sınırı yok

| Uç | Sorun |
|---|---|
| `POST /api/gallery/comments` | Kimlik doğrulaması yok; servis anahtarıyla `aktif: true` yazıyor. Migration `0015` ve şartname (Madde 16/18) "giriş zorunlu + `aktif=false` moderasyon" diyor — rota bunu **tamamen atlıyor**. Uzunluk sınırı yok. |
| `POST /api/reviews` | Kimlik doğrulaması yok; 4–5 yıldız **anında yayına** giriyor; `randevu_id` doğrulanmıyor (gerçek bir randevuya ait olduğu kontrol edilmiyor); `kaynak` istemciden serbest. Sahte 5 yıldız yorum basmak tek `curl` satırı. |
| `POST /api/gallery/like` | Kullanıcı başına tekrar engeli yok (aynı kullanıcı sınırsız beğenebilir, "beğenmeden beğenmekten vazgeç" ile sayı düşürülebilir). Oku-değiştir-yaz yarışı (eşzamanlı isteklerde sayaç bozulur). Engelleme yalnızca `localStorage` ile istemcide. |

**Çözüm:**
- `gallery_likes (gallery_id, user_id, PRIMARY KEY(gallery_id, user_id))` tablosu; beğeni sayısını tetikleyiciyle veya `rpc` ile atomik güncelleyin.
- Yorumlar: giriş zorunlu (`createClient().auth.getUser()`), `aktif=false`, `musteri_adi`'nı oturumdan alın (istemciden almayın), `yorum` için 1–500 karakter (zod).
- Değerlendirmeler: `randevu_id` için "bu randevu `Tamamlandı` ve değerlendirilmemiş" kontrolü; tek kullanımlık değerlendirme bağlantısı/token'ı; 4–5 yıldızı bile moderasyona alın veya randevuya bağlı doğrulamayı zorunlu yapın.
- Tüm herkese açık POST uçlarına IP bazlı hız sınırı (Upstash Ratelimit veya Vercel WAF/Firewall kuralları) ve Turnstile.

---

### G-06 🟠 `/api/appointments` — kimliksiz randevu uç noktası

Dosya: `apps/web/src/app/api/appointments/route.ts`

- **Telefonla hesap eşleştirme:** Oturum yoksa, verilen telefona ait mevcut profil servis anahtarıyla aranıyor ve randevu o profilin `musteri_id`'si altına yazılıyor. Bir kişinin telefon numarasını bilen herkes onun hesabına randevu ekleyebilir (hesap geçmişine/puan ve istatistiklerine karışır, kişi kendi randevu listesinde görür).
- **Hız sınırı/CAPTCHA yok:** Bekleyen randevu slotu 30 dk bloke ettiği için (şartname Madde 4/15) bir bot takvimi sahte randevularla doldurabilir → işletme için hizmet reddi.
- **Sunucu doğrulaması eksik:** `hizmet_idleri` gerçek hizmetlerle eşleştirilmiyor; `tarih_saat` tarih olarak parse edilmiyor (geçmiş tarih, çalışma saati dışı, kapalı gün kontrolü yok); aynı slotta **çakışma/çifte rezervasyon kontrolü yok**; `toplam_sure_dakika` istemciden geliyor (sunucu hizmet sürelerinden hesaplamalı); ad/telefon/not için üst uzunluk yok.
- **Hata sızıntısı:** `Randevu kaydedilemedi: ${appointmentError.message}` ve genel `err.message` doğrudan istemciye dönüyor.
- **Zaman dilimi (doğrulanmalı):** `tarihSaat` ham dizge olarak DB'ye yazılıyor; offset'siz gönderilirse Postgres UTC varsayar ve İstanbul saatiyle 3 saat kayar. Rezervasyon sihirbazının `Europe/Istanbul` offset'i ile gönderdiğini doğrulayın.
- İdempotensiya yok: çift tıklamada çift randevu.

**Çözüm:** zod şemasını sıkılaştırın (`.strict()`, `max()`), süre ve fiyatı sunucuda hesaplayın, slot kullanılabilirliğini tek bir DB fonksiyonunda (transaction + `EXCLUDE USING gist` aralık kısıtı) doğrulayın, mevcut profile **eşleştirmeyi kaldırın** (misafir randevusu ayrı kalsın; birleştirme `handle_new_user` içinde doğrulanmış telefonla zaten yapılıyor), hataları genel mesajla döndürün, hız sınırı + Turnstile ekleyin, `Idempotency-Key` başlığı kullanın.

---

### G-07 🟠 Açık yönlendirme: `/auth/callback`

Dosya: `apps/web/src/app/auth/callback/route.ts`

Kontrol: `next.startsWith("/") && !next.startsWith("//")`. `next=/\evil.com` bu kontrolden geçer ve `new URL("/\\evil.com", origin)` **`https://evil.com/`** olarak çözülür (Node ile doğrulandı). Giriş sayfası (`giris/page.tsx`) `/\` durumunu engelliyor; callback engellemiyor — iki farklı uygulama var.

```ts
// lib/safe-redirect.ts — tek yerde, hem giriş sayfası hem callback kullansın
export function safeRedirectPath(next: string | null, origin: string, fallback = "/profil") {
  if (!next) return fallback;
  try {
    const u = new URL(next, origin);
    return u.origin === origin && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? u.pathname + u.search + u.hash
      : fallback;
  } catch { return fallback; }
}
```
Etki sınırı: yalnızca başarılı Google girişinden sonra tetiklenir; yine de kimlik avı (phishing) için kullanılabilir.

---

### G-08 🟠 Rol ayrımı: `service_role` RLS niyetini devre dışı bırakıyor

`api-guard.ts` yalnızca "Admin **veya** Calisan" kontrol ediyor ve tüm admin rotaları servis anahtarıyla çalışıyor. Oysa RLS politikaları bazı işlemleri açıkça **yalnızca Admin**'e veriyor: `appointments_delete_admin`, `services_admin_manage`, `gallery_items_admin_manage`, `site_settings_admin_manage`, `customer_reviews_manage_admin`, `staff_details_manage_admin`. API üzerinden bir **Çalışan**: randevu silebilir, site ayarlarını değiştirebilir, hizmet fiyatlarını ve galeriyi değiştirebilir, yorumları silebilir.

**Çözüm:** `withRole(["Admin"])` ekleyin ve rota bazında uygulayın (silme, ayarlar, hizmet, galeri, yorum yönetimi → Admin; randevu onay, kasa, stok → Admin + Çalışan). Daha sağlam yol: veri işlemlerini kullanıcının kendi oturumuyla (anon anahtar + RLS) yapın, `service_role`'ü yalnızca gerçekten gerektiğinde kullanın. Şartnamedeki rol matrisini koda birebir yansıtan bir tablo-test ekleyin.

---

### G-09 🟠 Admin API girdi doğrulaması

Admin rotalarının (services, gallery, inventory, suppliers, reviews, appointments) hiçbirinde zod doğrulaması yok:
- `body.id` istemciden kabul ediliyor (`...(body.id ? { id: body.id } : {})`).
- `PATCH /api/admin/appointments`: `durum` değeri enum'a karşı doğrulanmıyor; `onaylayan_id` istemciden geliyor (oturumdaki kullanıcı ID'sinden alınmalı; aksi halde "onayı başkası yapmış gibi" kaydedilebilir).
- `Number(...)` sonucu `NaN` olabilir; negatif fiyat/miktar kabul ediliyor.
- `await request.json()` hata yakalamasız (geçersiz JSON → 500 + `err.message`).
- Tüm rotalar `error.message` döndürüyor (şema/kolon adı sızıntısı).
- `GET /api/admin/appointments` sayfalamasız tüm tabloyu döndürüyor.

**Çözüm:** `@yildiz/types` içine zod şemaları koyup hem istemcide hem sunucuda paylaşın; ortak bir `parseBody(schema, request)` yardımcısı ve ortak hata yanıtı üreticisi yazın (şu an `getSupabaseAdmin()` null kontrolü ve try/catch kalıbı ~40 kez kopyalanmış).

---

### G-10 🟡 Dosya yükleme

`api/admin/upload/route.ts` (guard'lı, klasör beyaz listeli, SVG yok — iyi). İyileştirmeler:
- MIME türü `file.type` ile (istemci beyanı) doğrulanıyor; **magic-byte** kontrolü yok (örn. `file-type` paketi).
- `upsert: true` ve `Date.now()` adı → nadir çakışmada üzerine yazma; `crypto.randomUUID()` kullanın.
- **Vercel'de istek gövdesi sınırı ~4,5 MB**; 50 MB'lık video yüklemesi bu rotada üretimde başarısız olacak. Çözüm: `supabase.storage.from("salon-media").createSignedUploadUrl(path)` ile tarayıcıdan doğrudan Storage'a yükleme.
- Tüm dosya belleğe `arrayBuffer()` ile alınıyor.
- Storage `salon-media` bucket'ının boyut/MIME sınırlarını bucket ayarından da kısıtlayın.

---

### G-11 🟡 Veritabanı sertleştirme

- **`SECURITY DEFINER` fonksiyonlarının tamamında `SET search_path` yok** (9 fonksiyon: `get_auth_user_role`, `is_admin`, `is_staff_or_admin`, `handle_new_user`, `prevent_self_role_escalation`, `enforce_customer_appointment_constraints`, `expire_pending_appointments`, …). Supabase güvenlik denetçisi bunu işaretler. `SET search_path = ''` ekleyip nesneleri şema ile nitelendirin.
- **`0003_fix_permissions.sql`: `GRANT ALL` tüm tablo ve fonksiyonlarda `anon` ve `authenticated`'a** (ve varsayılan yetkiler olarak gelecek nesnelere). Korunmanız tamamen RLS'e bağlı; `TRUNCATE`/`DELETE` yetkisi bile veriliyor. Gerekli minimuma indirin (`SELECT/INSERT/UPDATE/DELETE` ve yalnızca gerekli tablolarda).
- **Fonksiyon çağırma yetkisi:** `GRANT EXECUTE … TO service_role` (0016) `PUBLIC`/`anon` yetkisini kaldırmaz; varsayılan yetkiler yüzünden `anon` tüm `SECURITY DEFINER` fonksiyonlarını `/rest/v1/rpc/...` ile çağırabilir (ör. `expire_pending_appointments()`). `REVOKE ALL ON FUNCTION … FROM PUBLIC, anon, authenticated;` uygulayın.
- **Çift uygulama:** `expire_pending_appointments()` (SQL, çalışma saatini hesaba katmıyor) ile `/api/cron/expire-appointments` (çalışma saatli) farklı mantık içeriyor; biri çalışırsa sonuçlar tutarsız. Birini seçin.
- `0014` ile `profiles_id_fkey` kaldırıldı → `auth.users` ile bağlantısız profiller mümkün; bilinçli bir tercih ama "yetim profil" temizliği için bir iş tanımlayın.
- **Şema kayması (drift):** `0017`, "önceki migration'lardan canlı veritabanında eksik kalmış olabilecek sütunları" ekliyor ve `setup_complete.sql` (468 satır) migration'larla paralel tutuluyor. Tek doğruluk kaynağı migration'lar olmalı; `supabase db diff` ile canlı şemayı karşılaştırın. `supabase/.temp/` klasörünü commit'ten çıkarın.
- Seed dosyasında kimlik bilgisi yok ✅.

**Canlı veritabanında doğrulayın:** Supabase panelinde Advisors → Security çıktısını alın; `0015`'teki `customer_reviews_public_insert`, `gallery_comments_authenticated_insert` politikalarının ve eski `*_public_insert` politikalarının silinmiş olduğunu teyit edin (idempotent `IF NOT EXISTS` bloklarıyla çakışma olasılığı).

---

### G-12 🟡 HTTP güvenlik başlıkları

`next.config.mjs` temel başlıkları ekliyor (iyi). Eksikler:
- **Content-Security-Policy yok.** Google Maps iframe, Unsplash, Supabase, Google OAuth ve `dangerouslySetInnerHTML` (JSON-LD) birlikte düşünülerek nonce/hashli bir CSP tanımlayın; önce `Content-Security-Policy-Report-Only` ile başlayın.
- `Strict-Transport-Security` açıkça tanımlı değil (Vercel çoğu durumda ekler; yine de sabitleyin: `max-age=63072000; includeSubDomains; preload`).
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (OAuth popup uyumu için) ve `X-DNS-Prefetch-Control` düşünülebilir.
- `layout.tsx` JSON-LD: `JSON.stringify` içinde `<` karakterini `\u003c` ile kaçırın (şu an veriler sabit, ama ayarlardan beslenirse `</script>` enjeksiyonu riski doğar).

---

### G-13 🟡 Cron uçları

- `Bearer` karşılaştırması `!==` ile; `crypto.timingSafeEqual` kullanın.
- `?now=` parametresi, doğru sır ile bile olsa zamanı manipüle ediyor → üretimde kaldırın (yalnızca testte kullanın).
- `expire-appointments`: tüm `Beklemede` randevuları belleğe çekip filtreliyor; zaman koşulunu SQL'de uygulayın (`olusturulma_tarihi < now() - interval`), ardından çalışma saati mantığını yalnızca aday satırlara uygulayın.
- Hem `GET` hem `POST` kabul ediliyor; Vercel Cron yalnızca `GET` kullanır → `POST`'u kaldırın.
- `CRON_SECRET` en az 32 karakter olmalı (örnek dosya belirtiyor ✅; kodda uzunluk doğrulaması yok).

---

### G-14 🟡 Oturum / token yönetimi (olumlu ve iyileştirme)

**Olumlu:**
- Middleware ve API guard `getUser()` kullanıyor (sunucuda JWT'yi doğrular) — `getSession()`'a güvenilmiyor ✅
- Oturum çerezlerde (`@supabase/ssr`), `localStorage`'da yalnızca beğeni listesi var ✅
- `app_metadata` yedek rol kaynağı (kullanıcı tarafından değiştirilemez) ✅
- `/admin` ve `/profil` middleware ile korunuyor; `redirect` parametresi giriş sayfasında temizleniyor ✅

**İyileştirmeler:**
- Middleware'de **servis anahtarı** kullanılıyor (`getSupabaseAdmin()`); Edge/middleware ortamında yüksek yetkili anahtarın bulunması gereksiz. Kullanıcının kendi oturumu `profiles_select_self_or_staff` ile kendi rolünü zaten okuyabilir → servis anahtarını middleware'den çıkarın.
- Çerez API'leri tutarsız: `middleware.ts` `getAll/setAll`, `lib/supabase/server.ts` ve `lib/supabase/middleware.ts` eski `get/set/remove` yöntemlerini kullanıyor (`@supabase/ssr` 0.12'de kullanımdan kalkmış). Hepsini `getAll/setAll`'a taşıyın. `lib/supabase/middleware.ts#updateSession` `middleware.ts` tarafından kullanılmıyor → kaldırın veya birleştirin.
- Şifre politikası yalnızca istemcide `>= 6` karakter. Supabase Auth ayarlarında: minimum 8+ karakter, sızdırılmış şifre koruması (leaked password protection), e-posta doğrulama zorunluluğu, oturum süresi/refresh rotasyonu, Auth hız sınırları, CAPTCHA (Turnstile) açın.
- Admin hesapları için MFA (TOTP) zorunlu tutun — şartnamedeki kasa/komisyon verisi hassas.
- `loginWithGoogle` iki yerde (AuthProvider ve `useAuthStore`) tekrarlanıyor.

---

### G-15 🟢 Gizlilik ve depo hijyeni

- `.claude/settings.json` içinde yerel Windows yolu ve **kullanıcının tam adı** (`C:/Users/NAZİF AÇIKGÖZ/...`) var; depo herkese açıksa kişisel veri sızıntısıdır. Dosyayı `.gitignore`'a alın / göreli yola çevirin; Git geçmişinden temizlemeyi (`git filter-repo`) değerlendirin.
- `graphify-out/` (6,8 MB: `cache/`, `graph.html`, günlük raporlar) depoda. `CLAUDE.md` `graph.json`'ın commit edilmesini beklediği için onu bırakabilirsiniz; ancak `cache/` ve `graph.html`'i `.gitignore`'a alın, yerel mutlak yolları içerip içermediğini kontrol edin.
- `.env.example` içinde gerçek Place ID/CID var — bunlar Google'da zaten herkese açık bilgi, sorun değil ✅. `NEXT_PUBLIC_SITE_URL=site url si` bir yer tutucu; geçerli bir URL örneği verin.
- Çevre değişkeni doğrulaması yok: `lib/env.ts` içinde zod ile `process.env` doğrulayın (eksik `SUPABASE_SERVICE_ROLE_KEY`, kısa `CRON_SECRET` derlemede/başlangıçta hata versin).
- `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucuda kullanılıyor ✅ (`NEXT_PUBLIC_` önekli değil). Vercel'de "Sensitive" olarak işaretleyin; geliştirme/önizleme/üretim için **ayrı** Supabase projeleri kullanın.
- `scripts/*.mjs` `.env.local` dosyasını elle ayrıştırıyor ve servis anahtarını kullanıyor; gerçek veritabanına karşı çalışan test betiklerini `scripts/dev-only/` altında belgeleyin, üretim anahtarıyla çalıştırılmasını engelleyin.

---

## 4. Optimizasyon Bulguları

### P-01 Sitenin tamamı istemci tarafında render ediliyor (SEO + LCP)
33 dosyada `"use client"`; ana sayfa (`app/page.tsx`) da istemci bileşeni ve içerik, hidrasyondan sonra Zustand `bootstrapApp()` ile Supabase'den çekiliyor. Sonuçları: içerik JS gelene kadar görünmüyor (LCP/CLS), arama motorları için zayıf ilk HTML, ve `revalidate` / `generateMetadata` kullanımı **0** — istemci sayfaları `metadata` dışa aktaramadığı için `/hizmetler`, `/galeri`, `/iletisim` gibi sayfalara özel başlık/açıklama/OG yok.

**Çözüm:** Genel sayfaları Server Component yapın; hizmet/galeri/yorum/ayarlar verisini sunucuda `fetch` + `revalidate` (veya ISR + `revalidateTag`, admin değişikliklerinde tetikleyerek) ile çekin ve Zustand'a yalnızca etkileşimli durum için başlangıç verisi geçirin. Her sayfa için `generateMetadata`, `sitemap.ts`'te dinamik hizmet/galeri girdileri.

### P-02 Realtime olayları tam yeniden yüklemeyi tetikliyor
`stores/app-store.ts` tek kanalda çok tabloyu dinliyor ve birçok olayda `bootstrapApp(true)` çağırıyor (≈ satır 1060, 1087): her değişiklikte tüm veri yeniden çekiliyor. Olay yükündeki (`payload.new/old`) kayıtla yalnızca ilgili dilimi güncelleyin; kullanıcının görmeyeceği tablolar için (ör. `appointments`) herkese açık ziyaretçi oturumunda abone olmayın.

### P-03 Sorgular ve sayfalama
- `select("*")` 23 yerde; yalnızca gereken kolonları seçin (özellikle `profiles`, `appointments`, `customer_reviews`).
- `GET /api/admin/appointments` ve diğer admin listeleri sayfalamasız; `range()` / imleç tabanlı sayfalama ve tarih filtresi ekleyin; sık sorgulanan kolonlara bileşik indeks (`appointments(durum, tarih_saat)`, `appointments(musteri_id, tarih_saat)`).
- Google senkronizasyonu (`google-sync.service.ts`): tüm `customer_reviews`'ü belleğe çekip döngüde tek tek `insert` ediyor (N+1). Google yorumuna benzersiz bir anahtar (`google_review_id` veya hash) ekleyip `upsert(…, { onConflict, ignoreDuplicates: true })` ile tek toplu istek yapın. Ayrıca mevcut yorumlar `(musteri_adi + yorum)` metniyle karşılaştırılıyor — kırılgan.

### P-04 Görseller ve medya
- `gallery-manager.tsx`'te 3 adet `<img>` (admin; `next/image` önerilir ama admin için kabul edilebilir).
- Üretimde `images.unsplash.com` hotlink'i yerine Supabase Storage/kendi CDN'iniz; `images.remotePatterns` içinde joker `*.supabase.co` yerine kendi proje alan adı.
- Yükleme sırasında görsel boyutlandırma/sıkıştırma (WebP/AVIF) ve video için poster karesi.

### P-05 Paket ve derleme
- ✅ Admin sekmeleri `next/dynamic` ile ayrılmış (iyi). `AdminDashboard` hala statik import.
- `@yildiz/ui` tek büyük paket (3 dev dosya: `site-settings-manager.tsx` 1.831, `gallery-manager.tsx` 886, `appointment-manager.tsx` 789 satır); mobil/Electron tüketicileri için yönetim bileşenlerini ayrı pakete (`@yildiz/admin-ui`) ayırın ki müşteri uygulamaları bunları çekmesin.
- `turbo.json`: `lint`/`type-check`/`test` görevlerinde `dependsOn: ["^build"]` ve `inputs` tanımı yok; `globalEnv`/`env` listesi (`NEXT_PUBLIC_*`) eklenmemiş → önbellek yanlış paylaşılabilir.
- `.nvmrc` / `engines` yok (Node sürümü sabitlenmemiş; bu inceleme Node 22 ile yapıldı).

### P-06 Gözlemlenebilirlik
Hata izleme (Sentry vb.), yapılandırılmış sunucu günlüğü ve performans ölçümü (Vercel Analytics / Web Vitals) yok; `console.warn` ile yutulan hatalar üretimde görünmez.

---

## 5. Kod Kalitesi Bulguları

**Güçlü yanlar:** katı TypeScript, 0 `any`, tutarlı Türkçe alan adlandırması, iş kuralı testleri (`packages/types/tests/business-rules.test.ts`), middleware/guard/cron testleri, `CONSTRAINTS.md` ile yazılı kalite sözleşmesi, `error.tsx` / `global-error.tsx` / `loading.tsx` dosyaları.

| # | Konu | Öneri |
|---|---|---|
| K-01 | **Dev/mock mantığı üretim kodunda.** `getDevAuthUser`, 6+ yerde `NODE_ENV !== "production"` dalı, sabit UUID'ler | Testlere taşıyın; üretim yolunu tek ve net bırakın (bkz. G-04) |
| K-02 | **Çift doğruluk kaynağı.** `AuthProvider` (React Context) ve `useAuthStore` aynı kullanıcıyı, `loginWithGoogle`, `logout`, `updateProfile` ve profil getirmeyi ayrı ayrı tutuyor — şartnamenin kendi "Single Source of Truth" ilkesiyle çelişiyor | Yalnızca Zustand store'u bırakın; `AuthProvider` ince bir dinleyiciye dönüşsün |
| K-03 | **Dev dosyalar.** `app-store.ts` 1.313, `site-settings-manager.tsx` 1.831, `admin/page.tsx` 989 satır | Zustand "slice" deseni ve sekme/bölüm bazlı bileşenlere bölün (hedef < 400 satır/dosya) |
| K-04 | **Tekrarlanan kalıplar.** `getSupabaseAdmin()` null kontrolü + try/catch + `error.message` dönüşü ~40 kez | `withAdminDb(handler)` / `apiError()` yardımcıları |
| K-05 | **Doğrulama dağınık.** Zod yalnızca 2 rotada; geri kalanı `body.x ?? body.y` (camelCase/snake_case çift kabul) | Tek biçim (snake_case veya camelCase) seçin, paylaşılan zod şemaları kullanın; `.passthrough()`'u kaldırın |
| K-06 | **Hata yönetimi.** Çok sayıda `catch → console.warn` ve sessiz geçiş; `profile` yokken meta veriyle "uydurma" kullanıcı üretme | Hataları ortak yardımcıdan raporlayın; profil yoksa durumu açıkça "profil hazırlanıyor" olarak ele alın |
| K-07 | **Test boşlukları.** `/api/admin/**` için "hepsi guard'lı mı" testi yok (G-02 buradan kaçtı); RLS/politika testi (pgTAP) yok; E2E (Playwright) yok; çoğu test mock'lu | Rota-tarama testi, pgTAP ile rol/RLS matrisi, randevu akışı için E2E |
| K-08 | **`packages/ui` içinde veri çeken yönetim bileşenleri.** `apps/web/components/admin/*` bunların 2 satırlık yeniden dışa aktarımı | Tek yer belirleyin; ya doğrudan `@yildiz/ui`'dan import edin ya da bileşenleri uygulamaya taşıyın |
| K-09 | **CI yok** (`.github/` yok): `CONSTRAINTS.md` "CI'da zorunlu" diyor ama CI tanımlı değil | GitHub Actions: `pnpm install --frozen-lockfile` → `lint` → `type-check` → `test` → `pnpm audit --prod --audit-level high` |
| K-10 | **Telefon normalizasyonu** yalnızca Türkiye varsayıyor (`+90`); yabancı numaralar bozulur (`+44…` → `+9044…`) | `libphonenumber-js` ile doğrulama, ülke kodu desteği |
| K-11 | **Şartname belgeleri** repo içinde ve ajanlar için "zorunlu oku" kuralları var; ancak `Notlar.md` (27–28 Ekim) ile ana belge senkron değil | Mock aşaması bitince notları ana belgeye işleyin (belge zaten bunu öngörüyor) |

---

## 6. Aklınıza Gelmeyebilecek Konular (Eksikler Listesi)

1. **KVKK (6698):** Ad, soyad, telefon, doğum tarihi, randevu geçmişi kişisel veridir. Gerekenler: aydınlatma metni, açık rıza (özellikle doğum tarihi ve pazarlama SMS'i için), çerez/analitik onayı, veri saklama ve silme politikası, "hesabımı sil / verimi indir" akışı, veri işleyen sözleşmeleri (Supabase, Vercel, SMS sağlayıcı), VERBİS yükümlülüğü değerlendirmesi. Footer'da Gizlilik ve KVKK sayfaları yok.
2. **Doğum tarihi** toplanıyor ama kullanılmıyor (şartname bunu söylüyor) → kullanılmayan kişisel veriyi toplamayın (veri minimizasyonu) veya alanı şimdilik kaldırın.
3. **Denetim izi (audit log):** Kasa, ödeme, komisyon, puan ve randevu durum değişiklikleri için kim/ne zaman/eski-yeni değer tablosu; "Çalışan" rolü silme/iptal yapabildiği için gerekli.
4. **Yedekleme ve felaket kurtarma:** Supabase PITR/günlük yedek, geri yükleme tatbikatı, Storage bucket yedeği.
5. **Ortam ayrımı:** geliştirme / önizleme / üretim için ayrı Supabase projeleri ve ayrı anahtarlar; önizleme dağıtımlarında üretim servis anahtarı **olmamalı**.
6. **Hız sınırı + bot koruması** (tüm herkese açık uçlar, giriş, kayıt, OTP, randevu): Upstash Ratelimit / Vercel Firewall + Turnstile.
7. **SMS maliyet ve kötüye kullanım kontrolü:** günlük kota, numara başına limit, ülke kısıtı (yalnızca +90).
8. **Zaman dilimi stratejisi:** tüm tarihler UTC saklanıp `Europe/Istanbul` ile gösterilsin; yaz saati uygulaması yok ama sunucu/istemci saat kayması testi ekleyin.
9. **Randevu çakışması ve çalışan takvimi:** çifte rezervasyon (EXCLUDE kısıtı), çalışan başına slot, kapalı/özel günler (`DEFAULT_SPECIAL_DAYS` kodda sabit — ayarlardan okunmalı; cron şu an bu sabiti kullanıyor).
10. **Erişilebilirlik (a11y):** form etiketleri, odak yönetimi (modal sihirbaz), kontrast (pembe/turkuaz palet), klavye ile gezinme; Lighthouse/axe testi.
11. **`robots.ts` / `sitemap.ts`:** `/admin`, `/profil`, `/giris`, `/api` için `disallow` ve admin sayfalarına `noindex` meta (doğrulayın).
12. **Hata sayfaları ve çevrimdışı davranış:** şartname Electron için çevrimdışı senkronizasyon istiyor → çakışma çözümü (last-write-wins mi, birleştirme mi) ve idempotent senkron API'si şimdiden tasarlanmalı; ödeme/kasa kayıtlarında istemci kaynaklı UUID + tekrar gönderim koruması.
13. **Webhook/bildirim güvenilirliği:** randevu hatırlatma SMS/WhatsApp planlanıyorsa kuyruk (queue), yeniden deneme ve gönderim kaydı.
14. **Para birimi ve yuvarlama:** fiyat/komisyon hesaplarında `number` yerine tamsayı kuruş veya `numeric` kullanın (kasa kuralları testli, ama kayan nokta hatası riskini tipte sabitleyin).
15. **Gizli bilgi taraması:** GitHub secret scanning + push protection açın; geçmişte anahtar sızıntısı için `gitleaks` taraması çalıştırın (bu incelemede yalnızca son commit ağacı taranabildi; depo geçmişinde tek commit görünüyor).
16. **Marka/IP:** Referans şablon (BeautyZone) renk paleti ve düzeni kopyalanmış; şablon lisansını ve görsel haklarını (Unsplash dışı görseller, logo) doğrulayın.
17. **Mobil/Electron hazırlığı:** `packages/types` ve zod şemalarını paylaşılan "tek sözleşme" yapın; Electron için sertifika/otomatik güncelleme imzalama, mobilde güvenli token saklama (SecureStore) kararını erkenden alın.

---

## 7. Önerilen Düzeltme Sırası

**Faz 0 — Canlıya çıkmadan önce (bu hafta)**
1. G-02: `/api/admin/sync/google-reviews` guard + Google API anahtarı kısıtı
2. G-03: `profiles` sütun yetkileri + tetikleyici (puan/doğrulama korunsun)
3. G-04: Sahte OTP ve tüm `getDevAuthUser` yollarını kaldır (veya gerçek `signInWithOtp` akışı)
4. G-05 + G-06: Açık POST uçlarına hız sınırı/Turnstile, moderasyon, doğrulama, randevu çakışma kontrolü
5. G-07: Ortak `safeRedirectPath` ve callback düzeltmesi
6. G-08: `withRole(["Admin"])` ve rol matrisi

**Faz 1 — 1–2 hafta**
7. G-01: Next 15.5.28+ / React 19 geçişi (+ Zod, Vitest güncellemeleri), CI + Dependabot
8. G-09, G-10, G-11, G-12, G-13: zod doğrulama, imzalı yükleme, `search_path`/GRANT sertleştirme, CSP, cron düzeltmeleri
9. K-07/K-09: rota-tarama testi, pgTAP rol testleri, GitHub Actions

**Faz 2 — Optimizasyon ve temizlik**
10. P-01…P-03: Server Component + ISR, Realtime kısmi güncelleme, sayfalama, Google senkron toplu `upsert`
11. K-01…K-06, K-08: tek auth kaynağı, dosya bölme, ortak API yardımcıları
12. KVKK, audit log, yedekleme, gözlemlenebilirlik (Bölüm 6)

---

## 8. Doğrulanması Gerekenler (bu incelemenin sınırları)

- Canlı Supabase projesindeki gerçek politikalar ve fonksiyon yetkileri (migration'lar kayma gösterebilir; `0017` bunu kabul ediyor).
- Supabase Auth ayarları (Phone provider açık mı, e-posta doğrulama, şifre uzunluğu, CAPTCHA, redirect URL beyaz listesi).
- Vercel ortam değişkenlerinin ortam bazında ayrımı ve `NODE_ENV`.
- `robots.ts`, `sitemap.ts`, rezervasyon sihirbazının (`booking-wizard-modal.tsx`) tarih/saat dilimi biçimi — bu dosyalar derinlemesine incelenmedi.
- Next.js Server Actions kullanılmıyor görünüyor; kullanılıyorsa G-01'deki ilgili DoS/SSRF bulguları doğrudan etkilidir.
- Git geçmişi tek commit içeriyor (`--depth 1` klon); tam geçmişte sır taraması yapılmadı.

*Bu rapor yalnızca kod ve yapılandırma incelemesine dayanır; sızma testi (penetration test) yerine geçmez.*
