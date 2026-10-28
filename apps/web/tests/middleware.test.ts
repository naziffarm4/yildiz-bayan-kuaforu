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

  it("Genel sayfalarda (/hizmetler) oturumsuz olsa dahi geçişe izin verir", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest("http://localhost/hizmetler");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin rotasına DB profili olmayan fakat user_metadata.rol 'Admin' olan kullanıcı eriştiğinde izin verir", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "admin-fallback-123",
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

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin rotasına DB profili olmayan ve metadata rolü yetkisiz olan kullanıcıyı /giris?error=unauthorized sayfasına yönlendirir", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "guest-fallback-123",
          user_metadata: { rol: "Musteri" },
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
});
