import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOr = vi.fn();
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
    mockOr.mockReset();
    mockLimit.mockReset();
    mockFrom.mockReset();

    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockOr.mockReturnValue({ limit: mockLimit, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ or: mockOr, single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
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

  it("geçerli verilerle randevuyu başarıyla oluşturur ve 201 döner", async () => {
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
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("app-uuid-1");
    expect(json.data.durum).toBe("Beklemede");
    expect(json.data.calisan_idleri).toEqual([]);
  });

  it("profil oluşturulurken hata çıksa bile randevuyu musteri_id = null olarak başarıyla kaydeder", async () => {
    // profiles select boş dönsün (mevcut profil yok)
    // profiles insert hata versin
    let appointmentInsertPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
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
          insert: vi.fn().mockImplementation((payload) => {
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
