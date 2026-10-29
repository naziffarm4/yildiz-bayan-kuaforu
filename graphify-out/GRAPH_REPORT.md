# Graph Report - yildiz-bayan-kuaforu  (2026-10-29)

## Corpus Check
- 226 files · ~113,205 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 1166 nodes · 2634 edges · 74 communities (55 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `314639b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- services.test.ts
- types/src/index.ts
- ServiceItem
- compilerOptions
- ui/src/index.ts
- ui/package.json
- compilerOptions
- web/package.json
- 4. Orta
- admin/page.tsx
- api-guard.test.ts
- web/package.json
- types/package.json
- app-store.ts
- AdminPage
- tasks
- 3. Güvenlik Bulguları
- package.json
- sync-google-reviews/route.ts
- web/tsconfig.json
- YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)
- test-supabase.mjs
- ui/src/index.ts
- getSupabaseAdmin
- prettier/.prettierrc.json
- types/tsconfig.json
- .prettierrc.json
- scripts
- Card
- ui/tsconfig.json
- InventoryService
- inventory.service.ts
- config/package.json
- ServiceService
- Antigravity Direktör & Claude İcracı Çalışma Kuralı
- AdminTopbar.tsx
- ref_vitest
- auth-context.tsx
- compilerOptions
- PaymentService
- AGENTS.md
- CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ
- CLAUDE.md
- env.ts
- YILDIZ BAYAN KUAFÖRÜ - Notlar / Değişiklik Talepleri
- pnpm-workspace.yaml
- content-management.test.ts
- api-appointments.test.ts
- steps
- Button
- admin/appointments/route.ts
- database.types.ts
- ref_vitest
- middleware.test.ts
- app/layout.tsx
- eslint@^8.57.0
- upload/route.ts
- content.service.ts
- next
- galeri/layout.tsx
- updates
- hakkimizda/layout.tsx
- randevu/layout.tsx
- content-context.tsx
- expire-appointments/route.ts
- ContentService
- auth-store.test.ts
- toast-store.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `next` - 67 edges
2. `Button()` - 61 edges
3. `getSupabaseAdmin()` - 59 edges
4. `Badge()` - 59 edges
5. `safeErrorResponse()` - 48 edges
6. `useAppStore` - 40 edges
7. `Card()` - 40 edges
8. `PageLoader()` - 32 edges
9. `AdminPage()` - 27 edges
10. `generateSafeUUID()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `K1 – Admin Google senkronizasyon uç noktası girişsiz çalışıyor` --references--> `withStaffOrAdminAuth()`  [INFERRED]
  yildiz-bayan-kuaforu-denetim-raporu.md → apps/web/src/lib/auth/api-guard.ts
- `G-02 🔴 `/api/admin/sync/google-reviews` — kimlik doğrulaması yok` --references--> `withStaffOrAdminAuth()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/auth/api-guard.ts
- `Y2 – Herkese açık formlarda hız sınırı ve bot koruması yok` --references--> `getSupabaseAdmin()`  [INFERRED]
  yildiz-bayan-kuaforu-denetim-raporu.md → apps/web/src/lib/supabase/admin.ts
- `G-09 🟠 Admin API girdi doğrulaması` --references--> `getSupabaseAdmin()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/supabase/admin.ts
- `G-14 🟡 Oturum / token yönetimi (olumlu ve iyileştirme)` --references--> `getSupabaseAdmin()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/supabase/admin.ts

## Import Cycles
- None detected.

## Communities (74 total, 19 thin omitted)

### Community 0 - "services.test.ts"
Cohesion: 0.22
Nodes (6): LoyaltyLedgerInsert, PaymentInsert, PaymentRow, ServiceInsert, ServiceRow, ServiceUpdate

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (40): RFC-4122, AboutTexts, AboutTextsSchema, AppointmentSource, AppointmentSourceSchema, AppointmentStatusSchema, ArtistSectionTexts, ArtistSectionTextsSchema (+32 more)

### Community 2 - "ServiceItem"
Cohesion: 0.12
Nodes (22): AppointmentTrackerProps, ServiceCatalogProps, AppointmentItem, calculateCommission(), calculateLoyaltyDiscount(), calculateLoyaltyPoints(), CashPayment, PaymentMethod (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "ui/src/index.ts"
Cohesion: 0.12
Nodes (17): ContactMapEmbed, ContactMapEmbed(), ContactMapEmbedProps, ContactMapSkeleton(), Card(), CardProps, CATEGORIES, DEFAULT_FORM_CATEGORIES (+9 more)

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.10
Nodes (20): dependencies, clsx@^2.1.1, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/supabase-js@^2.118.0, tailwind-merge@^2.3.0, @yildiz/types@workspace:* (+12 more)

### Community 8 - "4. Orta"
Cohesion: 0.05
Nodes (36): 1. Özet, 2. Kritik, 3. Yüksek, 4. Orta, 5. Düşük, 6. Öncelikli eylem planı, 8. Doğrulanamayanlar, 9. Node.js 26.13.0 yükseltmesi (+28 more)

### Community 9 - "admin/page.tsx"
Cohesion: 0.23
Nodes (14): AdminPage(), AppointmentManager, CashRegisterPOS, GalleryManager, ReviewsManager, ServiceManager, SiteSettingsManager, StaffCommissionManager (+6 more)

### Community 10 - "api-guard.test.ts"
Cohesion: 0.25
Nodes (6): collectRouteFiles(), mockEq, mockFrom, mockGetUser, mockSelect, mockSingle

### Community 11 - "web/package.json"
Cohesion: 0.09
Nodes (30): devDependencies, autoprefixer@^10.4.19, eslint-config-next@^14.2.5, eslint-config-prettier@^9.1.0, postcss@^8.4.38, tailwindcss@^3.4.4, @types/node@^20.14.0, @types/react@^18.3.3 (+22 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 13 - "app-store.ts"
Cohesion: 0.22
Nodes (15): AppSyncMessage, fetchAdminFullName(), GalleryCommentRow, getApiUrl(), getBroadcastChannel(), getStoredLikes(), LEGACY_ADMIN_NAME, mapAppointmentFromPayload() (+7 more)

### Community 14 - "AdminPage"
Cohesion: 0.17
Nodes (5): AppointmentInsert, AppointmentRow, AppointmentService, AppointmentUpdate, AppointmentStatus

### Community 15 - "tasks"
Cohesion: 0.11
Nodes (18): dependsOn, outputs, cache, persistent, globalEnv, dependsOn, inputs, $schema (+10 more)

### Community 16 - "3. Güvenlik Bulguları"
Cohesion: 0.06
Nodes (39): dynamic, GET(), hasControlCharacters(), safeRedirectPath(), mockEq, mockExchangeCodeForSession, mockFrom, mockSelect (+31 more)

### Community 17 - "package.json"
Cohesion: 0.08
Nodes (29): devDependencies, eslint@^8.57.0, prettier@^3.3.2, turbo@^2.0.4, typescript@^5.4.5, vitest@^1.6.0, engines, node (+21 more)

### Community 18 - "sync-google-reviews/route.ts"
Cohesion: 0.27
Nodes (8): dynamic, POST, dynamic, GET(), executeGoogleSync(), GooglePlacesResponse, GooglePlacesReview, { mockGetUser, mockMaybeSingle }

### Community 19 - "web/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, paths, resolveJsonModule, exclude, extends, include, @yildiz/types, @yildiz/config/tsconfig/nextjs.json

### Community 20 - "YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)"
Cohesion: 0.05
Nodes (40): 10. Admin Paneli, 11. Hizmetler, 12. Renk Paleti (BeautyZone Resmi Salon Paleti), 13. Tasarım Detayları, 14. Gerçek Zamanlı Güncelleme, 15. Ek Kararlar ve Detaylar, 16. Diğer Kararlar, 17. Açık Riskler ve Dikkat Edilmesi Gerekenler (+32 more)

### Community 21 - "test-supabase.mjs"
Cohesion: 0.07
Nodes (20): __dirname, envPath, __filename, __dirname, envPath, __filename, __dirname, envPath (+12 more)

### Community 22 - "ui/src/index.ts"
Cohesion: 0.05
Nodes (14): metadata, metadata, metadata, generateSafeUUID(), SupplierItem, BadgeProps, ALL_TIME_SLOTS, ButtonProps (+6 more)

### Community 23 - "getSupabaseAdmin"
Cohesion: 0.11
Nodes (44): GET, DELETE, dynamic, GET, AdminGalleryPatchSchema, AdminGalleryPostSchema, DELETE, dynamic (+36 more)

### Community 24 - "prettier/.prettierrc.json"
Cohesion: 0.25
Nodes (7): arrowParens, endOfLine, printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 25 - "types/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, module, moduleResolution, rootDir, extends, include, @yildiz/config/tsconfig/base.json

### Community 26 - ".prettierrc.json"
Cohesion: 0.25
Nodes (7): arrowParens, endOfLine, printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 28 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, type-check

### Community 29 - "Card"
Cohesion: 0.21
Nodes (26): DegerlendirContent(), DegerlendirPage(), GalleryPage(), LoginForm(), LoginPage(), AboutPage(), ServicesPage(), ContactPage() (+18 more)

### Community 30 - "ui/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, extends, include, @yildiz/types, @yildiz/config/tsconfig/react-library.json

### Community 32 - "inventory.service.ts"
Cohesion: 0.29
Nodes (6): InventoryInsert, InventoryRow, InventoryUpdate, SupplierInsert, SupplierRow, SupplierUpdate

### Community 33 - "config/package.json"
Cohesion: 0.33
Nodes (5): exports, main, name, private, version

### Community 35 - "Antigravity Direktör & Claude İcracı Çalışma Kuralı"
Cohesion: 0.50
Nodes (3): 1. Temel Rol Ayrımı ve Sorumluluklar, 2. Standart İş Akışı Döngüsü, Antigravity Direktör & Claude İcracı Çalışma Kuralı

### Community 36 - "AdminTopbar.tsx"
Cohesion: 0.39
Nodes (5): AdminDrawerProps, AdminFixedFooterProps, AdminSidebarProps, AdminTab, AdminTopbarProps

### Community 37 - "ref_vitest"
Cohesion: 0.11
Nodes (10): nextConfig, metadata, metadata, metadata, metadata, metadata, robots(), sitemap() (+2 more)

### Community 38 - "auth-context.tsx"
Cohesion: 0.30
Nodes (9): AuthContext, AuthContextType, AuthProvider(), AuthUser, normalizePhoneNumber(), createClient(), AuthState, fetchUserProfile() (+1 more)

### Community 41 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, jsx, module, moduleResolution, paths, extends, ./base.json, @yildiz/types (+1 more)

### Community 44 - "CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ"
Cohesion: 0.33
Nodes (5): 1. Kod Kalitesi ve Güvenlik Zemin Kuralları (Floor - Her Zaman Zorunlu), 2. Sayısal Olarak Dayatılan Kurallar (Enforced with Numbers), 3. Doğrulama Kapısı (Quality Gate Workflow), 4. İstisnalar (Exceptions), CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ

### Community 45 - "CLAUDE.md"
Cohesion: 0.50
Nodes (3): graphify, Use Graphify before grep, Şartnameye Zorunlu Bağlılık Kuralı (Mandatory Project Specification Rule)

### Community 50 - "content-management.test.ts"
Cohesion: 0.14
Nodes (19): INITIAL_MOCK_APPOINTMENTS, INITIAL_MOCK_PAYMENTS, MOCK_GALLERY, MOCK_REVIEWS, MOCK_SERVICES, MOCK_STAFF, MOCK_STOCK_ITEMS, MOCK_SUPPLIERS (+11 more)

### Community 51 - "api-appointments.test.ts"
Cohesion: 0.22
Nodes (8): resetRateLimiter(), mockFrom, mockIn, mockInsert, mockLimit, mockMaybeSingle, mockSelect, mockSingle

### Community 52 - "steps"
Cohesion: 0.07
Nodes (26): concurrency, cancel-in-progress, group, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, jobs, quality (+18 more)

### Community 53 - "Button"
Cohesion: 0.24
Nodes (16): HomePage(), AboutCollageSection(), AboutCollageSectionProps, AppointmentTracker(), Hero(), HeroProps, ReviewsSection(), getServiceIcon() (+8 more)

### Community 54 - "admin/appointments/route.ts"
Cohesion: 0.15
Nodes (20): AdminAppointmentPatchSchema, DELETE, dynamic, PATCH, dynamic, GET, handleGet(), handlePost() (+12 more)

### Community 55 - "database.types.ts"
Cohesion: 0.33
Nodes (5): AppointmentSource, AppointmentStatus, LoyaltyTransactionType, PaymentMethod, UserRole

### Community 58 - "middleware.test.ts"
Cohesion: 0.17
Nodes (9): @supabase/ssr@^0.12.7, config, middleware(), mockEq, mockFrom, mockGetUser, mockSelect, mockSingle (+1 more)

### Community 59 - "app/layout.tsx"
Cohesion: 0.18
Nodes (11): metadata, RootLayout(), salonJsonLd, AppBootstrapper(), NavigationProgressBar(), Toaster(), ContentProvider(), useToastStore (+3 more)

### Community 61 - "upload/route.ts"
Cohesion: 0.21
Nodes (10): ALLOWED_FOLDERS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, AllowedFolder, dynamic, isAllowedFolder(), MIME_TO_EXT, POST (+2 more)

### Community 63 - "content.service.ts"
Cohesion: 0.20
Nodes (9): GalleryInsert, GalleryRow, GalleryRowWithCounts, GalleryUpdate, ReviewInsert, ReviewRow, ReviewUpdate, SiteSettingsRow (+1 more)

### Community 64 - "next"
Cohesion: 0.14
Nodes (22): checkBusinessHours(), dynamic, NormalizedAppointmentSchema, POST(), RawAppointmentBodySchema, WorkingHoursCheck, dynamic, GalleryCommentPostSchema (+14 more)

### Community 66 - "updates"
Cohesion: 0.25
Nodes (7): interval, updates, directory, open-pull-requests-limit, package-ecosystem, schedule, version

### Community 71 - "content-context.tsx"
Cohesion: 0.23
Nodes (16): ReviewsSectionProps, ContentContext, ContentContextType, DEFAULT_BOOKING_RULES, DEFAULT_PAGE_TEXTS, DEFAULT_SPECIAL_DAYS, SALON_INFO, AppState (+8 more)

### Community 73 - "expire-appointments/route.ts"
Cohesion: 0.33
Nodes (7): dynamic, extractSpecialDays(), GET(), normalizeWorkingHours(), verifyCronRequest(), { mockSupabase, updatedIds }, isPendingAppointmentExpired()

### Community 75 - "auth-store.test.ts"
Cohesion: 0.20
Nodes (9): mockFrom, mockGetSession, mockSignInWithOAuth, mockSignInWithOtp, mockSignInWithPassword, mockSignOut, mockSignUp, mockUpdateUser (+1 more)

### Community 76 - "toast-store.ts"
Cohesion: 0.24
Nodes (6): ToastItem, ToastState, ToastType, GetState, SetState, { channelListeners }

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 512 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Card` to `web/package.json`, `admin/page.tsx`, `api-guard.test.ts`, `web/package.json`, `3. Güvenlik Bulguları`, `sync-google-reviews/route.ts`, `ui/src/index.ts`, `getSupabaseAdmin`, `AdminTopbar.tsx`, `ref_vitest`, `Button`, `admin/appointments/route.ts`, `middleware.test.ts`, `app/layout.tsx`, `upload/route.ts`, `next`, `galeri/layout.tsx`, `hakkimizda/layout.tsx`, `randevu/layout.tsx`, `expire-appointments/route.ts`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `getSupabaseAdmin()` (e.g. with `api-appointments.test.ts` and `Y2 – Herkese açık formlarda hız sınırı ve bot koruması yok`) actually correct?**
  _`getSupabaseAdmin()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056910569105691054 - nodes in this community are weakly interconnected._
- **Why does `getSupabaseAdmin()` connect `getSupabaseAdmin` to `next`, `4. Orta`, `expire-appointments/route.ts`, `api-guard.test.ts`, `3. Güvenlik Bulguları`, `sync-google-reviews/route.ts`, `api-appointments.test.ts`, `admin/appointments/route.ts`, `upload/route.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `ServiceItem` be split into smaller, more focused modules?**
  _Cohesion score 0.12477718360071301 - nodes in this community are weakly interconnected._
- **Why does `Yıldız Bayan Kuaförü – Ayrıntılı Kod Denetim Raporu` connect `4. Orta` to `ref_vitest`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._