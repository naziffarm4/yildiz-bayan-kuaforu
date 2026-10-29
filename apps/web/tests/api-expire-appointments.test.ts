import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase, updatedIds } = vi.hoisted(() => {
  const ids: string[] = [];
  const pendingRows = [
    {
      id: "app-expired-1",
      durum: "Beklemede",
      olusturulma_tarihi: "2026-10-28T09:00:00+03:00",
    },
    {
      id: "app-fresh-1",
      durum: "Beklemede",
      olusturulma_tarihi: new Date().toISOString(),
    },
  ];

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "site_settings") {
        return {
          select: () => ({
            limit: () => ({
              maybeSingle: async () => ({
                data: {
                  blokaj_sure_dakika: 30,
                  tampon_sure_dakika: 15,
                  calisma_saatleri: {
                    haftaIci: "09:00 - 20:00",
                    cumartesi: "09:00 - 20:30",
                    pazar: "Kapalı",
                  },
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "appointments") {
        return {
          select: () => ({
            eq: async () => ({
              data: pendingRows,
              error: null,
            }),
          }),
          update: () => ({
            in: async (_col: string, targetIds: string[]) => {
              ids.push(...targetIds);
              return { error: null };
            },
          }),
        };
      }

      return {};
    }),
  };

  return { mockSupabase: supabase, updatedIds: ids };
});

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => mockSupabase,
}));

import { GET } from "../src/app/api/cron/expire-appointments/route";

describe("Expire Pending Appointments Cron Route (/api/cron/expire-appointments)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    updatedIds.length = 0;
  });

  it("CRON_SECRET tanımlı değilse veya çok kısaysa 500 hatası döner", async () => {
    const orig = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const req = new Request("http://localhost/api/cron/expire-appointments", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);

    if (orig) process.env.CRON_SECRET = orig;
  });

  it("Authorization Bearer başlığı geçersizse 401 döner", async () => {
    process.env.CRON_SECRET = "secure-cron-secret-2026-min-16-chars";

    const req = new Request("http://localhost/api/cron/expire-appointments");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("Geçerli CRON_SECRET ile çalışma saatlerine göre süresi dolan Beklemede randevuları 'Süresi Doldu' yapar", async () => {
    process.env.CRON_SECRET = "secure-cron-secret-2026-min-16-chars";

    const req = new Request(
      "http://localhost/api/cron/expire-appointments?now=2026-10-28T10:00:00%2B03:00",
      {
        headers: { Authorization: "Bearer secure-cron-secret-2026-min-16-chars" },
      }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.expiredCount).toBe(1);
    expect(json.expiredIds).toEqual(["app-expired-1"]);
    expect(updatedIds).toEqual(["app-expired-1"]);
  });
});
