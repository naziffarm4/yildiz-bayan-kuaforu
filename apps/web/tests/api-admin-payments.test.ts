import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RouteHandler } from "../src/lib/auth/api-guard";

const { mockAuthGetUser, mockProfileMaybeSingle, mockRpc, mockAuthCtx } =
  vi.hoisted(() => ({
    mockAuthGetUser: vi.fn().mockResolvedValue({
      data: { user: { id: "staff-user-1" } },
      error: null,
    }),
    mockProfileMaybeSingle: vi.fn().mockResolvedValue({
      data: { rol: "Calisan" },
      error: null,
    }),
    mockRpc: vi.fn(),
    mockAuthCtx: {
      userId: "staff-user-1",
      role: "Calisan" as "Admin" | "Calisan",
      ipAddress: "127.0.0.1",
    },
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
  getRequestAuthContext: () => mockAuthCtx,
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
      if (table === "appointments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "appt-uuid-1",
                  musteri_id: "cust-uuid-1",
                  durum: "Onaylandı",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [{ id: "pay-1", odenen_tutar: 600 }],
                error: null,
              }),
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

import {
  GET as PaymentsGET,
  POST as PaymentsPOST,
  PATCH as PaymentsPATCH,
} from "../src/app/api/admin/payments/route";

describe("Admin POS Payments API (/api/admin/payments - Y3 & Bölüm 2.1/4.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "staff-user-1";
    mockAuthCtx.role = "Calisan";
    mockAuthCtx.ipAddress = "127.0.0.1";
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
        data: { id: args.p_id ?? args.p_payment_id, ...args },
        error: null,
      })
    );
  });

  it("hizmet fiyatlarını, yüzde indirimi, puan indirimini ve kazanılan puanı sunucuda hesaplar; Calisan rolü başka çalışan ID'si gönderse bile kendi userId'sini atar", async () => {
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
        islemi_yapan_calisan_id: "spoofed-other-staff-id",
        randevu_id: "appt-uuid-1",
      }),
    });

    const res = await PaymentsPOST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.islemi_yapan_calisan_id).toBe("staff-user-1");
    expect(json.data.toplam_tutar).toBe(3000);
    expect(json.data.indirim_tutari).toBe(300);
    expect(json.data.kullanilan_puan_indirimi).toBe(100);
    expect(json.data.odenen_tutar).toBe(2600);
    expect(json.data.kazanilan_puan).toBe(260);

    expect(mockRpc).toHaveBeenCalledWith(
      "record_payment_transaction",
      expect.objectContaining({
        p_islemi_yapan_calisan_id: "staff-user-1",
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

  it("mükerrer randevu ödemesinde RPC 23505 hatasını 409 Conflict olarak döndürür", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "23505",
        message: "Bu randevu için ödeme zaten alınmış.",
      },
    });

    const req = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hizmet_idleri: ["srv-kesim"],
        randevu_id: "appt-uuid-1",
      }),
    });

    const res = await PaymentsPOST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("zaten alınmış");
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

  it("GET sayfalı ödeme listesini döner", async () => {
    const req = new Request(
      "http://localhost/api/admin/payments?limit=25&offset=0"
    );
    const res = await PaymentsGET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.pagination.limit).toBe(25);
  });

  it("PATCH settle_veresiye işlemini Calisan ve Admin için çalıştırır; refund işlemini Calisan için 403 ile reddedip Admin için çalıştırır", async () => {
    const settleReq = new Request("http://localhost/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "pay-veresiye-1",
        action: "settle_veresiye",
        odeme_yontemi: "Nakit",
      }),
    });
    const settleRes = await PaymentsPATCH(settleReq);
    expect(settleRes.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("settle_or_refund_payment", {
      p_payment_id: "pay-veresiye-1",
      p_action: "settle_veresiye",
      p_odeme_yontemi: "Nakit",
    });

    // Calisan iade yapamaz
    const staffRefundReq = new Request("http://localhost/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "pay-1",
        action: "refund",
      }),
    });
    const staffRefundRes = await PaymentsPATCH(staffRefundReq);
    expect(staffRefundRes.status).toBe(403);

    // Admin iade yapabilir
    mockAuthCtx.role = "Admin";
    mockAuthCtx.userId = "admin-user-1";
    const adminRefundReq = new Request("http://localhost/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "pay-1",
        action: "refund",
      }),
    });
    const adminRefundRes = await PaymentsPATCH(adminRefundReq);
    expect(adminRefundRes.status).toBe(200);
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
