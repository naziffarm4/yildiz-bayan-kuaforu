# Graph Report - yildiz-bayan-kuaforu  (2026-10-24)

## Corpus Check
- 116 files · ~51,497 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 665 nodes · 1481 edges · 44 communities (30 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Badge
- types/src/index.ts
- Badge
- compilerOptions
- ContentService
- ui/package.json
- compilerOptions
- web/package.json
- auth-context.tsx
- InventoryService
- @typescript-eslint/eslint-plugin@^7.18.0
- devDependencies
- types/package.json
- AppointmentService
- tasks
- middleware.ts
- package.json
- content.service.ts
- web/tsconfig.json
- YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)
- ServiceService
- prettier/.prettierrc.json
- types/tsconfig.json
- .prettierrc.json
- scripts
- ui/tsconfig.json
- eslint@^8.57.0
- config/package.json
- ref_vitest
- eslint-config-next@^14.2.5
- eslint-config-prettier@^9.1.0
- next.config.mjs
- tailwind.config.ts
- compilerOptions
- inventory.service.ts
- Database
- CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ
- CLAUDE.md
- @yildiz/config@workspace:*
- YILDIZ BAYAN KUAFÖRÜ - Notlar / Değişiklik Talepleri
- pnpm-workspace.yaml

## God Nodes (most connected - your core abstractions)
1. `Badge()` - 55 edges
2. `Button()` - 53 edges
3. `AdminPage()` - 33 edges
4. `Card()` - 33 edges
5. `generateSafeUUID()` - 24 edges
6. `next` - 23 edges
7. `Navbar()` - 19 edges
8. `useContent()` - 19 edges
9. `ServiceItem` - 19 edges
10. `YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)` - 19 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `generateSafeUUID()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/types/src/index.ts
- `AdminPage()` --calls--> `AdminDashboard()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/admin-dashboard.tsx
- `AdminPage()` --calls--> `AppointmentManager()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/appointment-manager.tsx
- `AdminPage()` --calls--> `CashRegisterPOS()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/cash-register-pos.tsx
- `AdminPage()` --calls--> `GalleryManager()`  [EXTRACTED]
  apps/web/src/app/admin/page.tsx → packages/ui/src/components/gallery-manager.tsx

## Import Cycles
- None detected.

## Communities (44 total, 14 thin omitted)

### Community 0 - "Badge"
Cohesion: 0.08
Nodes (36): AppointmentTrackerProps, ServiceCatalogProps, StaffSectionProps, AppointmentItem, calculateCommission(), calculateLoyaltyDiscount(), calculateLoyaltyPoints(), CashPayment (+28 more)

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (68): ReviewsSectionProps, ContentContext, ContentContextType, StoredCMSData, DEFAULT_BOOKING_RULES, DEFAULT_PAGE_TEXTS, DEFAULT_SPECIAL_DAYS, INITIAL_MOCK_APPOINTMENTS (+60 more)

### Community 2 - "Badge"
Cohesion: 0.11
Nodes (43): metadata, GalleryPage(), LoginPage(), AboutPage(), ServicesPage(), loadActiveServices(), ContactPage(), HomePage() (+35 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "ContentService"
Cohesion: 0.23
Nodes (4): ContentProvider(), loadLiveContent(), getSupabaseClient(), ContentService

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.13
Nodes (21): dependencies, clsx@^2.1.1, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/supabase-js@^2.118.0, tailwind-merge@^2.3.0, @yildiz/types@workspace:* (+13 more)

### Community 8 - "auth-context.tsx"
Cohesion: 0.28
Nodes (6): metadata, RootLayout(), AuthContext, AuthContextType, AuthProvider(), AuthUser

### Community 9 - "InventoryService"
Cohesion: 0.20
Nodes (4): AdminPage(), loadLiveAdminData(), InventoryService, PaymentService

### Community 10 - "@typescript-eslint/eslint-plugin@^7.18.0"
Cohesion: 0.33
Nodes (4): @typescript-eslint/eslint-plugin@^7.18.0, vitest@^1.6.0, @typescript-eslint/eslint-plugin, vitest

### Community 11 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer@^10.4.19, postcss@^8.4.38, tailwindcss@^3.4.4, @types/node@^20.14.0, @types/react@^18.3.3, @types/react-dom@^18.3.0, typescript@^5.4.5 (+9 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 14 - "AppointmentService"
Cohesion: 0.18
Nodes (5): AppointmentInsert, AppointmentRow, AppointmentService, AppointmentUpdate, AppointmentStatus

### Community 15 - "tasks"
Cohesion: 0.17
Nodes (11): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+3 more)

### Community 17 - "package.json"
Cohesion: 0.10
Nodes (23): devDependencies, eslint@^8.57.0, prettier@^3.3.2, turbo@^2.0.4, typescript@^5.4.5, vitest@^1.6.0, eslint, typescript (+15 more)

### Community 18 - "content.service.ts"
Cohesion: 0.22
Nodes (8): GalleryInsert, GalleryRow, GalleryUpdate, ReviewInsert, ReviewRow, ReviewUpdate, SiteSettingsRow, SiteSettingsUpdate

### Community 19 - "web/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, paths, resolveJsonModule, exclude, extends, include, @yildiz/types, @yildiz/config/tsconfig/nextjs.json

### Community 20 - "YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)"
Cohesion: 0.05
Nodes (39): 10. Admin Paneli, 11. Hizmetler, 12. Renk Paleti, 13. Tasarım Detayları, 14. Gerçek Zamanlı Güncelleme, 15. Ek Kararlar ve Detaylar, 16. Diğer Kararlar, 17. Açık Riskler ve Dikkat Edilmesi Gerekenler (+31 more)

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

### Community 33 - "config/package.json"
Cohesion: 0.33
Nodes (5): exports, main, name, private, version

### Community 34 - "ref_vitest"
Cohesion: 0.11
Nodes (11): GET(), getSupabaseAdmin(), POST(), PUT(), ALL_TIME_SLOTS, AppointmentSource, AppointmentStatus, Json (+3 more)

### Community 41 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, jsx, module, moduleResolution, paths, extends, ./base.json, @yildiz/types (+1 more)

### Community 42 - "inventory.service.ts"
Cohesion: 0.29
Nodes (6): InventoryInsert, InventoryRow, InventoryUpdate, SupplierInsert, SupplierRow, SupplierUpdate

### Community 43 - "Database"
Cohesion: 0.17
Nodes (7): LoyaltyLedgerInsert, PaymentInsert, PaymentRow, ServiceInsert, ServiceRow, ServiceUpdate, Database

### Community 44 - "CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ"
Cohesion: 0.33
Nodes (5): 1. Kod Kalitesi ve Güvenlik Zemin Kuralları (Floor - Her Zaman Zorunlu), 2. Sayısal Olarak Dayatılan Kurallar (Enforced with Numbers), 3. Doğrulama Kapısı (Quality Gate Workflow), 4. İstisnalar (Exceptions), CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 260 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Badge` to `auth-context.tsx`, `middleware.ts`, `ref_vitest`, `web/package.json`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `AdminPage()` (e.g. with `.createAppointment()` and `.updateAppointmentStatus()`) actually correct?**
  _`AdminPage()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Badge` be split into smaller, more focused modules?**
  _Cohesion score 0.08125 - nodes in this community are weakly interconnected._
- **Why does `ContentService` connect `ContentService` to `types/src/index.ts`, `content.service.ts`, `Database`, `InventoryService`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056150600454397924 - nodes in this community are weakly interconnected._
- **Why does `AdminPage()` connect `InventoryService` to `Badge`, `types/src/index.ts`, `Badge`, `ContentService`, `AppointmentService`, `ServiceService`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._