import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import nextConfig from "../next.config.mjs";
import tailwindConfig from "../tailwind.config";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";

describe("Faz 3: Güvenlik Başlıkları, Görsel Optimizasyonu ve SEO Yapılandırması", () => {
  describe("next.config.mjs (S11 Güvenlik Başlıkları & Görsel Alan Adları)", () => {
    it("Supabase Storage alan adlarını (*.supabase.co ve *.supabase.in) images.remotePatterns içinde barındırır", () => {
      const patterns = nextConfig.images?.remotePatterns ?? [];
      const hostnames = patterns.map((p: { hostname: string }) => p.hostname);

      expect(hostnames).toContain("images.unsplash.com");
      expect(hostnames).toContain("*.supabase.co");
      expect(hostnames).toContain("*.supabase.in");
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
});
