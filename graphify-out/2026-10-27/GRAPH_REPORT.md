# Graph Report - yildiz-bayan-kuaforu  (2026-10-27)

## Corpus Check
- 193 files · ~93,359 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 935 nodes · 2145 edges · 61 communities (43 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Database
- types/src/index.ts
- web/package.json
- compilerOptions
- app/layout.tsx
- ui/package.json
- compilerOptions
- web/package.json
- ref_vitest
- ServiceItem
- @supabase/ssr
- devDependencies
- types/package.json
- admin/page.tsx
- AdminPage
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
- content.service.ts
- ui/tsconfig.json
- InventoryService
- auth-callback.test.ts
- config/package.json
- ServiceService
- Antigravity Direktör & Claude İcracı Çalışma Kuralı
- zustand@^5.0.3
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
- eslint@^8.57.0
- AppointmentItem
- api-appointments.test.ts
- api-guard.test.ts
- test-data.ts
- middleware.test.ts
- PaymentService
- stock-manager.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 61 edges
2. `Badge()` - 57 edges
3. `next` - 49 edges
4. `getSupabaseAdmin()` - 47 edges
5. `Card()` - 38 edges
6. `useAppStore` - 31 edges
7. `AdminPage()` - 26 edges
8. `generateSafeUUID()` - 26 edges
9. `PageLoader()` - 25 edges
10. `Database` - 23 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `AdminDashboard()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/admin-dashboard.tsx
- `AdminPage()` --calls--> `CashRegisterPOS()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/cash-register-pos.tsx
- `AdminPage()` --calls--> `GalleryManager()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/gallery-manager.tsx
- `AdminPage()` --calls--> `ReviewsManager()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/reviews-manager.tsx
- `AdminPage()` --calls--> `SiteSettingsManager()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/site-settings-manager.tsx

## Import Cycles
- None detected.

## Communities (61 total, 18 thin omitted)

### Community 0 - "Database"
Cohesion: 0.17
Nodes (7): LoyaltyLedgerInsert, PaymentInsert, PaymentRow, ServiceInsert, ServiceRow, ServiceUpdate, Database

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (37): RFC-4122, AboutTexts, AboutTextsSchema, AppointmentSource, AppointmentSourceSchema, AppointmentStatusSchema, ArtistSectionTexts, ArtistSectionTextsSchema (+29 more)

### Community 2 - "web/package.json"
Cohesion: 0.20
Nodes (9): eslint-config-next@^14.2.5, eslint-config-prettier@^9.1.0, typescript@^5.4.5, eslint-config-prettier, typescript, name, private, version (+1 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "app/layout.tsx"
Cohesion: 0.20
Nodes (10): metadata, RootLayout(), AppBootstrapper(), NavigationProgressBar(), Toaster(), ContentProvider(), useToastStore, Toast() (+2 more)

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.11
Nodes (18): dependencies, clsx@^2.1.1, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/supabase-js@^2.118.0, tailwind-merge@^2.3.0, @yildiz/types@workspace:* (+10 more)

### Community 9 - "ServiceItem"
Cohesion: 0.15
Nodes (16): AppointmentTrackerProps, ServiceCatalogProps, calculateCommission(), calculateLoyaltyDiscount(), calculateLoyaltyPoints(), CashPayment, PaymentMethod, ServiceItem (+8 more)

### Community 11 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer@^10.4.19, postcss@^8.4.38, tailwindcss@^3.4.4, @types/node@^20.14.0, @types/react@^18.3.3, @types/react-dom@^18.3.0, @typescript-eslint/parser@^7.18.0 (+9 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 13 - "admin/page.tsx"
Cohesion: 0.24
Nodes (15): AdminPage(), AdminDrawer(), AdminDrawerProps, AdminFixedFooter(), AdminFixedFooterProps, AdminSidebar(), AdminSidebarProps, AdminTab (+7 more)

### Community 14 - "AdminPage"
Cohesion: 0.18
Nodes (5): AppointmentInsert, AppointmentRow, AppointmentService, AppointmentUpdate, AppointmentStatus

### Community 15 - "tasks"
Cohesion: 0.17
Nodes (11): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+3 more)

### Community 16 - "auth-context.tsx"
Cohesion: 0.29
Nodes (8): dynamic, POST(), AuthContext, AuthContextType, AuthProvider(), fetchProfile(), getDevAuthUser(), normalizePhoneNumber()

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
Nodes (40): 10. Admin Paneli, 11. Hizmetler, 12. Renk Paleti (BeautyZone Resmi Salon Paleti), 13. Tasarım Detayları, 14. Gerçek Zamanlı Güncelleme, 15. Ek Kararlar ve Detaylar, 16. Diğer Kararlar, 17. Açık Riskler ve Dikkat Edilmesi Gerekenler (+32 more)

### Community 21 - "test-supabase.mjs"
Cohesion: 0.07
Nodes (20): __dirname, envPath, __filename, __dirname, envPath, __filename, __dirname, envPath (+12 more)

### Community 22 - "Badge"
Cohesion: 0.06
Nodes (69): metadata, DegerlendirContent(), DegerlendirPage(), GalleryPage(), LoginForm(), LoginPage(), AboutPage(), ServicesPage() (+61 more)

### Community 23 - "getSupabaseAdmin"
Cohesion: 0.08
Nodes (49): DELETE, dynamic, GET, PATCH, DELETE, dynamic, GET, DELETE (+41 more)

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

### Community 29 - "content.service.ts"
Cohesion: 0.20
Nodes (9): GalleryInsert, GalleryRow, GalleryRowWithCounts, GalleryUpdate, ReviewInsert, ReviewRow, ReviewUpdate, SiteSettingsRow (+1 more)

### Community 30 - "ui/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, extends, include, @yildiz/types, @yildiz/config/tsconfig/react-library.json

### Community 31 - "InventoryService"
Cohesion: 0.14
Nodes (7): InventoryInsert, InventoryRow, InventoryService, InventoryUpdate, SupplierInsert, SupplierRow, SupplierUpdate

### Community 32 - "auth-callback.test.ts"
Cohesion: 0.24
Nodes (8): dynamic, GET(), createClient(), mockEq, mockExchangeCodeForSession, mockFrom, mockSelect, mockSingle

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
Cohesion: 0.08
Nodes (43): ReviewsSectionProps, ContentContext, ContentContextType, DEFAULT_BOOKING_RULES, DEFAULT_PAGE_TEXTS, DEFAULT_SPECIAL_DAYS, SALON_INFO, createClient() (+35 more)

### Community 44 - "CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ"
Cohesion: 0.33
Nodes (5): 1. Kod Kalitesi ve Güvenlik Zemin Kuralları (Floor - Her Zaman Zorunlu), 2. Sayısal Olarak Dayatılan Kurallar (Enforced with Numbers), 3. Doğrulama Kapısı (Quality Gate Workflow), 4. İstisnalar (Exceptions), CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ

### Community 45 - "CLAUDE.md"
Cohesion: 0.50
Nodes (3): graphify, Use Graphify before grep, Şartnameye Zorunlu Bağlılık Kuralı (Mandatory Project Specification Rule)

### Community 50 - "content-management.test.ts"
Cohesion: 0.19
Nodes (11): INITIAL_MOCK_APPOINTMENTS, MOCK_GALLERY, MOCK_REVIEWS, AppointmentItemSchema, BookingRulesSchema, GalleryItemSchema, PageTextsSchema, SalonInfoSchema (+3 more)

### Community 53 - "AppointmentItem"
Cohesion: 0.29
Nodes (8): AuthUser, AuthState, useAuthStore, mockFrom, mockGetSession, mockSignOut, mockUpdateUser, AppointmentItem

### Community 54 - "api-appointments.test.ts"
Cohesion: 0.25
Nodes (7): mockFrom, mockInsert, mockLimit, mockMaybeSingle, mockOr, mockSelect, mockSingle

### Community 55 - "api-guard.test.ts"
Cohesion: 0.33
Nodes (5): mockEq, mockFrom, mockGetUser, mockSelect, mockSingle

### Community 57 - "test-data.ts"
Cohesion: 0.24
Nodes (8): INITIAL_MOCK_PAYMENTS, MOCK_SERVICES, MOCK_STAFF, MOCK_STOCK_ITEMS, MOCK_SUPPLIERS, CashPaymentSchema, StockItemSchema, SupplierItemSchema

### Community 58 - "middleware.test.ts"
Cohesion: 0.33
Nodes (5): mockEq, mockFrom, mockGetUser, mockSelect, mockSingle

### Community 60 - "stock-manager.tsx"
Cohesion: 0.60
Nodes (3): StockItem, SupplierItem, StockManagerProps

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 385 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Badge` to `auth-callback.test.ts`, `web/package.json`, `app/layout.tsx`, `web/package.json`, `@supabase/ssr`, `admin/page.tsx`, `auth-context.tsx`, `settings/route.ts`, `api-guard.test.ts`, `getSupabaseAdmin`, `middleware.test.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057692307692307696 - nodes in this community are weakly interconnected._
- **Why does `ContentService` connect `app-store.ts` to `Database`, `content.service.ts`, `PaymentService`, `admin/page.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `Database` connect `Database` to `auth-callback.test.ts`, `ServiceService`, `@supabase/ssr`, `app-store.ts`, `AdminPage`, `settings/route.ts`, `getSupabaseAdmin`, `content.service.ts`, `InventoryService`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `ui/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.054901960784313725 - nodes in this community are weakly interconnected._