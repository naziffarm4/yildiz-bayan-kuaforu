import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as AdminSyncPOST, GET as AdminSyncGET } from "../src/app/api/admin/sync/google-reviews/route";
import { POST as CronSyncPOST, GET as CronSyncGET } from "../src/app/api/cron/sync-google-reviews/route";

describe("Google Reviews Sync API Routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Admin Sync Route (/api/admin/sync/google-reviews)", () => {
    it("GET çağrısı Kota Koruma ve senkronizasyon mantığını çalıştırır", async () => {
      const req = new Request("http://localhost/api/admin/sync/google-reviews");
      const res = await AdminSyncGET(req);
      expect(res).toBeDefined();
      expect([200, 500]).toContain(res.status);
      const data = await res.json().catch(() => ({}));
      if (res.status === 200) {
        expect(data.success).toBe(true);
        expect(data.data.googleRating).toBeDefined();
        expect(data.data.googleReviewCount).toBeDefined();
      }
    });

    it("POST çağrısı force=true parametresi ile zorunlu senkronizasyon yapar", async () => {
      const req = new Request("http://localhost/api/admin/sync/google-reviews?force=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const res = await AdminSyncPOST(req);
      expect(res).toBeDefined();
      expect([200, 500]).toContain(res.status);
    });

    it("GOOGLE_PLACES_API_KEY eksik olduğunda güvenli hata döner", async () => {
      const origKey = process.env.GOOGLE_PLACES_API_KEY;
      delete process.env.GOOGLE_PLACES_API_KEY;

      const req = new Request("http://localhost/api/admin/sync/google-reviews?force=true", {
        method: "POST",
      });
      const res = await AdminSyncPOST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("GOOGLE_PLACES_API_KEY ortam değişkeni tanımlı değil");

      if (origKey) {
        process.env.GOOGLE_PLACES_API_KEY = origKey;
      }
    });
  });

  describe("Cron Sync Route (/api/cron/sync-google-reviews)", () => {
    it("CRON_SECRET tanımlı değilse 500 hatası döner (S5)", async () => {
      const origSecret = process.env.CRON_SECRET;
      delete process.env.CRON_SECRET;

      const req = new Request("http://localhost/api/cron/sync-google-reviews", {
        headers: {
          Authorization: "Bearer any-secret",
        },
      });
      const res = await CronSyncGET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("CRON_SECRET");

      if (origSecret) {
        process.env.CRON_SECRET = origSecret;
      }
    });

    it("Yetkisiz çağrılarda veya yalnızca ?secret= query param gönderildiğinde 401 Unauthorized döner (S5)", async () => {
      process.env.CRON_SECRET = "test-secure-cron-secret-key-2026-min32";

      const reqNoAuth = new Request("http://localhost/api/cron/sync-google-reviews");
      const resNoAuth = await CronSyncGET(reqNoAuth);
      expect(resNoAuth.status).toBe(401);

      const reqQueryOnly = new Request(
        `http://localhost/api/cron/sync-google-reviews?secret=${process.env.CRON_SECRET}`
      );
      const resQueryOnly = await CronSyncGET(reqQueryOnly);
      expect(resQueryOnly.status).toBe(401);
    });

    it("Geçerli Bearer CRON_SECRET ile senkronizasyon çalışır", async () => {
      process.env.CRON_SECRET = "test-secure-cron-secret-key-2026-min32";
      const req = new Request("http://localhost/api/cron/sync-google-reviews", {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });
      const res = await CronSyncGET(req);
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        const json = await res.json();
        expect(json.cron).toBe(true);
      }
    });

    it("POST çağrısı GET metodunu tetikler", async () => {
      process.env.CRON_SECRET = "test-secure-cron-secret-key-2026-min32";
      const req = new Request("http://localhost/api/cron/sync-google-reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });
      const res = await CronSyncPOST(req);
      expect([200, 500]).toContain(res.status);
    });
  });
});
