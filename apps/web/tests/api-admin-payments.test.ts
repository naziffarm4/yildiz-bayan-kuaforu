import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RouteHandler } from "../src/lib/auth/api-guard";

const {
  mockAuthGetUser,
  mockProfileMaybeSingle,
  mockStaffCheckMaybeSingle,
  mockPaymentLookupMaybeSingle,
  mockRpc,
  mockAuthCtx,
} = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn().mockResolvedValue({
    data: { user: { id: "staff-user-1" } },
    error: null,
  }),
  mockProfileMaybeSingle: vi.fn().mockResolvedValue({
    data: { rol: "Calisan" },
    error: null,
  }),
  mockStaffCheckMaybeSingle: vi.fn().mockResolvedValue({
    data: { id: "valid-staff-2", rol: "Calisan" },
    error: null,
  }),
  mockPaymentLookupMaybeSingle: vi.fn().mockResolvedValue({
    data: { odenen_tutar: 600 },
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
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockStaffCheckMaybeSingle,
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
                data: [
                  {
                    id: "pay-1",
                    odenen_tutar: 600,
                    gizli_not: "Müşteri hassas saç derisi notu",
                  },
                ],
                error: null,
              }),
            }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockPaymentLookupMaybeSingle,
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

describe("Admin POS Payments API (/api/admin/payments - Y3, N1, N2, N3, N-d)", () => {
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
    mockStaffCheckMaybeSingle.mockResolvedValue({
      data: { id: "valid-staff-2", rol: "Calisan" },
      error: null,
    });
    mockPaymentLookupMaybeSingle.mockResolvedValue({
      data: { odenen_tutar: 600 },
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
  });

  it("Admin geçersiz veya müşteri rolündeki bir personel ID'si gönderdiğinde 400 döner (N-d)", async () => {
    mockAuthCtx.role = "Admin";
    mockAuthCtx.userId = "admin-user-1";
    mockStaffCheckMaybeSingle.mockResolvedValueOnce({
      data: { id: "cust-1", rol: "Musteri" },
      error: null,
    });

    const req = new Request("http://localhost/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hizmet_idleri: ["srv-kesim"],
        islemi_yapan_calisan_id: "cust-1",
      }),
    });

    const res = await PaymentsPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Geçersiz personel");
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
    expect(json.data.kazanilan_puan).toBe(0);
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
  });

  it("GET Calisan rolü için gizli_not alanını maskeler, Admin için korur", async () => {
    mockAuthCtx.role = "Calisan";
    const staffRes = await PaymentsGET(
      new Request("http://localhost/api/admin/payments?limit=25&offset=0")
    );
    expect(staffRes.status).toBe(200);
    const staffJson = await staffRes.json();
    expect(staffJson.data[0].gizli_not).toBeNull();

    mockAuthCtx.role = "Admin";
    const adminRes = await PaymentsGET(
      new Request("http://localhost/api/admin/payments?limit=25&offset=0")
    );
    const adminJson = await adminRes.json();
    expect(adminJson.data[0].gizli_not).toBe("Müşteri hassas saç derisi notu");
  });

  it("PATCH settle_veresiye işleminde sunucuda hesaplanan p_earned_points değerini geçirir; refund işleminde odenen_tutar korunup iade_tutari yazılır ve ikinci iade 409 döner (N1, N2, N3)", async () => {
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
      p_actor_id: "staff-user-1",
      p_earned_points: 60,
      p_sebep: null,
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

    // Admin ilk iadeyi yapar: odenen_tutar korunur, iade_tutari ve iade_tarihi döner
    mockAuthCtx.role = "Admin";
    mockAuthCtx.userId = "admin-user-1";
    mockRpc.mockResolvedValueOnce({
      data: {
        id: "pay-1",
        odenen_tutar: 600,
        iade_tutari: 600,
        iade_tarihi: "2026-10-31T10:00:00Z",
        iade_eden_id: "admin-user-1",
      },
      error: null,
    });

    const adminRefundReq = new Request("http://localhost/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "pay-1",
        action: "refund",
        sebep: "Müşteri talebi",
      }),
    });
    const adminRefundRes = await PaymentsPATCH(adminRefundReq);
    expect(adminRefundRes.status).toBe(200);
    const refundJson = await adminRefundRes.json();
    expect(refundJson.data.odenen_tutar).toBe(600);
    expect(refundJson.data.iade_tutari).toBe(600);
    expect(refundJson.data.iade_tarihi).toBeTruthy();

    // Aynı ödemeye ikinci kez iade denendiğinde 409 Conflict döner (N1)
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "23505",
        message: "Bu ödeme zaten iade edilmiş.",
      },
    });
    const duplicateRefundReq = new Request("http://localhost/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "pay-1",
        action: "refund",
      }),
    });
    const duplicateRefundRes = await PaymentsPATCH(duplicateRefundReq);
    expect(duplicateRefundRes.status).toBe(409);
  });
});
