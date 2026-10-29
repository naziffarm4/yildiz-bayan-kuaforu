import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockIn = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

import { POST } from "../src/app/api/appointments/route";
import { resetRateLimiter } from "../src/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

describe("Public Appointments API Route (/api/appointments)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();

    mockSingle.mockReset();
    mockMaybeSingle.mockReset();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockIn.mockReset();
    mockLimit.mockReset();
    mockFrom.mockReset();

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: mockSelect,
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "new-profile-uuid" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "services") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "srv-1", tahmini_sure_dakika: 45 }],
              error: null,
            }),
          }),
        };
      }
      if (table === "appointments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => ({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "app-uuid-1",
                  musteri_id: payload.musteri_id ?? "new-profile-uuid",
                  musteri_ad_soyad: payload.musteri_ad_soyad ?? "Ayşe Yılmaz",
                  musteri_telefon: payload.musteri_telefon ?? "+905321234567",
                  hizmet_idleri: payload.hizmet_idleri ?? ["srv-1"],
                  calisan_idleri: [],
                  tarih_saat: payload.tarih_saat ?? "2026-10-30T10:00:00.000Z",
                  toplam_sure_dakika: payload.toplam_sure_dakika ?? 45,
                  durum: "Beklemede",
                  kaynak: "Web",
                  notlar: payload.notlar ?? null,
                  olusturulma_tarihi: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          })),
        };
      }
      return {};
    });

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof getSupabaseAdmin>);
  });

  it("eksik müşteri adında 400 hatası döner", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Müşteri adı");
  });

  it("100 karakteri aşan müşteri adında veya 500 karakteri aşan notta 400 döner (G-06)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "A".repeat(105),
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("eksik telefon numarasında 400 hatası döner", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("telefon");
  });

  it("PostgREST filtre enjeksiyonu içeren telefon numarasını Zod ile 400 olarak reddeder (S6)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Saldırgan Kullanıcı",
        musteri_telefon: "05321234567,rol.eq.Admin",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("hizmet seçilmediğinde 400 hatası döner", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: [],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("hizmet");
  });

  it("tarih ve saat seçilmediğinde 400 hatası döner", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("tarihi");
  });

  it("veritabanı bağlantısı yoksa 500 döner", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("bağlantısı");
  });

  it("oturumsuz istekte başkasının profilini telefonla aramaz ve süreyi sunucuda hizmetlerden hesaplar (G-06)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
        toplam_sure_dakika: 999,
        notlar: "Özel fön isteği",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockSelect).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("app-uuid-1");
    expect(json.data.durum).toBe("Beklemede");
    expect(json.data.toplam_sure_dakika).toBe(45);
  });

  it("aynı Idempotency-Key ile tekrar gönderilen isteği 409 Conflict ile reddeder (G-06)", async () => {
    const makeReq = () =>
      new Request("http://localhost/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-key-123",
        },
        body: JSON.stringify({
          musteri_ad_soyad: "Ayşe Yılmaz",
          musteri_telefon: "0532 123 45 67",
          hizmet_idleri: ["srv-1"],
          tarih_saat: "2026-10-30T10:00:00.000Z",
        }),
      });

    const firstRes = await POST(makeReq());
    expect(firstRes.status).toBe(201);

    const secondRes = await POST(makeReq());
    expect(secondRes.status).toBe(409);
  });

  it("veritabanı hatasında ham error.message metnini istemciye sızdırmaz (G-06)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "secret_column_constraint_violation_xyz" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).not.toContain("secret_column_constraint_violation_xyz");
  });

  it("yeni misafir profili oluşturulurken sms_dogrulandi: false olarak kaydeder (S6)", async () => {
    let profileInsertPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
            profileInsertPayload = payload;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "new-guest-uuid" },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === "appointments") {
        return {
          insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => ({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "app-uuid-guest", ...payload },
                error: null,
              }),
            }),
          })),
        };
      }
      return {};
    });

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Misafir Kullanıcı",
        musteri_telefon: "0533 999 88 77",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(profileInsertPayload).not.toBeNull();
    if (profileInsertPayload) {
      expect(profileInsertPayload["sms_dogrulandi"]).toBe(false);
    }
  });

  it("profil oluşturulurken hata çıksa bile randevuyu musteri_id = null olarak başarıyla kaydeder", async () => {
    let appointmentInsertPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "profiles_id_fkey violation" },
              }),
            }),
          }),
        };
      }
      if (table === "appointments") {
        return {
          insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
            appointmentInsertPayload = payload;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "app-uuid-guest",
                    ...payload,
                  },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Misafir Müşteri",
        musteri_telefon: "0533 999 88 77",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(appointmentInsertPayload).not.toBeNull();
    if (appointmentInsertPayload) {
      expect(appointmentInsertPayload["musteri_id"]).toBeNull();
    }
  });
});
