# Graph Report - yildiz-bayan-kuaforu  (2026-10-28)

## Corpus Check
- 200 files · ~96,804 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 962 nodes · 2198 edges · 63 communities (46 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba84ff32`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- services.test.ts
- types/src/index.ts
- web/package.json
- compilerOptions
- app-store.ts
- ui/package.json
- compilerOptions
- web/package.json
- ref_vitest
- Badge
- test-data.ts
- devDependencies
- types/package.json
- AdminTopbar.tsx
- AdminPage
- tasks
- admin.ts
- package.json
- settings/route.ts
- web/tsconfig.json
- YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)
- test-supabase.mjs
- Badge
- getSupabaseAdmin
- prettier/.prettierrc.json
- types/tsconfig.json
- .prettierrc.json
- scripts
- business-rules.test.ts
- ui/tsconfig.json
- InventoryService
- api-guard.ts
- config/package.json
- ServiceService
- Antigravity Direktör & Claude İcracı Çalışma Kuralı
- admin/appointments/route.ts
- phase3-seo-security-perf.test.ts
- tailwind.config.ts
- compilerOptions
- tailwind-merge@^2.3.0
- AGENTS.md
- CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ
- CLAUDE.md
- @typescript-eslint/eslint-plugin@^7.18.0
- YILDIZ BAYAN KUAFÖRÜ - Notlar / Değişiklik Talepleri
- pnpm-workspace.yaml
- content-management.test.ts
- @yildiz/config@workspace:*
- eslint-config-prettier@^9.1.0
- upload/route.ts
- api-appointments.test.ts
- settings/route.ts
- expire-appointments/route.ts
- middleware.test.ts
- admin/page.tsx
- inventory.service.ts
- postcss@^8.4.38
- @types/react-dom@^18.3.0

## God Nodes (most connected - your core abstractions)
1. `Button()` - 61 edges
2. `Badge()` - 57 edges
3. `next` - 55 edges
4. `getSupabaseAdmin()` - 55 edges
5. `Card()` - 38 edges
6. `useAppStore` - 35 edges
7. `PageLoader()` - 32 edges
8. `AdminPage()` - 26 edges
9. `generateSafeUUID()` - 26 edges
10. `Database` - 22 edges

## Surprising Connections (you probably didn't know these)
- `ContactMapEmbed()` --calls--> `Card()`  [EXTRACTED]
  apps/web/src/components/contact/ContactMapEmbed.tsx → packages/ui/src/components/card.tsx
- `AdminPage()` --calls--> `generateSafeUUID()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/types/src/index.ts
- `AdminPage()` --calls--> `AdminDashboard()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/admin-dashboard.tsx
- `POST()` --calls--> `generateSafeUUID()`  [EXTRACTED]
  apps/web/src/app/api/appointments/route.ts → packages/types/src/index.ts
- `DegerlendirContent()` --calls--> `Badge()`  [EXTRACTED]
  apps/web/src/app/degerlendir/page.tsx → packages/ui/src/components/badge.tsx

## Import Cycles
- None detected.

## Communities (63 total, 17 thin omitted)

### Community 0 - "services.test.ts"
Cohesion: 0.20
Nodes (4): LoyaltyLedgerInsert, PaymentInsert, PaymentRow, PaymentService

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (32): RFC-4122, AboutTexts, AboutTextsSchema, AppointmentSourceSchema, ArtistSectionTexts, ArtistSectionTextsSchema, ArtistVipFeature, ArtistVipFeatureSchema (+24 more)

### Community 2 - "web/package.json"
Cohesion: 0.20
Nodes (9): clsx@^2.1.1, tailwindcss@^3.4.4, @typescript-eslint/parser@^7.18.0, clsx, tailwindcss, @typescript-eslint/parser, name, private (+1 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "app-store.ts"
Cohesion: 0.06
Nodes (43): metadata, RootLayout(), salonJsonLd, AppBootstrapper(), NavigationProgressBar(), ReviewsSectionProps, Toaster(), AuthProvider() (+35 more)

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.12
Nodes (17): dependencies, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/ssr@^0.12.7, @supabase/supabase-js@^2.118.0, @yildiz/types@workspace:*, @yildiz/ui@workspace:* (+9 more)

### Community 9 - "Badge"
Cohesion: 0.07
Nodes (60): HomePage(), AboutCollageSection(), AboutCollageSectionProps, AppointmentTracker(), AppointmentTrackerProps, Hero(), HeroProps, ReviewsSection() (+52 more)

### Community 10 - "test-data.ts"
Cohesion: 0.31
Nodes (8): INITIAL_MOCK_PAYMENTS, MOCK_SERVICES, MOCK_STAFF, MOCK_STOCK_ITEMS, MOCK_SUPPLIERS, CashPaymentSchema, StockItemSchema, SupplierItemSchema

### Community 11 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer@^10.4.19, eslint@^8.57.0, eslint-config-next@^14.2.5, @types/node@^20.14.0, @types/react@^18.3.3, typescript@^5.4.5, vitest@^1.6.0 (+7 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 13 - "AdminTopbar.tsx"
Cohesion: 0.39
Nodes (5): AdminDrawerProps, AdminFixedFooterProps, AdminSidebarProps, AdminTab, AdminTopbarProps

### Community 14 - "AdminPage"
Cohesion: 0.17
Nodes (5): AppointmentInsert, AppointmentRow, AppointmentService, AppointmentUpdate, AppointmentStatus

### Community 15 - "tasks"
Cohesion: 0.17
Nodes (11): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+3 more)

### Community 16 - "admin.ts"
Cohesion: 0.25
Nodes (5): DELETE, dynamic, GET, dynamic, POST()

### Community 17 - "package.json"
Cohesion: 0.10
Nodes (23): devDependencies, eslint@^8.57.0, prettier@^3.3.2, turbo@^2.0.4, typescript@^5.4.5, vitest@^1.6.0, eslint, typescript (+15 more)

### Community 18 - "settings/route.ts"
Cohesion: 0.09
Nodes (24): dynamic, GET(), POST(), dynamic, GET(), POST(), GalleryInsert, GalleryRow (+16 more)

### Community 19 - "web/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, paths, resolveJsonModule, exclude, extends, include, @yildiz/types, @yildiz/config/tsconfig/nextjs.json

### Community 20 - "YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)"
Cohesion: 0.05
Nodes (40): 10. Admin Paneli, 11. Hizmetler, 12. Renk Paleti (BeautyZone Resmi Salon Paleti), 13. Tasarım Detayları, 14. Gerçek Zamanlı Güncelleme, 15. Ek Kararlar ve Detaylar, 16. Diğer Kararlar, 17. Açık Riskler ve Dikkat Edilmesi Gerekenler (+32 more)

### Community 21 - "test-supabase.mjs"
Cohesion: 0.07
Nodes (20): __dirname, envPath, __filename, __dirname, envPath, __filename, __dirname, envPath (+12 more)

### Community 22 - "Badge"
Cohesion: 0.06
Nodes (45): DegerlendirContent(), DegerlendirPage(), GalleryPage(), LoginForm(), LoginPage(), AboutPage(), ServicesPage(), ContactMapEmbed (+37 more)

### Community 23 - "getSupabaseAdmin"
Cohesion: 0.12
Nodes (31): DELETE, dynamic, GET, PATCH, POST, DELETE, dynamic, GET (+23 more)

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

### Community 29 - "business-rules.test.ts"
Cohesion: 0.25
Nodes (7): AppointmentStatusSchema, BookingWizardFormSchema, calculateElapsedWorkingMinutes(), calculatePackageRefund(), CustomerReviewSchema, parseWorkingWindow(), UserRoleSchema

### Community 30 - "ui/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, extends, include, @yildiz/types, @yildiz/config/tsconfig/react-library.json

### Community 32 - "api-guard.ts"
Cohesion: 0.10
Nodes (19): metadata, dynamic, NormalizedAppointmentSchema, POST(), RawAppointmentBodySchema, dynamic, GalleryLikeSchema, POST() (+11 more)

### Community 33 - "config/package.json"
Cohesion: 0.33
Nodes (5): exports, main, name, private, version

### Community 34 - "ServiceService"
Cohesion: 0.18
Nodes (4): ServiceInsert, ServiceRow, ServiceService, ServiceUpdate

### Community 35 - "Antigravity Direktör & Claude İcracı Çalışma Kuralı"
Cohesion: 0.50
Nodes (3): 1. Temel Rol Ayrımı ve Sorumluluklar, 2. Standart İş Akışı Döngüsü, Antigravity Direktör & Claude İcracı Çalışma Kuralı

### Community 36 - "admin/appointments/route.ts"
Cohesion: 0.40
Nodes (4): DELETE, dynamic, GET, PATCH

### Community 37 - "phase3-seo-security-perf.test.ts"
Cohesion: 0.36
Nodes (3): nextConfig, robots(), sitemap()

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
Cohesion: 0.19
Nodes (11): INITIAL_MOCK_APPOINTMENTS, MOCK_GALLERY, MOCK_REVIEWS, AppointmentItemSchema, BookingRulesSchema, GalleryItemSchema, PageTextsSchema, SalonInfoSchema (+3 more)

### Community 53 - "upload/route.ts"
Cohesion: 0.22
Nodes (8): ALLOWED_FOLDERS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, AllowedFolder, dynamic, isAllowedFolder(), MIME_TO_EXT, POST

### Community 54 - "api-appointments.test.ts"
Cohesion: 0.25
Nodes (7): mockFrom, mockIn, mockInsert, mockLimit, mockMaybeSingle, mockSelect, mockSingle

### Community 55 - "settings/route.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET, handleGet(), handlePost(), POST, PUT, RouteHandler, withStaffOrAdminAuth() (+5 more)

### Community 57 - "expire-appointments/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, GET(), normalizeWorkingHours(), POST(), { mockSupabase, updatedIds }, isPendingAppointmentExpired()

### Community 58 - "middleware.test.ts"
Cohesion: 0.25
Nodes (7): config, middleware(), mockEq, mockFrom, mockGetUser, mockSelect, mockSingle

### Community 59 - "admin/page.tsx"
Cohesion: 0.20
Nodes (16): AdminPage(), loadLiveAdminData(), AppointmentManager, CashRegisterPOS, GalleryManager, ReviewsManager, ServiceManager, SiteSettingsManager (+8 more)

### Community 60 - "inventory.service.ts"
Cohesion: 0.29
Nodes (6): InventoryInsert, InventoryRow, InventoryUpdate, SupplierInsert, SupplierRow, SupplierUpdate

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 392 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `api-guard.ts` to `web/package.json`, `admin/appointments/route.ts`, `app-store.ts`, `phase3-seo-security-perf.test.ts`, `web/package.json`, `Badge`, `AdminTopbar.tsx`, `admin.ts`, `settings/route.ts`, `settings/route.ts`, `upload/route.ts`, `getSupabaseAdmin`, `Badge`, `expire-appointments/route.ts`, `middleware.test.ts`, `admin/page.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `ContentService` connect `app-store.ts` to `services.test.ts`, `settings/route.ts`, `admin/page.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `useAppStore` connect `app-store.ts` to `Badge`, `ServiceService`, `admin/page.tsx`, `Badge`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `app-store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06331976481230213 - nodes in this community are weakly interconnected._