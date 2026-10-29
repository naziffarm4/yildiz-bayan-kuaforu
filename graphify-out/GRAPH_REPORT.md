# Graph Report - yildiz-bayan-kuaforu  (2026-10-29)

## Corpus Check
- 224 files · ~108,318 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 1123 nodes · 2585 edges · 73 communities (52 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `753a9c26`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- inventory.service.ts
- types/src/index.ts
- ServiceItem
- compilerOptions
- Card
- ui/package.json
- compilerOptions
- web/package.json
- inventory.service.ts
- admin/page.tsx
- auth-callback.test.ts
- devDependencies
- types/package.json
- app-store.ts
- AdminPage
- tasks
- 3. Güvenlik Bulguları
- package.json
- next
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
- business-rules.test.ts
- config/package.json
- ServiceService
- Antigravity Direktör & Claude İcracı Çalışma Kuralı
- AdminTopbar.tsx
- ref_vitest
- content-management.test.ts
- compilerOptions
- PaymentService
- AGENTS.md
- CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ
- CLAUDE.md
- env.ts
- YILDIZ BAYAN KUAFÖRÜ - Notlar / Değişiklik Talepleri
- pnpm-workspace.yaml
- content-management.test.ts
- api/appointments/route.ts
- steps
- Button
- admin/appointments/route.ts
- stock-manager.tsx
- middleware.test.ts
- database.types.ts
- degerlendir/layout.tsx
- upload/route.ts
- web/package.json
- content.service.ts
- parseJsonBody
- galeri/layout.tsx
- updates
- hakkimizda/layout.tsx
- iletisim/layout.tsx
- kayit/layout.tsx
- randevu/layout.tsx
- @typescript-eslint/parser@^7.18.0
- postcss@^8.4.38

## God Nodes (most connected - your core abstractions)
1. `next` - 67 edges
2. `Button()` - 61 edges
3. `Badge()` - 59 edges
4. `getSupabaseAdmin()` - 58 edges
5. `safeErrorResponse()` - 48 edges
6. `useAppStore` - 40 edges
7. `Card()` - 40 edges
8. `PageLoader()` - 32 edges
9. `AdminPage()` - 27 edges
10. `generateSafeUUID()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `G-02 🔴 `/api/admin/sync/google-reviews` — kimlik doğrulaması yok` --references--> `withStaffOrAdminAuth()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/auth/api-guard.ts
- `G-09 🟠 Admin API girdi doğrulaması` --references--> `getSupabaseAdmin()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/supabase/admin.ts
- `G-14 🟡 Oturum / token yönetimi (olumlu ve iyileştirme)` --references--> `getSupabaseAdmin()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/supabase/admin.ts
- `P-05 Paket ve derleme` --references--> `AdminDashboard()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → packages/ui/src/components/admin-dashboard.tsx
- `7. Önerilen Düzeltme Sırası` --references--> `safeRedirectPath()`  [INFERRED]
  YILDIZ-BAYAN-KUAFORU-Guvenlik-ve-Kod-Inceleme-Raporu.md → apps/web/src/lib/safe-redirect.ts

## Import Cycles
- None detected.

## Communities (73 total, 21 thin omitted)

### Community 0 - "inventory.service.ts"
Cohesion: 0.22
Nodes (6): LoyaltyLedgerInsert, PaymentInsert, PaymentRow, ServiceInsert, ServiceRow, ServiceUpdate

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (31): RFC-4122, AboutTexts, AboutTextsSchema, AppointmentSourceSchema, ArtistSectionTexts, ArtistSectionTextsSchema, ArtistVipFeature, ArtistVipFeatureSchema (+23 more)

### Community 2 - "ServiceItem"
Cohesion: 0.12
Nodes (24): AppointmentTrackerProps, ServiceCatalogProps, AppointmentItem, calculateCommission(), calculateLoyaltyDiscount(), calculateLoyaltyPoints(), CashPayment, generateSafeUUID() (+16 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "Card"
Cohesion: 0.23
Nodes (12): LoginForm(), LoginPage(), ContactMapEmbed, RegisterForm(), RegisterPage(), ContactMapEmbed(), ContactMapEmbedProps, ContactMapSkeleton() (+4 more)

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.11
Nodes (18): dependencies, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/supabase-js@^2.118.0, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, @yildiz/ui@workspace:* (+10 more)

### Community 8 - "inventory.service.ts"
Cohesion: 0.29
Nodes (6): InventoryInsert, InventoryRow, InventoryUpdate, SupplierInsert, SupplierRow, SupplierUpdate

### Community 9 - "admin/page.tsx"
Cohesion: 0.23
Nodes (14): AdminPage(), AppointmentManager, CashRegisterPOS, GalleryManager, ReviewsManager, ServiceManager, SiteSettingsManager, StaffCommissionManager (+6 more)

### Community 10 - "auth-callback.test.ts"
Cohesion: 0.26
Nodes (9): dynamic, GET(), hasControlCharacters(), safeRedirectPath(), mockEq, mockExchangeCodeForSession, mockFrom, mockSelect (+1 more)

### Community 11 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer@^10.4.19, eslint@^8.57.0, tailwindcss@^3.4.4, @types/node@^20.14.0, @types/react@^18.3.3, @types/react-dom@^18.3.0, typescript@^5.4.5 (+11 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 13 - "app-store.ts"
Cohesion: 0.05
Nodes (52): metadata, RootLayout(), salonJsonLd, AppBootstrapper(), NavigationProgressBar(), ReviewsSectionProps, SplitBannerSection(), SplitBannerSectionProps (+44 more)

### Community 14 - "AdminPage"
Cohesion: 0.17
Nodes (5): AppointmentInsert, AppointmentRow, AppointmentService, AppointmentUpdate, AppointmentStatus

### Community 15 - "tasks"
Cohesion: 0.11
Nodes (18): dependsOn, outputs, cache, persistent, globalEnv, dependsOn, inputs, $schema (+10 more)

### Community 16 - "3. Güvenlik Bulguları"
Cohesion: 0.05
Nodes (49): AuthContext, AuthContextType, AuthProvider(), AuthUser, normalizePhoneNumber(), createClient(), AuthState, fetchUserProfile() (+41 more)

### Community 17 - "package.json"
Cohesion: 0.08
Nodes (29): devDependencies, eslint@^8.57.0, prettier@^3.3.2, turbo@^2.0.4, typescript@^5.4.5, vitest@^1.6.0, engines, node (+21 more)

### Community 18 - "next"
Cohesion: 0.10
Nodes (16): dynamic, POST, dynamic, extractSpecialDays(), GET(), normalizeWorkingHours(), dynamic, GET() (+8 more)

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
Cohesion: 0.08
Nodes (12): BadgeProps, ButtonProps, CardProps, CATEGORIES, DEFAULT_FORM_CATEGORIES, GalleryManager(), GalleryManagerProps, PasswordInputProps (+4 more)

### Community 23 - "getSupabaseAdmin"
Cohesion: 0.10
Nodes (45): GET, DELETE, dynamic, GET, AdminGalleryPatchSchema, AdminGalleryPostSchema, DELETE, dynamic (+37 more)

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
Cohesion: 0.26
Nodes (20): DegerlendirContent(), DegerlendirPage(), GalleryPage(), AboutPage(), ServicesPage(), ContactPage(), KvkkPage(), ProfilePage() (+12 more)

### Community 30 - "ui/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, extends, include, @yildiz/types, @yildiz/config/tsconfig/react-library.json

### Community 32 - "business-rules.test.ts"
Cohesion: 0.25
Nodes (7): AppointmentStatusSchema, BookingWizardFormSchema, calculateElapsedWorkingMinutes(), calculatePackageRefund(), CustomerReviewSchema, parseWorkingWindow(), UserRoleSchema

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
Cohesion: 0.06
Nodes (16): nextConfig, metadata, metadata, metadata, metadata, metadata, robots(), sitemap() (+8 more)

### Community 38 - "content-management.test.ts"
Cohesion: 0.33
Nodes (5): BookingRulesSchema, GalleryItemSchema, PageTextsSchema, SalonInfoSchema, SpecialDaySchema

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
Cohesion: 0.18
Nodes (15): INITIAL_MOCK_APPOINTMENTS, INITIAL_MOCK_PAYMENTS, MOCK_GALLERY, MOCK_REVIEWS, MOCK_SERVICES, MOCK_STAFF, MOCK_STOCK_ITEMS, MOCK_SUPPLIERS (+7 more)

### Community 51 - "api/appointments/route.ts"
Cohesion: 0.15
Nodes (16): dynamic, NormalizedAppointmentSchema, POST(), RawAppointmentBodySchema, buckets, idempotencyKeys, isDuplicateIdempotencyKey(), recordIdempotencyKey() (+8 more)

### Community 52 - "steps"
Cohesion: 0.07
Nodes (26): concurrency, cancel-in-progress, group, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, jobs, quality (+18 more)

### Community 53 - "Button"
Cohesion: 0.26
Nodes (14): HomePage(), AboutCollageSection(), AboutCollageSectionProps, AppointmentTracker(), Hero(), HeroProps, ReviewsSection(), getServiceIcon() (+6 more)

### Community 54 - "admin/appointments/route.ts"
Cohesion: 0.16
Nodes (19): AdminAppointmentPatchSchema, DELETE, dynamic, PATCH, dynamic, GET, handlePost(), POST (+11 more)

### Community 55 - "stock-manager.tsx"
Cohesion: 0.31
Nodes (6): StockItem, SupplierItem, StockManager(), StockManagerProps, SupplierManager(), SupplierManagerProps

### Community 58 - "middleware.test.ts"
Cohesion: 0.20
Nodes (9): @supabase/ssr@^0.12.7, config, middleware(), mockEq, mockFrom, mockGetUser, mockSelect, mockSingle (+1 more)

### Community 59 - "database.types.ts"
Cohesion: 0.33
Nodes (5): AppointmentSource, AppointmentStatus, LoyaltyTransactionType, PaymentMethod, UserRole

### Community 61 - "upload/route.ts"
Cohesion: 0.21
Nodes (10): ALLOWED_FOLDERS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, AllowedFolder, dynamic, isAllowedFolder(), MIME_TO_EXT, POST (+2 more)

### Community 62 - "web/package.json"
Cohesion: 0.17
Nodes (11): clsx@^2.1.1, eslint-config-next@^14.2.5, eslint-config-prettier@^9.1.0, @typescript-eslint/eslint-plugin@^7.18.0, clsx, eslint-config-prettier, @typescript-eslint/eslint-plugin, name (+3 more)

### Community 63 - "content.service.ts"
Cohesion: 0.20
Nodes (9): GalleryInsert, GalleryRow, GalleryRowWithCounts, GalleryUpdate, ReviewInsert, ReviewRow, ReviewUpdate, SiteSettingsRow (+1 more)

### Community 64 - "parseJsonBody"
Cohesion: 0.26
Nodes (12): dynamic, GalleryCommentPostSchema, POST(), dynamic, GalleryLikeSchema, POST(), dynamic, POST() (+4 more)

### Community 66 - "updates"
Cohesion: 0.25
Nodes (7): interval, updates, directory, open-pull-requests-limit, package-ecosystem, schedule, version

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 480 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Card`, `web/package.json`, `admin/page.tsx`, `auth-callback.test.ts`, `app-store.ts`, `getSupabaseAdmin`, `Card`, `AdminTopbar.tsx`, `ref_vitest`, `api/appointments/route.ts`, `Button`, `admin/appointments/route.ts`, `middleware.test.ts`, `degerlendir/layout.tsx`, `upload/route.ts`, `web/package.json`, `parseJsonBody`, `galeri/layout.tsx`, `hakkimizda/layout.tsx`, `iletisim/layout.tsx`, `kayit/layout.tsx`, `randevu/layout.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `getSupabaseAdmin()` (e.g. with `api-appointments.test.ts` and `5. Kod Kalitesi Bulguları`) actually correct?**
  _`getSupabaseAdmin()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Why does `getSupabaseAdmin()` connect `getSupabaseAdmin` to `parseJsonBody`, `ref_vitest`, `3. Güvenlik Bulguları`, `next`, `api/appointments/route.ts`, `admin/appointments/route.ts`, `upload/route.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `ServiceItem` be split into smaller, more focused modules?**
  _Cohesion score 0.11746031746031746 - nodes in this community are weakly interconnected._
- **Why does `ContentService` connect `app-store.ts` to `inventory.service.ts`, `admin/page.tsx`, `PaymentService`, `content.service.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._