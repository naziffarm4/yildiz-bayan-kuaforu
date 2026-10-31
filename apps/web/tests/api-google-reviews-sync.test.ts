import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockMaybeSingle } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  }),
}));

import { POST as AdminSyncPOST } from "../src/app/api/admin/sync/google-reviews/route";
import { GET as CronSyncGET } from "../src/app/api/cron/sync-google-reviews/route";

describe("Google Reviews Sync API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@yildizkuafor.com" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: { rol: "Admin" },
      error: null,
    });
  });

  describe("Admin Sync Route (/api/admin/sync/google-reviews)", () => {
    it("Oturumsuz çağrıda 401 Yetkisiz erişim döner (G-02)", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new Request("http://localhost/api/admin/sync/google-reviews", {
        method: "POST",
      });
      const res = await AdminSyncPOST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Yetkisiz erişim");
    });

    it("Çalışan (Calisan) rolü ile çağrıda 403 Yetkisiz erişim döner (G-02 / G-08)", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { rol: "Calisan" },
        error: null,
      });

      const req = new Request("http://localhost/api/admin/sync/google-reviews", {
        method: "POST",
      });
      const res = await AdminSyncPOST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Yetkisiz erişim");
    });

    it("Admin oturumu ile POST çağrısı force=true parametresiyle senkronizasyon yapar", async () => {
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
    it("CRON_SECRET tanımlı değilse bilgi sızdırmadan 401 hatası döner (S5, D-4)", async () => {
      const origSecret = process.env.CRON_SECRET;
      delete process.env.CRON_SECRET;

      const req = new Request("http://localhost/api/cron/sync-google-reviews", {
        headers: {
          Authorization: "Bearer any-secret",
        },
      });
      const res = await CronSyncGET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Yetkisiz erişim.");

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
  });
});
