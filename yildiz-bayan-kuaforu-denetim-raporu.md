# Yıldız Bayan Kuaförü – Ayrıntılı Kod Denetim Raporu

**Tarih:** 29 Ekim 2026 (TSİ)
**Depo:** github.com/naziffarm4/yildiz-bayan-kuaforu, `main` @ `753a9c2`
**Yöntem:** Kod yalnızca okundu, depoda değişiklik yapılmadı. Testler (203/203 geçti), `tsc --noEmit` ve `next lint` temiz çıktı. `pnpm audit --prod` çalıştırıldı ve git geçmişi gizli anahtar için tarandı. Raporda yalnızca kodda doğrulanan bulgular var.
**Kapsam dışı:** Canlı site, Lighthouse ölçümü ve Supabase panosu (gerçek RLS, yedekler, Storage) incelenmedi.

## 1. Özet

**Genel puan: 6 / 10.** Altyapı sağlam, ama dışa açık uç noktalarda ciddi açıklar var.

| Önem | Adet |
|---|---|
| Kritik | 2 |
| Yüksek | 4 |
| Orta | 9 |
| Düşük | 5 |
| **Toplam** | **20** |

**Bilinçli tasarım kararları:** Aynı saate birden fazla randevu alınabilmesi isteğe bağlı bir tercih, bu yüzden bulgu sayılmadı. Randevunun tarihinin, çalışma saatinin ve süresinin doğrulanmaması ise çakışmadan ayrı bir konu. O yüzden **O9** olarak ayrıca listelendi.

**Önceki tura göre:** `0ed974c` ile koda gömülü CRON anahtarı ve service-role anahtarı yoksa anon anahtara düşme kaldırıldı, ayrıca rol yükseltme trigger'ı eklendi. Eski anahtar git geçmişinde hâlâ duruyor (bkz. O7).

**Efor ölçeği:** S = 1 saatten az, M = yarım gün, L = 1–2 gün.

---

## 2. Kritik

### K1 – Admin Google senkronizasyon uç noktası girişsiz çalışıyor
- **Önem:** Kritik · **Efor:** S
- **Kanıt:** `apps/web/src/app/api/admin/sync/google-reviews/route.ts:6` ve `:30`
  ```ts
  export async function POST(request: Request) { ...
  export async function GET(request: Request) {
    const force = url.searchParams.get("force") === "true";
    const result = await executeGoogleSync(force);
  ```
  Bu fonksiyonlar `withStaffOrAdminAuth` ile sarılmamış. Middleware de `/api/` yollarını kontrol etmeden geçiriyor (`src/middleware.ts:15`).
- **Nasıl istismar edilir:** Herhangi biri tarayıcıya `https://site/api/admin/sync/google-reviews?force=true` yazar ya da bir bot bu adresi dakikada yüzlerce kez çağırır. Her çağrı önbelleği atlayıp Google Places API'ye istek gönderir (`google-sync.service.ts:58,97`), sonra veritabanına service-role ile yazar.
- **Etki:** Google API faturası artar ya da kota biter, yorum senkronu bozulur, veritabanı gereksiz yere yorulur.
- **Çözüm:**
  ```ts
  import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
  export const POST = withStaffOrAdminAuth(async (request: Request) => {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(await executeGoogleSync(body?.force === true));
  });
  // GET'i tamamen kaldırın (durum değiştiren işlem GET ile yapılmamalı).
  ```
- **Doğrulama:** Girişsiz `curl -i https://site/api/admin/sync/google-reviews` isteği 401 ya da 405 dönmeli. Ayrıca `api-guard.test.ts`'e bu rota için bir test ekleyin.

### K2 – Next.js 14.2.35'te kritik güvenlik açıkları
- **Önem:** Kritik · **Efor:** M–L (sürüm atlaması)
- **Kanıt:** `apps/web/package.json:19` → `"next": "^14.2.5"`, kurulu sürüm 14.2.35. `pnpm audit --prod` 30 açık buldu: 3 kritik, 12 yüksek, 13 orta, 2 düşük. Kritik olanlar:
  - "Unauthenticated RCE in Image Optimization API when AVIF files are used"
  - Aynı API'de SVG ile RCE
  - "RCE on windows-hosted servers"

  Projede ilgili kısımlar:
  ```ts
  // api/admin/upload/route.ts:12
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  // next.config.mjs:5-21 → images.remotePatterns: *.supabase.co, *.supabase.in, images.unsplash.com
  ```
  Yüksek seviyede ayrıca DoS, Server Actions SSRF, PostCSS dosya okuma ve Zod bellek tüketme açıkları var.
- **Nasıl istismar edilir:** Görsel optimizasyon uç noktası (`/_next/image`) kötü niyetli hazırlanmış bir AVIF ya da SVG dosyasını işlerken sunucuda kod çalıştırılabilir. Uygulama AVIF yüklemeye izin verdiği ve Supabase görsellerini optimize ettiği için risk somut.
- **Etki:** Sunucu ele geçirilebilir; ortam değişkenlerindeki service-role anahtarı da bunlara dahil.
- **Çözüm:** Denetim çıktısına göre `next` en az 15.5.16 olmalı.
  ```bash
  pnpm --filter web add next@^15.5.16 react@^19 react-dom@^19 eslint-config-next@^15
  pnpm audit --prod
  ```
  Next 15'te `cookies()` asenkron oldu, bu yüzden `lib/supabase/server.ts` güncellenmeli. Yükseltme bitene kadar `"image/avif"` izin listeden çıkarılmalı.
- **Doğrulama:** `pnpm audit --prod` içinde kritik ve yüksek açık kalmamalı. `pnpm -r test`, `tsc` ve `next build` geçmeli.

---

## 3. Yüksek

### Y1 – Giriş sonrası yönlendirmede açık yönlendirme (open redirect)
- **Önem:** Yüksek · **Efor:** S
- **Kanıt:** `apps/web/src/app/auth/callback/route.ts:34-36`
  ```ts
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/profil";
  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  ```
  Node ile doğrulandı: `new URL("/\\evil.com", "https://site.com").href` → `https://evil.com/`
- **Nasıl istismar edilir:** Saldırgan `…/auth/callback?code=…&next=/%5Cevil.com` gibi bir bağlantı paylaşır. Kullanıcı gerçek sitede Google ile giriş yaptıktan sonra sahte bir siteye yönlenir; orada, örneğin, "şifrenizi tekrar girin" diye oltalanabilir.
- **Etki:** Hesap bilgileri çalınabilir ve marka güvenilirliği zarar görür.
- **Çözüm:**
  ```ts
  function safeRedirect(next: string | null, origin: string) {
    if (!next || !next.startsWith("/") || next.includes("\\")) return "/profil";
    const u = new URL(next, origin);
    return u.origin === origin ? u.pathname + u.search : "/profil";
  }
  ```
- **Doğrulama:** `auth-callback.test.ts`'e `/\evil.com`, `//evil.com` ve `/%5Cevil.com` girdileri için test ekleyin; üçü de `/profil`'e dönmeli.

### Y2 – Herkese açık formlarda hız sınırı ve bot koruması yok
- **Önem:** Yüksek · **Efor:** M
- **Kanıt:** Kimlik doğrulaması olmayan ve service-role ile yazan rotalar:
  - `api/appointments/route.ts:49` → `export async function POST(...)` ve `:110` → `getSupabaseAdmin()`
  - `api/reviews/route.ts:6`
  - `api/gallery/comments/route.ts:41`

  Projede hiçbir rate limit ya da captcha kodu yok (aramada bulunamadı).
- **Nasıl istismar edilir:** Basit bir döngüyle saniyede onlarca istek atılabilir. Her istek bir randevu, gerekirse yeni bir müşteri profili (`:149-167`), bir yorum ya da galeri yorumu oluşturur.
- **Etki:** Takvim sahte randevularla dolar, personel gerçek müşteriyi ayırt edemez, veritabanı şişer, Supabase kotası ve maliyeti artar.
- **Çözüm:** IP ve telefon başına sınır koyun (örnek: Upstash Ratelimit) ve forma Cloudflare Turnstile ekleyin.
  ```ts
  import { Ratelimit } from "@upstash/ratelimit"; import { Redis } from "@upstash/redis";
  const rl = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, "10 m") });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  if (!(await rl.limit(`appt:${ip}`)).success)
    return NextResponse.json({ error: "Çok fazla deneme, lütfen sonra tekrar deneyin." }, { status: 429 });
  ```
  Alternatif olarak Vercel WAF'ta bu yollar için bir rate-limit kuralı tanımlanabilir.
- **Doğrulama:** Aynı IP'den art arda 6 istek atıldığında 6. istek 429 dönmeli. Turnstile tokeni olmayan istek 400 dönmeli.

### Y3 – Sahte 4–5 yıldızlı yorumlar doğrudan yayına çıkıyor
- **Önem:** Yüksek · **Efor:** M
- **Kanıt:** `apps/web/src/app/api/reviews/route.ts:15-19, 36-49`
  ```ts
  const puan = Number(body.puan) || 5;
  const randevuId = body.randevu_id || body.randevuId || null;
  const kaynak = body.kaynak || "Hizmet Sonrası";
  ...
  const isHighRating = puan >= 4;
  const aktif = isHighRating;
  ```
- **Nasıl istismar edilir:** Giriş gerekmeden istenen isimle sınırsız 5 yıldızlı yorum gönderilebilir ve bunlar anında vitrinde görünür. Rakip biri hakaret içeren 5 yıldızlı bir yorumu da yayınlatabilir. `puan: "abc"` gönderilirse puan 5 sayılır. `kaynak` ve `randevu_id` alanlarına istenen değer yazılabilir.
- **Etki:** İtibar zarar görür; sahte yorum, tüketici mevzuatı ve Google politikaları açısından risk oluşturur.
- **Çözüm:**
  ```ts
  const ReviewSchema = z.object({
    musteriAdi: z.string().trim().min(2).max(80),
    puan: z.number().int().min(1).max(5),
    yorum: z.string().trim().max(1000).optional(),
    randevuId: z.string().uuid(),
  }).strict();
  // randevuId'nin "Tamamlandı" durumunda bir randevu olduğunu ve daha önce yorumlanmadığını DB'den kontrol et
  // insert: { ..., kaynak: "Hizmet Sonrası", aktif: false }  // admin onayıyla yayına alınsın
  ```
- **Doğrulama:** `randevuId` olmadan gönderilen istek 400 dönmeli. Geçerli bir yorum `aktif=false` ile kaydedilmeli ve vitrinde görünmemeli.

### Y4 – Galeri yorumları girişsiz ve moderasyonsuz
- **Önem:** Yüksek · **Efor:** S
- **Kanıt:** `apps/web/src/app/api/gallery/comments/route.ts:41-69`
  ```ts
  const musteriAdi = (body.musteriAdi || body.musteri_adi || "").trim();
  const yorum = (body.yorum || "").trim();
  ... .insert({ gallery_item_id: galleryId, musteri_adi: musteriAdi, yorum, aktif: true })
  ```
  Şartname notu (`api/gallery/like/route.ts:3`): "Beğeni ve yorum için giriş zorunludur". RLS politikası `gallery_comments_authenticated_insert` (`supabase/migrations/0015…sql:271`), ama rota service-role kullandığı için RLS devre dışı kalıyor.
- **Nasıl istismar edilir:** Herkes, istediği isimle ve sınırsız uzunlukta metin yazabilir; metin anında yayına girer. React metni kaçışladığı için XSS görülmedi, ama spam, hakaret ve link yayılabilir.
- **Etki:** Sitede uygunsuz içerik görünür ve veritabanı şişer.
- **Çözüm:**
  ```ts
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: "Yorum için giriş yapın." }, { status: 401 });
  const p = z.object({ galleryId: z.string().uuid(), yorum: z.string().trim().min(1).max(500) }).parse(body);
  // musteri_adi profilden alınsın, aktif: false (admin onayı)
  ```
- **Doğrulama:** Girişsiz POST 401 dönmeli. Girişli yorum `aktif=false` kaydedilmeli ve admin onayından sonra görünmeli.

---

## 4. Orta

### O1 – Beğeni sayacı kullanıcı başına tutulmuyor ve yarış durumuna açık
- **Efor:** M
- **Kanıt:** `api/gallery/like/route.ts:36-56`: Sayaç önce okunuyor (`select("id, begeni_sayisi")`), sonra `newCount = currentCount + delta` ile yazılıyor. Kimin beğendiği yalnızca tarayıcının `localStorage`'ında tutuluyor (`stores/app-store.ts:215`).
- **Ne olur:** Giriş yapan bir kullanıcı API'yi doğrudan çağırarak sınırsız beğeni atabilir. Aynı anda gelen iki istekten biri kaybolabilir.
- **Etki:** Beğeni sayıları güvenilmez olur.
- **Çözüm:**
  ```sql
  create table gallery_likes(user_id uuid references auth.users, item_id uuid references gallery_items, primary key(user_id,item_id));
  create function toggle_like(p_item uuid) returns int language sql security definer as $$ ... $$;
  ```
  Sayaç `count(*)` ile hesaplanmalı ya da tetikleyiciyle atomik olarak güncellenmeli.
- **Doğrulama:** Aynı kullanıcı iki kez beğendiğinde sayı yalnızca 1 artmalı. 20 eşzamanlı istekten sonra sayı doğru olmalı.

### O2 – CSP ve HSTS güvenlik başlıkları yok
- **Efor:** S–M
- **Kanıt:** `next.config.mjs:24-47`: yalnızca `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` ve `Permissions-Policy` tanımlı.
- **Ne olur:** Bir XSS açığı oluşursa onu sınırlayacak ikinci bir katman yok. HTTPS zorunluluğu da tarayıcıya bildirilmiyor.
- **Çözüm:**
  ```js
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src https://www.google.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" }
  ```
  CSP'yi önce `Content-Security-Policy-Report-Only` olarak deneyin.
- **Doğrulama:** `curl -I https://site` çıktısında iki başlık da görünmeli. Tarayıcı konsolunda CSP ihlali olmamalı.

### O3 – Veritabanı ve sunucu hata mesajları kullanıcıya dönüyor
- **Efor:** S
- **Kanıt:** `api/appointments/route.ts:204` → ``error: `Randevu kaydedilemedi: ${appointmentError?.message ...}` `` ve `:212-213` (`err.message`). Aynı yapı `gallery/comments` (`:22`, `:46`), `gallery/like` (`:58`), `reviews` (`:34`) ve admin rotalarında da var.
- **Ne olur:** Postgres hata metinleri tablo ve kolon adlarını ve kısıtları ele verir. Saldırgan bu bilgiyle şemayı öğrenir.
- **Çözüm:**
  ```ts
  console.error("appointments.insert", appointmentError);
  return NextResponse.json({ success: false, error: "Randevu kaydedilemedi, lütfen tekrar deneyin." }, { status: 500 });
  ```
- **Doğrulama:** Bozuk veriyle (örneğin geçersiz `tarih_saat`) atılan istekte yanıtta Postgres metni olmamalı.

### O4 – Misafir randevusu doğrulanmamış telefonla mevcut profile bağlanıyor, yanıt tüm satırı dönüyor
- **Efor:** S
- **Kanıt:** `api/appointments/route.ts:135-146, 197`
  ```ts
  .from("profiles").select("id, ad, soyad").in("telefon", validPhoneCandidates)
  ... musteriId = existingProfile.id;
  ... .select("*").single();
  ```
- **Ne olur:** Birinin telefon numarasını bilen kişi, o müşterinin hesabına onun haberi olmadan randevu ekleyebilir. Randevu o kişinin profilinde görünür ve sadakat puanlarını etkileyebilir.
- **Çözüm:** Oturum yoksa mevcut profile bağlamayın; `musteri_id: null` bırakın ve eşleştirmeyi telefon doğrulandıktan sonra yapın. Yanıtta yalnızca şunları dönün: `.select("id, tarih_saat, durum")`.
- **Doğrulama:** Kayıtlı bir kullanıcının telefonuyla girişsiz randevu alındığında `musteri_id` null olmalı.

### O5 – Personel (Calisan) rolü tüm yönetici işlemlerini yapabiliyor
- **Efor:** M
- **Kanıt:** `lib/auth/api-guard.ts:36-40`
  ```ts
  (profile.rol !== "Admin" && profile.rol !== "Calisan")
  ```
  `settings`, `services` (fiyat), `suppliers`, `inventory`, randevu ve galeri silme ve upload rotalarının hepsi aynı korumayı kullanıyor.
- **Ne olur:** Bir çalışan (ya da çalınan bir çalışan hesabı) fiyatları ve site ayarlarını değiştirebilir, kayıtları silebilir.
- **Çözüm:**
  ```ts
  export function withAdminAuth(handler) { /* aynı mantık, yalnızca rol === "Admin" */ }
  // settings POST, services POST/PATCH/DELETE, suppliers, *DELETE → withAdminAuth
  ```
- **Doğrulama:** Calisan rolündeki bir hesapla `POST /api/admin/settings` isteği 403 dönmeli.

### O6 – Cron işleri depoda zamanlanmamış
- **Efor:** S
- **Kanıt:** `api/cron/expire-appointments/route.ts` ve `api/cron/sync-google-reviews/route.ts` var, ama depo kökünde `vercel.json` yok ve başka bir zamanlayıcı tanımı da bulunamadı.
- **Ne olur:** Zamanlama başka bir yerde (örneğin Vercel panosunda) yapılmadıysa süresi dolan "Beklemede" randevular hiç kapanmaz ve yorumlar senkronlanmaz.
- **Çözüm:**
  ```json
  { "crons": [
    { "path": "/api/cron/expire-appointments", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/sync-google-reviews", "schedule": "0 4 * * *" } ] }
  ```
  Vercel, `CRON_SECRET` tanımlıysa onu `Authorization: Bearer` başlığıyla otomatik gönderir.
- **Doğrulama:** Vercel → Project → Cron Jobs ekranında iki iş görünmeli ve logda 200 dönmeli.

### O7 – Eski CRON anahtarı git geçmişinde açık
- **Efor:** S
- **Kanıt:** İlk commit'te `CRON_SECRET=yildiz-salon-goo…` (maskelendi) hem `.env.example`'da hem route varsayılanında var. `0ed974c` ile koddan kaldırıldı ama geçmişte duruyor (depo herkese açıksa bu değeri herkes görebilir).
- **Ne olur:** Canlıda bu değer kullanılıyorsa herkes cron uç noktalarını tetikleyebilir.
- **Çözüm:** Vercel'de yeni bir değer tanımlayın: `openssl rand -hex 32`. Geçmişi temizlemek isteğe bağlı (`git filter-repo` force push gerektirir); asıl gereken anahtarı değiştirmek.
- **Doğrulama:** Eski değerle `Authorization: Bearer …` gönderilen istek 401 dönmeli.

### O8 – KVKK: aydınlatma metni sayfası ve randevu onayı yok, saklama süresi tanımsız
- **Efor:** M
- **Kanıt:** `app/kayit/page.tsx:248-265`'te onay kutusu ve "6698 sayılı KVKK" yazısı var, ama `app/` altında `kvkk` ya da `gizlilik` sayfası yok. Randevu formu ad, telefon ve not topluyor (`api/appointments/route.ts:12-23`) ama onay alanı yok. Eski misafir verisini silen ya da anonimleştiren bir iş de yok.
- **Ne olur:** Kullanıcı neyi onayladığını okuyamıyor. Misafir randevusunda kişisel veri aydınlatma yapılmadan toplanıyor.
- **Etki:** KVKK uyumsuzluğu nedeniyle idari para cezası riski ve müşteri güveninin zedelenmesi.
- **Çözüm:**
  1. `/kvkk` ve `/gizlilik` sayfalarını ekleyin (veri sorumlusu, amaç, saklama süresi, başvuru yolu).
  2. Randevu formuna "Aydınlatma metnini okudum" bağlantısı ve onay kutusu koyun; sunucuda `kvkkOnay: z.literal(true)` ile kontrol edin.
  3. 2 yıldan eski misafir kayıtlarını anonimleştiren bir cron tanımlayın.
- **Doğrulama:** Onay verilmeden gönderilen randevu 400 dönmeli. Footer'da ve formda bağlantılar çalışmalı.

### O9 – Randevu tarihi, çalışma saati ve süresi sunucuda doğrulanmıyor
- **Efor:** M
- **Kanıt:** `api/appointments/route.ts:44, 65-75, 191-192`
  ```ts
  tarihSaat: z.string().trim().min(1, "Randevu tarihi ve saati seçilmelidir."),
  const rawDuration = Number(body.toplam_sure_dakika ?? body.toplamSureDakika);
  toplamSureDakika: ... Math.trunc(rawDuration) : 30,
  ```
  Tarih biçimine, geçmiş zamana ve çalışma saatine bakılmıyor. Süre tarayıcıdan geliyor. Hizmet ID'lerinin var olup olmadığı kontrol edilmiyor (`:16, :189`).
- **Ne olur:** API doğrudan çağrılarak geçmiş bir tarihe, gece 03:00'e ya da kapalı bir güne randevu açılabilir. 1 dakikalık ya da 10.000 dakikalık süre, var olmayan hizmet ID'leri ve saat dilimi belirtilmemiş bir tarih de gönderilebilir. Saat dilimi yoksa saat Europe/Istanbul yerine UTC olarak yorumlanıp 3 saat kayabilir. (Çakışmaya izin verilmesi bilinçli bir karar; bu bulgu onunla ilgili değil.)
- **Çözüm:**
  ```ts
  tarihSaat: z.string().datetime({ offset: true }),
  // sunucuda:
  const start = new Date(tarihSaat);
  if (start.getTime() < Date.now()) return bad("Geçmiş tarihe randevu alınamaz.");
  const { data: svcs } = await supabaseAdmin.from("services").select("id, tahmini_sure_dakika").in("id", hizmetIdleri).eq("aktif", true);
  if (svcs.length !== hizmetIdleri.length) return bad("Geçersiz hizmet.");
  const sure = svcs.reduce((t, s) => t + s.tahmini_sure_dakika, 0); // istemci süresi yok sayılır
  // site_settings.calisma_saatleri + özel günler ile Europe/Istanbul'a göre çalışma saati kontrolü
  ```
- **Doğrulama:** Geçmiş tarih, `2026-13-40`, gece yarısı, Pazar ve sahte hizmet ID'si ayrı ayrı denendiğinde her biri 400 dönmeli. Süre DB'den hesaplanmalı.

---

## 5. Düşük

### D1 – Randevu şeması gereksiz alanları kabul ediyor, metin uzunluğu sınırsız
- **Efor:** S
- **Kanıt:** `api/appointments/route.ts:25` → `.passthrough();`. Ayrıca `musteriAdSoyad` ve `notlar` alanlarında üst sınır yok (`:28, :46`).
- **Ne olur:** Megabaytlarca uzunlukta isim ya da not kaydedilebilir.
- **Çözüm:** `.strict()` kullanın, `musteriAdSoyad: z.string().max(80)`, `notlar: z.string().max(500)`.
- **Doğrulama:** 10.000 karakterlik bir not gönderildiğinde 400 dönmeli.

### D2 – Admin rotaları gövdeyi şema doğrulamasından geçirmiyor
- **Efor:** M
- **Kanıt:** `api/admin/services/route.ts:38-52`
  ```ts
  const body = await request.json();
  ...(body.id ? { id: body.id } : {}), fiyat: Number(body.fiyat), ...
  ```
- **Ne olur:** Hatalı istemci verisi `NaN` fiyat ya da istemcinin seçtiği bir ID ile kaydedilebilir. Etkisi yetkili kullanıcılarla sınırlı.
- **Çözüm:** Her admin rotası için bir zod şeması yazın, örneğin `fiyat: z.number().nonnegative()`, ve `id` alanını istemciden almayın.
- **Doğrulama:** `fiyat: "abc"` gönderildiğinde 400 dönmeli.

### D3 – Tek dosyada dev store ve olası kod tekrarı
- **Efor:** L
- **Kanıt:** `apps/web/src/stores/app-store.ts` 1313 satır. `packages/ui/src/components/appointment-manager.tsx` ile `apps/web/src/components/admin/AppointmentManager.tsx` gibi benzer isimli bileşen çiftleri var. İçerik karşılaştırması yapılmadı; kopya olup olmadıkları doğrulanmadı.
- **Ne olur:** Bakımı zorlaşır ve hata yapma riski artar.
- **Çözüm:** Store'u zustand slice'larına bölün (randevu, galeri, ayarlar). Kullanılmayan bileşenleri silin.
- **Doğrulama:** Testler ve build geçmeli, dosya başına satır sayısı 400'ün altında olmalı.

### D4 – Node 20 kullanımı uyarı veriyor
- **Efor:** S
- **Kanıt:** Test çıktısında `@supabase/supabase-js` uyarısı: "Node.js 20 and below are deprecated".
- **Çözüm:** `package.json`'a `"engines": { "node": ">=22" }` ekleyin ve Vercel'de Node 22 seçin.
- **Doğrulama:** Test çıktısında bu uyarı görünmemeli.

### D5 – Araç çıktıları ve deneme scriptleri depoda
- **Efor:** S
- **Kanıt:** `graphify-out/` (önbellekler, `graph.json`, `.tmp` dosyaları) ve `scripts/test-google-*.mjs` commit'lenmiş. Taramada scriptlerde gizli anahtar bulunmadı.
- **Çözüm:** `.gitignore`'a `graphify-out/` ekleyin, sonra `git rm -r --cached graphify-out`.
- **Doğrulama:** `git ls-files graphify-out` boş dönmeli.

---

## 6. Öncelikli eylem planı

| Sıra | Ne | Bulgular | Efor |
|---|---|---|---|
| 1 (bugün) | Sync rotasına koruma ekleyin. AVIF'i kapatın. Canlıda eski değer kullanıldıysa CRON anahtarını değiştirin. | K1, K2 (geçici), O7 | ~1 saat |
| 2 (bu hafta) | Next.js'i yükseltin | K2 | 1–2 gün |
| 3 (bu hafta) | Yönlendirmeyi düzeltin, rate limit ve Turnstile ekleyin, yorum moderasyonu kurun | Y1–Y4 | ~1,5 gün |
| 4 | Randevu doğrulaması, hata mesajları, profil bağlama | O9, O3, O4, D1 | ~1 gün |
| 5 | Yetki ayrımı, cron tanımı, CSP ve HSTS, beğeni tablosu | O5, O6, O2, O1 | ~1,5 gün |
| 6 | KVKK sayfaları ve onay akışı | O8 | yarım gün + hukuki metin |
| 7 (bakım) | Diğer düşük maddeler. Supabase yedeklerini panodan doğrulayın, hata izleme ekleyin (örn. Sentry). | D2–D5 | süreklilik |

## 7. İyi olanlar

- **Rol yükseltme engeli:** Hem RLS hem `prevent_self_role_escalation` trigger'ı kullanılıyor (`0012…sql:104-134`).
- **Misafir profili devralma:** Yalnızca telefonu doğrulanmış kullanıcılar devralabiliyor (`0015…sql:101-120`).
- **Admin API ve sayfa koruması:** `withStaffOrAdminAuth` sunucuda `getUser()` ile oturumu ve rolü doğruluyor. Middleware `/admin` ve `/profil` sayfalarını koruyor.
- **Cron koruması:** Anahtar tanımlı değilse cron rotası çalışmıyor, Bearer başlığı kontrol ediliyor.
- **Upload güvenliği:** MIME ve klasör izin listesi, dosya adı temizleme, 50 MB sınırı var. Production'da yerel diske yazılmıyor.
- **Anahtar yönetimi:** Service-role anahtarı istemciye sızmıyor, `.env` dosyaları commit'lenmemiş.
- **Test ve kalite:** 203 test geçiyor, `tsc` ve lint temiz.
- **SEO ve hata sayfaları:** `robots`, `sitemap`, JSON-LD, `error`, `global-error`, `not-found` ve yükleme ekranları mevcut.

## 8. Doğrulanamayanlar

- Canlı site ve Lighthouse ölçümü
- Supabase panosundaki gerçek RLS, Storage politikaları ve yedekler
- Erişilebilirlik (WCAG AA): ayrıntılı incelenmedi, bulgu raporlanmadı

---

## 9. Node.js 26.13.0 yükseltmesi

### Karar
**Kod Node 26.13.0'da sorunsuz çalışıyor, ancak şu an Vercel'e Node 26 ile deploy edilemez.** Vercel dokümanına göre (29.10.2026 itibarıyla) yalnızca **24.x (varsayılan)** ve **22.x** destekleniyor. Node 26.13.0 28.10.2026'da çıktı ve LTS ("Lithium"). **Öneri: projeyi şimdi 24.x'e sabitleyin, Vercel 26.x'i eklediğinde tek satırla 26'ya geçin.** Bu yükseltmeyle birlikte K2'yi kapatmak için **Next 15.5.28 + React 19** geçişi de yapılmalı. Bu geçiş test edildi ve sorunsuz çalışıyor.

### Test sonuçları (ayrı kopyada, Node 26.13.0, pnpm 9.15.9)
| Adım | Mevcut (Next 14.2.35, React 18) | Next 15.5.28 + React 19 |
|---|---|---|
| `pnpm install` | OK | OK |
| `tsc --noEmit` | 0 hata | Önce 3 hata (async `cookies()`), düzeltmeden sonra 0 hata |
| `next lint` | 0 uyarı | 0 uyarı (`next lint` kullanımdan kalkıyor uyarısı var) |
| Vitest | 21 dosya, 203/203 geçti | 21 dosya, 203/203 geçti |
| `next build` | OK, ortak JS 87,3 kB | OK, ortak JS 102 kB, middleware 95 kB |
| `next start` smoke | / 200, /hizmetler 200, /randevu 200, /admin 307, robots 200, sitemap 200 | Aynı |
| `pnpm audit --prod` | 30 açık (3 kritik, 12 yüksek) | 5 açık (0 kritik, 3 yüksek, 2 orta) |

- Native bağımlılık sorunu çıkmadı; build sharp olmadan da tamamlandı.
- Node 26 altında görülen yeni uyarılar:
  - Vite CJS API deprecated uyarısı (vitest 1.x kaynaklı).
  - Testlerde `ExperimentalWarning: localStorage` uyarısı.
  - Bunların ikisi de zararsız.

### Gereken kod değişiklikleri (Next 15)
1. `apps/web/src/lib/supabase/server.ts`:
   - `createClient` fonksiyonunu `async` yapın ve `const cookieStore = await cookies();` kullanın.
   - `get/set/remove` yerine `@supabase/ssr` önerisine uygun `getAll/setAll` yazın:
```ts
export async function createClient() {
  const cookieStore = await cookies();
  // ...
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list) {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Component içinde çerez yazılamaz */ }
      },
    },
  });
}
```
2. Aşağıdaki 4 dosyada `createClient()` çağrısını `await createClient()` yapın:
   - `auth/callback/route.ts`
   - `api/appointments/route.ts`
   - `api/gallery/like/route.ts`
   - `lib/auth/api-guard.ts`
3. `next-env.d.ts` dosyası otomatik olarak güncellenir.

### Yapılandırma değişiklikleri
- `package.json` (kök ve `apps/web`): `"engines": { "node": "24.x" }`. Vercel'de 26 desteği gelince `"26.x"` yapın.
- Köke `.nvmrc` ekleyin: `24`, sonra `26`.
- Vercel → Project Settings → Build & Deployment → Node.js Version: **24.x**.
- `"packageManager": "pnpm@9.15.9"` (şu an 9.4.0). İsterseniz pnpm 10 da kullanılabilir, ama bu test edilmedi.

### Paket listesi (mevcut → hedef)
| Paket | Mevcut | Hedef | Not |
|---|---|---|---|
| next | 14.2.35 | **15.5.28** | Test edildi. 14.x için yeni yama yok (son sürüm 14.2.35). |
| react / react-dom | ^18.3.1 | **^19** | Test edildi. `packages/ui` peer aralığı da `^19` yapılmalı. |
| eslint-config-next | ^14.2.5 | 15.5.28 | Test edildi |
| @types/react, @types/react-dom | ^18 | ^19 | Test edildi |
| @types/node | ^20.14.0 | ^24 | Test edildi |
| postcss | ^8.4.38 | ≥8.5.23 | Kalan PostCSS açıkları Next'in kendi gömülü postcss'inden geliyor. `pnpm.overrides` ile zorlanabilir, ama bu test edilmedi. |
| zod | ^3.23.8 | 4.6.7 (≥4.6.6) | **Majör sürüm, test edilmedi.** Bellek tüketimi (DoS) açığı var. Ayrı bir PR'da yapılmalı (`.errors` → `.issues` vb. API farkları var). |
| vitest | 1.6.1 | 5.x | Sadece geliştirme ortamında. Ayrı yapılmalı, test edilmedi. |
| Next 16.4.3 (latest) | – | – | Denenmedi. 15.5.28'e geçtikten sonra ikinci adım olarak değerlendirilmeli. |

### Riskler
- Vercel'de engines alanına `26.x` yazmak build'i bozar ya da varsayılana düşürür. Destek gelene kadar 24.x kullanın.
- React 19 ile üçüncü parti bileşenlerde peer uyarıları çıkabilir. Test ve build temiz geçti.
- Next 15'te `fetch` ve GET route handler'ları artık varsayılan olarak cache'lenmiyor. Davranış daha güvenli, ama performansı gözlemleyin.
- Smoke testi sahte Supabase ortam değişkenleriyle yapıldı. Giriş ve randevu akışı gerçek Supabase üzerinde preview deploy'da elle denenmeli.

### Adım adım plan
1. Yeni bir branch açın. Node 24 ile `.nvmrc`, `engines` ve `packageManager` ayarlarını ekleyin.
2. Next 15.5.28, React 19 ve tiplerini güncelleyin. Yukarıdaki 5 dosyadaki değişikliği yapın.
3. Sırayla `pnpm install`, `tsc`, `lint`, `vitest` ve `next build` çalıştırın.
4. Vercel ayarını 24.x yapın. Preview deploy'da giriş, randevu, admin ve galeri akışlarını elle test edin.
5. Ayrı PR'larda zod 4 geçişini ve postcss override'ını yapın.
6. Vercel Node 26.x desteğini duyurunca `engines` değerini `26.x`, `.nvmrc` değerini `26` yapın ve Vercel ayarını güncelleyin. Kod tarafında ek değişiklik gerekmiyor (Node 26 ile doğrulandı).
