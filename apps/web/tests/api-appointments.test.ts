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
  const buildMockFrom = (overrides?: (table: string) => Record<string, unknown> | null) => {
    return (table: string) => {
      const custom = overrides ? overrides(table) : null;
      if (custom) return custom;

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
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  calisma_saatleri: {
                    hafta_ici: "09:00 - 20:00",
                    cumartesi: "09:00 - 20:30",
                    pazar: "10:00 - 18:00 (Özel Randevulu)",
                  },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "services") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockImplementation((_col: string, ids: string[]) => ({
              eq: vi.fn().mockImplementation((_eqCol: string, eqVal: boolean) => {
                const dbServices = [
                  { id: "srv-1", tahmini_sure_dakika: 45, aktif: true },
                  { id: "srv-2", tahmini_sure_dakika: 30, aktif: true },
                  { id: "srv-pasif", tahmini_sure_dakika: 60, aktif: false },
                ];
                const matched = dbServices.filter(
                  (s) => ids.includes(s.id) && s.aktif === eqVal
                );
                return Promise.resolve({ data: matched, error: null });
              }),
            })),
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
                  tarih_saat: payload.tarih_saat ?? "2026-11-15T10:00:00.000Z",
                  toplam_sure_dakika: payload.toplam_sure_dakika ?? 45,
                  durum: "Beklemede",
                  kaynak: "Web",
                  notlar: payload.notlar ?? null,
                  kvkk_onay_tarihi: payload.kvkk_onay_tarihi ?? new Date().toISOString(),
                  olusturulma_tarihi: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          })),
        };
      }
      return {};
    };
  };

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

    mockFrom.mockImplementation(buildMockFrom());

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
        tarih_saat: "2026-11-16T10:00:00.000Z",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Müşteri adı");
  });

  it("80 karakteri aşan müşteri adında veya 500 karakteri aşan notta 400 döner (D1, G-06)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "A".repeat(85),
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
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
        tarih_saat: "2026-11-16T10:00:00.000Z",
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
        tarih_saat: "2026-11-16T10:00:00.000Z",
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
        tarih_saat: "2026-11-16T10:00:00.000Z",
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
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkkOnay: true,
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
        tarih_saat: "2026-11-16T10:00:00.000Z",
        toplam_sure_dakika: 999,
        notlar: "Özel fön isteği",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
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
          tarih_saat: "2026-11-16T10:00:00.000Z",
          kvkkOnay: true,
        }),
      });

    const firstRes = await POST(makeReq());
    expect(firstRes.status).toBe(201);

    const secondRes = await POST(makeReq());
    expect(secondRes.status).toBe(409);
  });

  it("veritabanı hatasında ham error.message metnini istemciye sızdırmaz (G-06)", async () => {
    mockFrom.mockImplementation(
      buildMockFrom((table: string) => {
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
        return null;
      })
    );

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).not.toContain("secret_column_constraint_violation_xyz");
  });

  it("yeni misafir profili oluşturulurken sms_dogrulandi: false olarak kaydeder (S6)", async () => {
    let profileInsertPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation(
      buildMockFrom((table: string) => {
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
        return null;
      })
    );

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Misafir Kullanıcı",
        musteri_telefon: "0533 999 88 77",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkkOnay: true,
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

    mockFrom.mockImplementation(
      buildMockFrom((table: string) => {
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
        return null;
      })
    );

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Misafir Müşteri",
        musteri_telefon: "0533 999 88 77",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(appointmentInsertPayload).not.toBeNull();
    if (appointmentInsertPayload) {
      expect(appointmentInsertPayload["musteri_id"]).toBeNull();
      expect(typeof appointmentInsertPayload["kvkk_onay_tarihi"]).toBe("string");
    }
  });

  it("kvkk_onay / kvkkOnay true gönderildiğinde kabul eder ve kvkk_onay_tarihi kaydeder (O8, YN-7)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Fatma Demir",
        musteri_telefon: "0532 234 56 78",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkk_onay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.data.kvkk_onay_tarihi).toBe("string");
  });

  it("kvkkOnay eksik veya false gönderildiğinde 400 Bad Request döner (YN-7)", async () => {
    const missingReq = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Fatma Demir",
        musteri_telefon: "0532 234 56 78",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
      }),
    });
    const missingRes = await POST(missingReq);
    expect(missingRes.status).toBe(400);
    const missingJson = await missingRes.json();
    expect(missingJson.error).toContain("KVKK");

    const falseReq = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Fatma Demir",
        musteri_telefon: "0532 234 56 78",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkkOnay: false,
      }),
    });
    const falseRes = await POST(falseReq);
    expect(falseRes.status).toBe(400);
    const falseJson = await falseRes.json();
    expect(falseJson.error).toContain("KVKK");
  });

  it("geçmiş tarihe randevu alınmaya çalışıldığında 400 döner (O9)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2024-01-01T10:00:00.000Z",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Geçmiş tarihe");
  });

  it("geçersiz veya pasif hizmet ID'si seçildiğinde 400 döner (O9)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-nonexistent-id"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("geçersizdir");
  });

  it("çalışma saatleri dışında (örneğin sabah 05:00) randevu istendiğinde 400 döner (O9)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T02:00:00.000Z", // Istanbul 05:00
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("çalışma saatleri dışındadır");
  });

  it("salonun kapalı olduğu bir gün için randevu istendiğinde 400 döner (O9)", async () => {
    mockFrom.mockImplementation(
      buildMockFrom((table: string) => {
        if (table === "site_settings") {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    calisma_saatleri: {
                      pazar: "Kapalı",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return null;
      })
    );

    // 2026-11-01 is a Sunday
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-01T11:00:00.000Z",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Kapalı");
  });

  it("geçersiz tarih ve saat formatında 400 döner (D1)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "gecersiz-tarih",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Geçerli bir tarih");
  });

  it("beklenmeyen ek alanlar içeren randevu gövdesini strict şema ile 400 reddeder (D1)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "05321234567",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-16T10:00:00.000Z",
        extra_saldiri_alani: "test",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("hafta içi 17:00 ve 19:30 (+03:00) slotlarını kabul eder, 20:30 slotunu reddeder (Y1)", async () => {
    // 2026-11-05 is a Thursday (weekday, 09:00 - 20:00)
    const req1700 = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Zeynep Kaya",
        musteri_telefon: "0532 111 22 33",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-05T17:00:00+03:00",
        kvkkOnay: true,
      }),
    });
    const res1700 = await POST(req1700);
    expect(res1700.status).toBe(201);

    const req1930 = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Zeynep Kaya",
        musteri_telefon: "0532 111 22 44",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-05T19:30:00+03:00",
        kvkkOnay: true,
      }),
    });
    const res1930 = await POST(req1930);
    expect(res1930.status).toBe(201);

    const req2030 = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Zeynep Kaya",
        musteri_telefon: "0532 111 22 55",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-05T20:30:00+03:00",
        kvkkOnay: true,
      }),
    });
    const res2030 = await POST(req2030);
    expect(res2030.status).toBe(400);
    const json2030 = await res2030.json();
    expect(json2030.error).toContain("çalışma saatleri dışındadır");
  });

  it("60 günden ileri bir tarihe randevu istendiğinde 400 döner (O-6)", async () => {
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2027-03-15T12:00:00+03:00",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("60 gün");
  });

  it("calismaSaatleri.specialDays kuralını normal gün saatlerine göre öncelikli uygular (O-6)", async () => {
    mockFrom.mockImplementation(
      buildMockFrom((table: string) => {
        if (table === "site_settings") {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    calisma_saatleri: {
                      hafta_ici: "09:00 - 20:00",
                      specialDays: [
                        { date: "2026-11-10", isClosed: true },
                        { date: "2026-11-11", isClosed: false, open: "10:00", close: "14:00" },
                      ],
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return null;
      })
    );

    const closedDayReq = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-10T11:00:00+03:00",
        kvkkOnay: true,
      }),
    });
    const closedRes = await POST(closedDayReq);
    expect(closedRes.status).toBe(400);

    const afterSpecialHoursReq = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Ayşe Yılmaz",
        musteri_telefon: "0532 123 45 67",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-11T15:00:00+03:00",
        kvkkOnay: true,
      }),
    });
    const afterSpecialRes = await POST(afterSpecialHoursReq);
    expect(afterSpecialRes.status).toBe(400);
  });

  it("oturumsuz istekte mevcut doğrulanmamış misafir profilini yeniden kullanır (O-4)", async () => {
    let insertedAppointmentPayload: Record<string, unknown> | null = null;
    const profileInsertSpy = vi.fn();

    mockFrom.mockImplementation(
      buildMockFrom((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "existing-guest-profile-id" },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            insert: profileInsertSpy,
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
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              insertedAppointmentPayload = payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "app-reused-guest", ...payload },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        return null;
      })
    );

    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musteri_ad_soyad: "Tekrar Gelen Misafir",
        musteri_telefon: "0532 555 66 77",
        hizmet_idleri: ["srv-1"],
        tarih_saat: "2026-11-05T14:00:00+03:00",
        kvkkOnay: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(profileInsertSpy).not.toHaveBeenCalled();
    expect(insertedAppointmentPayload?.["musteri_id"]).toBe("existing-guest-profile-id");
  });
});
