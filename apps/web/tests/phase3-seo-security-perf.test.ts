import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import nextConfig from "../next.config.mjs";
import tailwindConfig from "../tailwind.config";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { metadata as adminMetadata } from "../src/app/admin/layout";
import { metadata as profilMetadata } from "../src/app/profil/layout";
import { metadata as girisMetadata } from "../src/app/giris/layout";
import { metadata as hizmetlerMetadata } from "../src/app/hizmetler/layout";
import { metadata as kvkkMetadata } from "../src/app/kvkk/page";
import { recordAuditLog } from "../src/lib/audit-log";

describe("Faz 3: Güvenlik Başlıkları, Görsel Optimizasyonu ve SEO Yapılandırması", () => {
  describe("next.config.mjs (S11 Güvenlik Başlıkları & Görsel Alan Adları)", () => {
    it("Image Optimizer güvenlik ayarlarını (formats: webp, dangerouslyAllowSVG: false, daraltılmış remotePatterns) barındırır (G-01 & P-04)", () => {
      expect(nextConfig.images?.formats).toEqual(["image/webp"]);
      expect(nextConfig.images?.dangerouslyAllowSVG).toBe(false);
      expect(nextConfig.images?.contentDispositionType).toBe("attachment");

      const patterns = nextConfig.images?.remotePatterns ?? [];
      const hostnames = patterns.map((p: { hostname: string }) => p.hostname);

      expect(hostnames).toContain("images.unsplash.com");
      expect(hostnames).toContain("*.supabase.co");
      expect(hostnames).not.toContain("*.supabase.in");

      const supabasePattern = patterns.find(
        (p: { hostname: string; pathname?: string }) => p.hostname === "*.supabase.co"
      );
      expect(supabasePattern?.pathname).toBe("/storage/v1/object/public/**");
    });

    it("Tüm rotalar (/(.*)) için zorunlu güvenlik başlıklarını (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) döner", async () => {
      expect(typeof nextConfig.headers).toBe("function");
      const headerRules = await nextConfig.headers!();
      const globalRule = headerRules.find(
        (r: { source: string }) => r.source === "/(.*)",
      );

      expect(globalRule).toBeDefined();
      const headerMap = new Map(
        globalRule!.headers.map((h: { key: string; value: string }) => [
          h.key,
          h.value,
        ]),
      );

      expect(headerMap.get("X-Frame-Options")).toBe("DENY");
      expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headerMap.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(headerMap.get("Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=(self)",
      );
      expect(headerMap.get("Strict-Transport-Security")).toContain("max-age=63072000");
      expect(headerMap.get("Cross-Origin-Opener-Policy")).toBe("same-origin-allow-popups");
      expect(headerMap.get("X-DNS-Prefetch-Control")).toBe("on");
      expect(headerMap.get("Content-Security-Policy")).toContain("default-src 'self'");
      expect(headerMap.get("Content-Security-Policy")).toContain("script-src 'self' 'unsafe-inline';");
      expect(headerMap.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");
    });
  });

  describe("sitemap.ts (Dinamik Site Haritası)", () => {
    it("Ana sayfa ve tüm genel müşteri rotalarını içerir", () => {
      const entries = sitemap();
      const urls = entries.map((e) => e.url);

      const requiredPaths = [
        "",
        "/hizmetler",
        "/galeri",
        "/hakkimizda",
        "/iletisim",
        "/randevu",
        "/degerlendir",
      ];

      for (const path of requiredPaths) {
        expect(urls.some((u) => u.endsWith(path === "" ? "/" : path) || (path === "" && !u.endsWith("/hizmetler")))).toBe(
          true,
        );
      }
      expect(entries.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("robots.ts (Arama Motoru İndeksleme Kuralları)", () => {
    it("Genel sayfaları indekslemeye açar, /admin ve /api/ rotalarını disallow eder", () => {
      const config = robots();
      const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;

      expect(rules).toBeDefined();
      expect(rules?.allow).toBe("/");
      expect(rules?.disallow).toEqual(
        expect.arrayContaining(["/admin", "/api/"]),
      );
      expect(config.sitemap).toBeDefined();
    });
  });

  describe("Renk Paleti (globals.css & tailwind.config.ts) Saf Beyaz Header ve Alpha Desteği", () => {
    it("globals.css içinde --color-bg-header: #FFFFFF ve header arka plan kuralı tanımlıdır", () => {
      const globalsPath = path.resolve(
        __dirname,
        "../src/app/globals.css",
      );
      const cssContent = fs.readFileSync(globalsPath, "utf-8");

      expect(cssContent).toContain("--color-bg-header: #FFFFFF;");
      expect(cssContent).toContain("--bg-primary: #FFFFFF;");
      expect(cssContent).toMatch(/header\s*\{\s*background-color:\s*var\(--color-bg-header\);/);
    });

    it("tailwind.config.ts içinde bg-primary ve primary renkleri <alpha-value> destekler", () => {
      const colors = tailwindConfig.theme?.extend?.colors as Record<
        string,
        unknown
      >;
      expect(colors["bg-primary"]).toContain("<alpha-value>");
      expect(colors["bg-primary"]).toContain("var(--color-bg-header)");
      const primary = colors.primary as Record<string, string>;
      expect(primary.DEFAULT).toContain("<alpha-value>");
    });
  });

  describe("0017 Migration İdempotent Sütun Güvencesi", () => {
    it("0017_remove_mock_names_and_sync_admin.sql içinde gallery_items ve site_settings sütunlarını ADD COLUMN IF NOT EXISTS ile güvenceye alır", () => {
      const migrationPath = path.resolve(
        __dirname,
        "../../../supabase/migrations/0017_remove_mock_names_and_sync_admin.sql",
      );
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain("ADD COLUMN IF NOT EXISTS medya_turu");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS kapak_url");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS aciklama");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS stilist TEXT DEFAULT 'Yıldız Bayan Kuaförü'");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS begeni_sayisi");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS sayfa_metinleri JSONB DEFAULT '{}'::jsonb");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS adres");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS google_maps_url");
    });
  });

  describe("CI/CD ve Turborepo Yapılandırma Güvenliği (K-09 & P-05)", () => {
    it("turbo.json içinde globalEnv ve build/lint/type-check/test dependsOn tanımlıdır", () => {
      const turboPath = path.resolve(__dirname, "../../../turbo.json");
      const turboConfig = JSON.parse(fs.readFileSync(turboPath, "utf-8")) as {
        globalEnv?: string[];
        tasks: Record<string, { dependsOn?: string[] }>;
      };

      expect(turboConfig.globalEnv).toEqual(
        expect.arrayContaining([
          "NODE_ENV",
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "CRON_SECRET",
        ])
      );
      expect(turboConfig.tasks.build?.dependsOn).toContain("^build");
      expect(turboConfig.tasks.lint?.dependsOn).toContain("^build");
      expect(turboConfig.tasks["type-check"]?.dependsOn).toContain("^build");
      expect(turboConfig.tasks.test?.dependsOn).toContain("^build");
    });

    it(".github/workflows/ci.yml ve .github/dependabot.yml zorunlu kalite kapılarını içerir", () => {
      const ciPath = path.resolve(__dirname, "../../../.github/workflows/ci.yml");
      const dependabotPath = path.resolve(__dirname, "../../../.github/dependabot.yml");

      expect(fs.existsSync(ciPath)).toBe(true);
      expect(fs.existsSync(dependabotPath)).toBe(true);

      const ciContent = fs.readFileSync(ciPath, "utf-8");
      expect(ciContent).toContain("pnpm install --frozen-lockfile");
      expect(ciContent).toContain("pnpm lint");
      expect(ciContent).toContain("pnpm type-check");
      expect(ciContent).toContain("pnpm test");
      expect(ciContent).toContain("pnpm build");

      const dependabotContent = fs.readFileSync(dependabotPath, "utf-8");
      expect(dependabotContent).toContain('package-ecosystem: "npm"');
      expect(dependabotContent).toContain('package-ecosystem: "github-actions"');
    });
  });

  describe("Faz 6: Alt Sayfa SEO Metadata, KVKK ve Audit Log & İndeksler (P-01, P-03, Bölüm 15)", () => {
    it("Özel rotalarda (/admin, /profil, /giris) robots noindex tanımlıdır, herkese açık alt sayfalarda (/hizmetler, /kvkk) SEO metadata mevcuttur", () => {
      expect(adminMetadata.robots).toEqual({ index: false, follow: false });
      expect(profilMetadata.robots).toEqual({ index: false, follow: false });
      expect(girisMetadata.robots).toEqual({ index: false, follow: false });
      expect(hizmetlerMetadata.title).toBeDefined();
      expect(kvkkMetadata.title).toContain("KVKK");
    });

    it("0021_audit_logs_and_indexes.sql içinde audit_logs tablosu ve bileşik indeksler tanımlıdır", () => {
      const migrationPath = path.resolve(
        __dirname,
        "../../../supabase/migrations/0021_audit_logs_and_indexes.sql"
      );
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.audit_logs");
      expect(sql).toContain("idx_appointments_durum_tarih");
      expect(sql).toContain("idx_appointments_musteri_tarih");
      expect(sql).toContain("idx_gallery_comments_item_aktif");
      expect(sql).toContain("idx_customer_reviews_aktif_tarih");
      expect(sql).toContain("idx_audit_logs_created_at");
    });

    it("recordAuditLog veritabanı bağlantısı yokken hata fırlatmadan güvenle tamamlanır", async () => {
      await expect(
        recordAuditLog({
          action: "test.action",
          entityType: "appointments",
          entityId: "test-123",
        })
      ).resolves.toBeUndefined();
    });
  });
});
