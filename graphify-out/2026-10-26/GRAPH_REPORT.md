# Graph Report - yildiz-bayan-kuaforu  (2026-10-26)

## Corpus Check
- 190 files · ~89,835 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 927 nodes · 2124 edges · 57 communities (37 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- admin/page.tsx
- types/src/index.ts
- web/package.json
- compilerOptions
- business-rules.test.ts
- ui/package.json
- compilerOptions
- web/package.json
- ref_vitest
- services/route.ts
- middleware.test.ts
- devDependencies
- types/package.json
- api-guard.ts
- api/gallery/comments/route.ts
- tasks
- auth-context.tsx
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
- tailwind-merge@^2.3.0
- ui/tsconfig.json
- eslint-config-prettier@^9.1.0
- admin.ts
- config/package.json
- postcss@^8.4.38
- Antigravity Direktör & Claude İcracı Çalışma Kuralı
- @types/react-dom@^18.3.0
- next.config.mjs
- tailwind.config.ts
- compilerOptions
- app-store.ts
- AGENTS.md
- CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ
- CLAUDE.md
- @typescript-eslint/eslint-plugin@^7.18.0
- YILDIZ BAYAN KUAFÖRÜ - Notlar / Değişiklik Talepleri
- pnpm-workspace.yaml
- content-management.test.ts
- @yildiz/config@workspace:*
- test-data.ts
- admin/layout.tsx

## God Nodes (most connected - your core abstractions)
1. `Badge()` - 61 edges
2. `Button()` - 57 edges
3. `next` - 47 edges
4. `getSupabaseAdmin()` - 47 edges
5. `Card()` - 38 edges
6. `useAppStore` - 31 edges
7. `AdminPage()` - 26 edges
8. `generateSafeUUID()` - 26 edges
9. `PageLoader()` - 25 edges
10. `Database` - 23 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `generateSafeUUID()`  [EXTRACTED]
  apps/web/src/app/api/appointments/route.ts → packages/types/src/index.ts
- `ReviewsSectionProps` --references--> `CustomerReview`  [EXTRACTED]
  apps/web/src/components/ReviewsSection.tsx → packages/types/src/index.ts
- `ServiceCatalogProps` --references--> `ServiceItem`  [EXTRACTED]
  apps/web/src/components/ServiceCatalog.tsx → packages/types/src/index.ts
- `AdminDrawer()` --calls--> `Badge()`  [EXTRACTED]
  apps/web/src/components/admin/AdminDrawer.tsx → packages/ui/src/components/badge.tsx
- `AdminSidebar()` --calls--> `Badge()`  [EXTRACTED]
  apps/web/src/components/admin/AdminSidebar.tsx → packages/ui/src/components/badge.tsx

## Import Cycles
- None detected.

## Communities (57 total, 20 thin omitted)

### Community 0 - "admin/page.tsx"
Cohesion: 0.05
Nodes (29): loadLiveAdminData(), AdminDrawer(), AdminDrawerProps, AdminFixedFooter(), AdminFixedFooterProps, AdminSidebar(), AdminSidebarProps, AdminTab (+21 more)

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (33): RFC-4122, AboutTexts, AboutTextsSchema, AppointmentSource, AppointmentSourceSchema, ArtistSectionTexts, ArtistSectionTextsSchema, ArtistVipFeature (+25 more)

### Community 2 - "web/package.json"
Cohesion: 0.20
Nodes (9): clsx@^2.1.1, tailwindcss@^3.4.4, @typescript-eslint/parser@^7.18.0, clsx, tailwindcss, @typescript-eslint/parser, name, private (+1 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "business-rules.test.ts"
Cohesion: 0.25
Nodes (7): AppointmentStatusSchema, BookingWizardFormSchema, calculateAppointmentTotalDuration(), calculateLoyaltyDiscount(), calculateLoyaltyPoints(), calculatePackageRefund(), UserRoleSchema

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.12
Nodes (17): dependencies, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/ssr@^0.12.7, @supabase/supabase-js@^2.118.0, @yildiz/types@workspace:*, @yildiz/ui@workspace:* (+9 more)

### Community 9 - "services/route.ts"
Cohesion: 0.33
Nodes (5): DELETE, dynamic, GET, PATCH, POST

### Community 10 - "middleware.test.ts"
Cohesion: 0.18
Nodes (9): config, middleware(), mockEq, mockFrom, mockGetUser, mockSelect, mockSingle, Database (+1 more)

### Community 11 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer@^10.4.19, eslint@^8.57.0, eslint-config-next@^14.2.5, @types/node@^20.14.0, @types/react@^18.3.3, typescript@^5.4.5, vitest@^1.6.0 (+7 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 13 - "api-guard.ts"
Cohesion: 0.11
Nodes (19): DELETE, dynamic, GET, dynamic, GET(), RouteHandler, withStaffOrAdminAuth(), createClient() (+11 more)

### Community 14 - "api/gallery/comments/route.ts"
Cohesion: 0.50
Nodes (3): dynamic, GET(), POST()

### Community 15 - "tasks"
Cohesion: 0.17
Nodes (11): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+3 more)

### Community 16 - "auth-context.tsx"
Cohesion: 0.07
Nodes (32): dynamic, POST(), metadata, RootLayout(), AppBootstrapper(), NavigationProgressBar(), Toaster(), AuthContext (+24 more)

### Community 17 - "package.json"
Cohesion: 0.10
Nodes (23): devDependencies, eslint@^8.57.0, prettier@^3.3.2, turbo@^2.0.4, typescript@^5.4.5, vitest@^1.6.0, eslint, typescript (+15 more)

### Community 18 - "settings/route.ts"
Cohesion: 0.11
Nodes (23): dynamic, GET, getSupabaseAdmin(), handleGet(), handlePost(), POST, PUT, dynamic (+15 more)

### Community 19 - "web/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, paths, resolveJsonModule, exclude, extends, include, @yildiz/types, @yildiz/config/tsconfig/nextjs.json

### Community 20 - "YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)"
Cohesion: 0.05
Nodes (40): 10. Admin Paneli, 11. Hizmetler, 12. Renk Paleti, 13. Tasarım Detayları, 14. Gerçek Zamanlı Güncelleme, 15. Ek Kararlar ve Detaylar, 16. Diğer Kararlar, 17. Açık Riskler ve Dikkat Edilmesi Gerekenler (+32 more)

### Community 21 - "test-supabase.mjs"
Cohesion: 0.07
Nodes (20): __dirname, envPath, __filename, __dirname, envPath, __filename, __dirname, envPath (+12 more)

### Community 22 - "Badge"
Cohesion: 0.06
Nodes (82): AdminPage(), DegerlendirContent(), DegerlendirPage(), GalleryPage(), LoginForm(), LoginPage(), AboutPage(), ServicesPage() (+74 more)

### Community 23 - "getSupabaseAdmin"
Cohesion: 0.15
Nodes (25): DELETE, dynamic, GET, PATCH, DELETE, dynamic, GET, PATCH (+17 more)

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

### Community 30 - "ui/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, extends, include, @yildiz/types, @yildiz/config/tsconfig/react-library.json

### Community 32 - "admin.ts"
Cohesion: 0.15
Nodes (8): ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, dynamic, POST, dynamic, POST(), dynamic, POST()

### Community 33 - "config/package.json"
Cohesion: 0.33
Nodes (5): exports, main, name, private, version

### Community 35 - "Antigravity Direktör & Claude İcracı Çalışma Kuralı"
Cohesion: 0.50
Nodes (3): 1. Temel Rol Ayrımı ve Sorumluluklar, 2. Standart İş Akışı Döngüsü, Antigravity Direktör & Claude İcracı Çalışma Kuralı

### Community 41 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, jsx, module, moduleResolution, paths, extends, ./base.json, @yildiz/types (+1 more)

### Community 42 - "app-store.ts"
Cohesion: 0.05
Nodes (56): ReviewsSectionProps, ContentContext, ContentContextType, DEFAULT_BOOKING_RULES, DEFAULT_PAGE_TEXTS, DEFAULT_SPECIAL_DAYS, SALON_INFO, createClient() (+48 more)

### Community 44 - "CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ"
Cohesion: 0.33
Nodes (5): 1. Kod Kalitesi ve Güvenlik Zemin Kuralları (Floor - Her Zaman Zorunlu), 2. Sayısal Olarak Dayatılan Kurallar (Enforced with Numbers), 3. Doğrulama Kapısı (Quality Gate Workflow), 4. İstisnalar (Exceptions), CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ

### Community 45 - "CLAUDE.md"
Cohesion: 0.50
Nodes (3): graphify, Use Graphify before grep, Şartnameye Zorunlu Bağlılık Kuralı (Mandatory Project Specification Rule)

### Community 50 - "content-management.test.ts"
Cohesion: 0.29
Nodes (6): BookingRulesSchema, CustomerReviewSchema, GalleryItemSchema, PageTextsSchema, SalonInfoSchema, SpecialDaySchema

### Community 57 - "test-data.ts"
Cohesion: 0.19
Nodes (14): INITIAL_MOCK_APPOINTMENTS, INITIAL_MOCK_PAYMENTS, MOCK_GALLERY, MOCK_REVIEWS, MOCK_SERVICES, MOCK_STAFF, MOCK_STOCK_ITEMS, MOCK_SUPPLIERS (+6 more)

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 383 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `api-guard.ts` to `admin.ts`, `admin/page.tsx`, `web/package.json`, `web/package.json`, `services/route.ts`, `middleware.test.ts`, `api/gallery/comments/route.ts`, `auth-context.tsx`, `settings/route.ts`, `Badge`, `getSupabaseAdmin`, `admin/layout.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0519774011299435 - nodes in this community are weakly interconnected._
- **Why does `ContentService` connect `app-store.ts` to `admin/page.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `Database` connect `middleware.test.ts` to `admin.ts`, `admin/page.tsx`, `services/route.ts`, `app-store.ts`, `api-guard.ts`, `settings/route.ts`, `getSupabaseAdmin`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._