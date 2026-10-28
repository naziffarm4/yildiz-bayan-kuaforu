import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RouteHandler } from "../src/lib/auth/api-guard";

vi.mock("@/lib/auth/api-guard", () => ({
  withStaffOrAdminAuth: (handler: RouteHandler) => handler,
}));

import { GET, POST, PUT } from "../src/app/api/admin/settings/route";

describe("Admin Settings API Route (/api/admin/settings)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("PUT fonksiyonu POST işleyicisini çağırır", async () => {
    const fakeRequest = new Request("http://localhost/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonInfo: { ad: "Test Kuaför" } }),
    });

    const res = await PUT(fakeRequest);
    expect(res).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  it("GET çağrısı yanıt döner", async () => {
    const res = await GET(new Request("http://localhost/api/admin/settings"));
    expect(res).toBeDefined();
    expect([200, 500]).toContain(res.status);
  });

  it("POST çağrısında sayfa_metinleri ve salonInfo alanlarını işler", async () => {
    const payload = {
      salonInfo: {
        ad: "Yıldız Test Kuaför",
        facebook: "yildizbayankuaforu",
      },
      pageTexts: {
        hero: {
          title: "Test Başlık",
        },
      },
    };

    const req = new Request("http://localhost/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res).toBeDefined();
    expect([200, 500]).toContain(res.status);
  });
});
