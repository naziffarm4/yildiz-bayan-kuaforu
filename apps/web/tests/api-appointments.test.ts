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
import { getSupabaseAdmin } from "@/lib/supabase/admin";

describe("Public Appointments API Route (/api/appointments)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle.mockReset();
    mockMaybeSingle.mockReset();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockIn.mockReset();
    mockLimit.mockReset();
    mockFrom.mockReset();

    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockIn.mockReturnValue({ limit: mockLimit, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ in: mockIn, single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: mockIn.mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "p-uuid-1", ad: "Ayşe", soyad: "Yılmaz" },
                  error: null,
                }),
              }),
            }),
          }),
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
      if (table === "appointments") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "app-uuid-1",
                  musteri_id: "p-uuid-1",
                  musteri_ad_soyad: "Ayşe Yılmaz",
                  musteri_telefon: "+905321234567",
                  hizmet_idleri: ["srv-1"],
                  calisan_idleri: [],
                  tarih_saat: "2026-10-30T10:00:00.000Z",
                  toplam_sure_dakika: 60,
                  durum: "Beklemede",
                  kaynak: "Web",
                  notlar: null,
                  olusturulma_tarihi: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
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

  it("geçerli verilerle .in('telefon', candidates) kullanarak randevuyu oluşturur ve 201 döner", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-10-30T10:00:00.000Z",
        toplam_sure_dakika: 60,
        notlar: "Özel fön isteği",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockIn).toHaveBeenCalledWith("telefon", expect.any(Array));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("app-uuid-1");
    expect(json.data.durum).toBe("Beklemede");
    expect(json.data.calisan_idleri).toEqual([]);
  });

  it("yeni misafir profili oluşturulurken sms_dogrulandi: false olarak kaydeder (S6)", async () => {
    let profileInsertPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
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
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
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
