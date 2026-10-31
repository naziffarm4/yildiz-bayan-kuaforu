import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware } from "../src/middleware";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle, maybeSingle: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

describe("Next.js Middleware: Auth & Role Koruması", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("/admin rotasına oturumsuz erişildiğinde /giris?redirect=/admin sayfasına yönlendirir", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest("http://localhost/admin/randevular");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/giris");
    expect(location).toContain("redirect=%2Fadmin");
  });

  it("/admin rotasına rolü 'Musteri' olan kullanıcı eriştiğinde /giris?error=unauthorized sayfasına yönlendirir", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const req = new NextRequest("http://localhost/admin/hizmetler");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/giris");
    expect(location).toContain("error=unauthorized");
  });

  it("/admin rotasına rolü 'Admin' olan kullanıcı eriştiğinde geçişe izin verir", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-123" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Admin" },
      error: null,
    });

    const req = new NextRequest("http://localhost/admin");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin rotasına rolü 'Calisan' olan kullanıcı eriştiğinde geçişe izin verir", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "staff-123" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Calisan" },
      error: null,
    });

    const req = new NextRequest("http://localhost/admin/randevular");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/profil rotasına oturumsuz erişildiğinde /giris?redirect=/profil sayfasına yönlendirir", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest("http://localhost/profil");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/giris");
    expect(location).toContain("redirect=%2Fprofil");
  });

  it("/profil rotasına oturumlu müşteri eriştiğinde geçişe izin verir", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const req = new NextRequest("http://localhost/profil");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("Genel sayfalarda (/hizmetler) sb-* çerezi yoksa supabase.auth.getUser() ağ çağrısını atlar ve doğrudan geçişe izin verir (P-1)", async () => {
    const req = new NextRequest("http://localhost/hizmetler");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("Genel sayfalarda (/hizmetler) sb-* oturum çerezi varsa oturumu tazelemek için supabase.auth.getUser() çağırır (P-1)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const req = new NextRequest("http://localhost/hizmetler", {
      headers: {
        cookie: "sb-project-auth-token=mock-token-value",
      },
    });
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("/api/* rotalarında gereksiz supabase.auth.getUser() ağ turunu atlar ve doğrudan geçişe izin verir", async () => {
    const req = new NextRequest("http://localhost/api/appointments");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("/admin rotasına DB profili olmayan ve yalnızca istemci kontrolündeki user_metadata.rol 'Admin' olan kullanıcıyı reddeder (S4)", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "spoofed-user-123",
          user_metadata: { rol: "Admin" },
        },
      },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const req = new NextRequest("http://localhost/admin");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/giris");
    expect(location).toContain("error=unauthorized");
  });

  it("/admin rotasına DB profili olmayan ancak sunucu kontrollü app_metadata.rol 'Admin' olan kullanıcıya izin verir", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "server-admin-123",
          app_metadata: { rol: "Admin" },
        },
      },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const req = new NextRequest("http://localhost/admin");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin rotasında veritabanı sorgusu hata fırlattığında console.warn basar ve yetkisiz yönlendirir", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "guest-fallback-123",
          user_metadata: { rol: "Admin" },
        },
      },
      error: null,
    });
    mockSingle.mockRejectedValue(new Error("DB connection failed"));

    const req = new NextRequest("http://localhost/admin");
    const res = await middleware(req);

    expect(warnSpy).toHaveBeenCalled();
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/giris");
    expect(location).toContain("error=unauthorized");
    warnSpy.mockRestore();
  });

  it("ortam değişkenleri (NEXT_PUBLIC_SUPABASE_URL) eksikken /admin ve /profil rotalarında fail-closed olarak /giris?error=configuration yönlendirmesi yapar (Bölüm 2.7)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const adminReq = new NextRequest("http://localhost/admin");
    const adminRes = await middleware(adminReq);
    expect(adminRes.status).toBe(307);
    expect(adminRes.headers.get("location")).toContain("/giris?error=configuration");

    const profilReq = new NextRequest("http://localhost/profil");
    const profilRes = await middleware(profilReq);
    expect(profilRes.status).toBe(307);
    expect(profilRes.headers.get("location")).toContain("/giris?error=configuration");
  });
});
