# Graph Report - yildiz-bayan-kuaforu  (2026-10-25)

## Corpus Check
- 156 files · ~76,447 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 810 nodes · 1868 edges · 50 communities (32 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- site-settings-manager.tsx
- types/src/index.ts
- Badge
- compilerOptions
- ContentService
- ui/package.json
- compilerOptions
- web/package.json
- postcss@^8.4.38
- settings/route.ts
- web/package.json
- devDependencies
- types/package.json
- tailwind-merge@^2.3.0
- AppointmentService
- tasks
- eslint-config-prettier@^9.1.0
- package.json
- settings/route.ts
- web/tsconfig.json
- YILDIZ BAYAN KUAFÖRÜ - Proje Gereksinimleri (Final)
- test-supabase.mjs
- Badge
- api-admin-crud.test.ts
- prettier/.prettierrc.json
- types/tsconfig.json
- .prettierrc.json
- scripts
- @types/react-dom@^18.3.0
- ui/tsconfig.json
- ref_vitest
- @typescript-eslint/eslint-plugin@^7.18.0
- config/package.json
- Antigravity Direktör & Claude İcracı Çalışma Kuralı
- next.config.mjs
- tailwind.config.ts
- compilerOptions
- AGENTS.md
- CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ
- CLAUDE.md
- content-management.test.ts
- YILDIZ BAYAN KUAFÖRÜ - Notlar / Değişiklik Talepleri
- pnpm-workspace.yaml
- @yildiz/config@workspace:*
- business-rules.test.ts

## God Nodes (most connected - your core abstractions)
1. `Badge()` - 59 edges
2. `Button()` - 55 edges
3. `getSupabaseAdmin()` - 42 edges
4. `next` - 38 edges
5. `useContent()` - 33 edges
6. `Card()` - 33 edges
7. `AdminPage()` - 26 edges
8. `generateSafeUUID()` - 26 edges
9. `ContentService` - 22 edges
10. `Database` - 22 edges

## Surprising Connections (you probably didn't know these)
- `ServiceCatalogProps` --references--> `ServiceItem`  [EXTRACTED]
  apps/web/src/components/ServiceCatalog.tsx → packages/types/src/index.ts
- `DegerlendirContent()` --calls--> `Badge()`  [EXTRACTED]
  apps/web/src/app/degerlendir/page.tsx → packages/ui/src/components/badge.tsx
- `DegerlendirContent()` --calls--> `Button()`  [EXTRACTED]
  apps/web/src/app/degerlendir/page.tsx → packages/ui/src/components/button.tsx
- `DegerlendirContent()` --calls--> `Card()`  [EXTRACTED]
  apps/web/src/app/degerlendir/page.tsx → packages/ui/src/components/card.tsx
- `GalleryPage()` --calls--> `Badge()`  [EXTRACTED]
  apps/web/src/app/galeri/page.tsx → packages/ui/src/components/badge.tsx

## Import Cycles
- None detected.

## Communities (50 total, 18 thin omitted)

### Community 0 - "site-settings-manager.tsx"
Cohesion: 0.53
Nodes (6): ContentContextType, BookingRules, PageTexts, SalonInfo, SpecialDay, SiteSettingsManagerProps

### Community 1 - "types/src/index.ts"
Cohesion: 0.06
Nodes (33): RFC-4122, AboutTexts, AboutTextsSchema, AppointmentSource, AppointmentSourceSchema, ArtistSectionTexts, ArtistSectionTextsSchema, ArtistVipFeature (+25 more)

### Community 2 - "Badge"
Cohesion: 0.08
Nodes (56): AdminPage(), LoginPage(), AdminDrawer(), AdminDrawerProps, AdminFixedFooter(), AdminFixedFooterProps, AdminSidebar(), AdminSidebarProps (+48 more)

### Community 3 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, incremental, jsx, module, moduleResolution, noEmit, paths (+5 more)

### Community 4 - "ContentService"
Cohesion: 0.06
Nodes (37): metadata, RootLayout(), ReviewsSectionProps, AuthProvider(), ContentProvider(), loadLiveContent(), getSupabaseClient(), ContentService (+29 more)

### Community 5 - "ui/package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, tailwind-merge@^2.3.0, @yildiz/types@workspace:*, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, eslint-plugin-react@^7.34.2 (+42 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "web/package.json"
Cohesion: 0.12
Nodes (17): dependencies, next@^14.2.5, react@^18.3.1, react-dom@^18.3.1, @supabase/ssr@^0.12.7, @supabase/supabase-js@^2.118.0, @yildiz/types@workspace:*, @yildiz/ui@workspace:* (+9 more)

### Community 9 - "settings/route.ts"
Cohesion: 0.73
Nodes (4): GET(), getSupabaseAdmin(), POST(), PUT()

### Community 10 - "web/package.json"
Cohesion: 0.20
Nodes (9): clsx@^2.1.1, tailwindcss@^3.4.4, @typescript-eslint/parser@^7.18.0, clsx, tailwindcss, @typescript-eslint/parser, name, private (+1 more)

### Community 11 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer@^10.4.19, eslint@^8.57.0, eslint-config-next@^14.2.5, @types/node@^20.14.0, @types/react@^18.3.3, typescript@^5.4.5, vitest@^1.6.0 (+7 more)

### Community 12 - "types/package.json"
Cohesion: 0.09
Nodes (29): dependencies, zod@^3.23.8, devDependencies, eslint@^8.57.0, eslint-config-prettier@^9.1.0, @supabase/supabase-js@^2.118.0, typescript@^5.4.5, @typescript-eslint/eslint-plugin@^7.18.0 (+21 more)

### Community 14 - "AppointmentService"
Cohesion: 0.05
Nodes (20): loadLiveAdminData(), AppointmentInsert, AppointmentRow, AppointmentService, AppointmentUpdate, InventoryInsert, InventoryRow, InventoryService (+12 more)

### Community 15 - "tasks"
Cohesion: 0.17
Nodes (11): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+3 more)

### Community 17 - "package.json"
Cohesion: 0.10
Nodes (23): devDependencies, eslint@^8.57.0, prettier@^3.3.2, turbo@^2.0.4, typescript@^5.4.5, vitest@^1.6.0, eslint, typescript (+15 more)

### Community 18 - "settings/route.ts"
Cohesion: 0.18
Nodes (14): GET(), POST(), GET(), POST(), executeGoogleSync(), getSupabaseAdmin(), GooglePlacesResponse, GooglePlacesReview (+6 more)

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
Cohesion: 0.12
Nodes (35): DegerlendirContent(), DegerlendirPage(), GalleryPage(), AboutPage(), ServicesPage(), loadActiveServices(), ContactPage(), HomePage() (+27 more)

### Community 23 - "api-admin-crud.test.ts"
Cohesion: 0.09
Nodes (37): metadata, DELETE(), GET(), PATCH(), DELETE(), GET(), DELETE(), GET() (+29 more)

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

### Community 35 - "Antigravity Direktör & Claude İcracı Çalışma Kuralı"
Cohesion: 0.50
Nodes (3): 1. Temel Rol Ayrımı ve Sorumluluklar, 2. Standart İş Akışı Döngüsü, Antigravity Direktör & Claude İcracı Çalışma Kuralı

### Community 41 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, jsx, module, moduleResolution, paths, extends, ./base.json, @yildiz/types (+1 more)

### Community 44 - "CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ"
Cohesion: 0.33
Nodes (5): 1. Kod Kalitesi ve Güvenlik Zemin Kuralları (Floor - Her Zaman Zorunlu), 2. Sayısal Olarak Dayatılan Kurallar (Enforced with Numbers), 3. Doğrulama Kapısı (Quality Gate Workflow), 4. İstisnalar (Exceptions), CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ

### Community 46 - "content-management.test.ts"
Cohesion: 0.13
Nodes (22): DEFAULT_BOOKING_RULES, DEFAULT_PAGE_TEXTS, DEFAULT_SPECIAL_DAYS, INITIAL_MOCK_PAYMENTS, MOCK_GALLERY, MOCK_REVIEWS, MOCK_SERVICES, MOCK_STAFF (+14 more)

### Community 52 - "business-rules.test.ts"
Cohesion: 0.22
Nodes (8): AppointmentStatusSchema, BookingWizardFormSchema, calculateAppointmentTotalDuration(), calculateLoyaltyDiscount(), calculateLoyaltyPoints(), calculatePackageRefund(), CustomerReviewSchema, UserRoleSchema

## Knowledge Gaps
- **6 isolated node(s):** `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json`, `RFC-4122`, `@yildiz/config/tsconfig/base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 318 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `api-admin-crud.test.ts` to `Badge`, `ContentService`, `web/package.json`, `settings/route.ts`, `web/package.json`, `settings/route.ts`, `Badge`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `@yildiz/config/tsconfig/nextjs.json`, `./base.json`, `./base.json` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `ContentService` connect `ContentService` to `Badge`, `AppointmentService`, `Badge`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `Badge` be split into smaller, more focused modules?**
  _Cohesion score 0.07973124300111982 - nodes in this community are weakly interconnected._
- **Why does `ServiceService` connect `Badge` to `Badge`, `AppointmentService`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._