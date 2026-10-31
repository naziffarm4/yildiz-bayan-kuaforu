import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RouteHandler } from "../src/lib/auth/api-guard";

const { mockAuthGetUser, mockProfileMaybeSingle, mockRpc } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn().mockResolvedValue({
    data: { user: { id: "staff-user-1" } },
    error: null,
  }),
  mockProfileMaybeSingle: vi.fn().mockResolvedValue({
    data: { rol: "Calisan" },
    error: null,
  }),
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockProfileMaybeSingle,
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  withStaffOrAdminAuth: (handler: RouteHandler) => handler,
  withAdminAuth: (handler: RouteHandler) => handler,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "services") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockImplementation((_col: string, ids: string[]) => {
              const allServices = [
                { id: "srv-kesim", ad: "Saç Kesimi", fiyat: 600 },
                { id: "srv-balyaj", ad: "Röfle / Balyaj", fiyat: 2400 },
              ];
              return Promise.resolve({
                data: allServices.filter((s) => ids.includes(s.id)),
                error: null,
              });
            }),
          }),
        };
      }
      if (table === "audit_logs") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "pay-1" }, error: null }),
          }),
        }),
      };
    }),
    rpc: mockRpc,
  })),
}));

import { POST as PaymentsPOST } from "../src/app/api/admin/payments/route";

describe("Admin POS Payments API (/api/admin/payments - Y3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "staff-user-1" } },
      error: null,
    });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { rol: "Calisan" },
      error: null,
    });
    mockRpc.mockImplementation((_fn: string, args: Record<string, unknown>) =>
      Promise.resolve({
        data: { id: args.p_id, ...args },
        error: null,
      })
    );
  });

  it("hizmet fiyatlarını, yüzde indirimi, puan indirimini ve kazanılan puanı sunucuda hesaplar", async () => {
    // srv-kesim (600) + srv-balyaj (2400) = 3000 TL
    // %10 indirim = 300 TL
    // 200 puan harcama = 100 TL indirim (100p = 50 TL)
    // Net ödenen = 3000 - 300 - 100 = 2600 TL
    // Kazanılan puan = floor(2600 / 10) = 260 puan
    const req = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hizmet_idleri: ["srv-kesim", "srv-balyaj"],
        indirim_tipi: "PERCENT",
        indirim_degeri: 10,
        kullanilan_puan_adedi: 200,
        bahsis_tutari: 150,
        odeme_yontemi: "Kart",
        musteri_id: "cust-uuid-1",
        islemi_yapan_calisan_id: "staff-uuid-1",
        randevu_id: "appt-uuid-1",
      }),
    });

    const res = await PaymentsPOST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.toplam_tutar).toBe(3000);
    expect(json.data.indirim_tutari).toBe(300);
    expect(json.data.kullanilan_puan_indirimi).toBe(100);
    expect(json.data.odenen_tutar).toBe(2600);
    expect(json.data.kazanilan_puan).toBe(260);

    expect(mockRpc).toHaveBeenCalledWith(
      "record_payment_transaction",
      expect.objectContaining({
        p_toplam_tutar: 3000,
        p_indirim_tutari: 300,
        p_kullanilan_puan: 200,
        p_odenen_tutar: 2600,
        p_kazanilan_puan: 260,
        p_veresiye: false,
      })
    );
  });

  it("veresiye ödemede kazanılan puanı 0 olarak hesaplar (Şartname Madde 4)", async () => {
    const req = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hizmet_idleri: ["srv-kesim"],
        odeme_yontemi: "Veresiye",
        musteri_id: "cust-uuid-2",
      }),
    });

    const res = await PaymentsPOST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.toplam_tutar).toBe(600);
    expect(json.data.odenen_tutar).toBe(600);
    expect(json.data.kazanilan_puan).toBe(0);
    expect(mockRpc).toHaveBeenCalledWith(
      "record_payment_transaction",
      expect.objectContaining({
        p_veresiye: true,
        p_kazanilan_puan: 0,
      })
    );
  });

  it("yetersiz sadakat puanı durumunda RPC hatasını 400 olarak döndürür", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Yetersiz sadakat puanı bakiyesi." },
    });

    const req = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hizmet_idleri: ["srv-kesim"],
        kullanilan_puan_adedi: 500,
        odeme_yontemi: "Nakit",
        musteri_id: "cust-uuid-3",
      }),
    });

    const res = await PaymentsPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Yetersiz sadakat puanı");
  });

  it("gerçek withStaffOrAdminAuth altında oturumsuz (401) ve Musteri (403) erişimini reddeder", async () => {
    const { withStaffOrAdminAuth: realGuard } = await vi.importActual<
      typeof import("../src/lib/auth/api-guard")
    >("../src/lib/auth/api-guard");

    const guardedPost = realGuard(PaymentsPOST);

    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const unauthReq = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hizmet_idleri: ["srv-kesim"] }),
    });
    const unauthRes = await guardedPost(unauthReq);
    expect(unauthRes.status).toBe(401);

    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: { id: "customer-user-1" } },
      error: null,
    });
    mockProfileMaybeSingle.mockResolvedValueOnce({
      data: { rol: "Musteri" },
      error: null,
    });

    const forbiddenReq = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hizmet_idleri: ["srv-kesim"] }),
    });
    const forbiddenRes = await guardedPost(forbiddenReq);
    expect(forbiddenRes.status).toBe(403);
  });
});
