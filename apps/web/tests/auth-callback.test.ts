import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/auth/callback/route";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { NextRequest } from "next/server";

const mockExchangeCodeForSession = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
    from: mockFrom,
  }),
}));

describe("Google OAuth Callback Route: GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("code parametresi yoksa /giris sayfasına yönlendirir", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/giris");
  });

  it("exchangeCodeForSession hata dönerse /giris?error=oauth sayfasına yönlendirir", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("Invalid auth code"),
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=bad-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/giris?error=oauth");
  });

  it("Kullanıcı rolü 'Admin' ise /admin rotasına yönlendirir", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "admin-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Admin" },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=valid-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/admin");
  });

  it("Kullanıcı rolü 'Calisan' ise /admin rotasına yönlendirir", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "staff-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Calisan" },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=valid-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/admin");
  });

  it("Kullanıcı rolü 'Musteri' ve next parametresi yoksa /profil rotasına yönlendirir", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "customer-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=valid-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/profil");
  });

  it("Kullanıcı rolü 'Musteri' ve geçerli next parametresi varsa next rotasına yönlendirir", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "customer-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code&next=/randevu"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/randevu");
  });

  it("Güvensiz harici next URL (next=//evil.com) /profil rotasına geri düşer", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "customer-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code&next=//evil.com"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/profil");
  });

  it("Ters eğik çizgili open redirect atağı (next=/\\evil.com) /profil rotasına geri düşer", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "customer-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code&next=/\\evil.com"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/profil");
  });

  it("Tam harici URL open redirect atağı (next=https://evil.com) /profil rotasına geri düşer", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "customer-uid" }, session: {} },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code&next=https://evil.com"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/profil");
  });

  it("safeRedirectPath yardımcı fonksiyonu tüm açık yönlendirme vektörlerini engeller", () => {
    expect(safeRedirectPath("/\\evil.com", "http://localhost:3000")).toBe("/profil");
    expect(safeRedirectPath("https://evil.com", "http://localhost:3000")).toBe("/profil");
    expect(safeRedirectPath("//evil.com", "http://localhost:3000")).toBe("/profil");
    expect(safeRedirectPath("/randevu\r\n", "http://localhost:3000")).toBe("/profil");
    expect(safeRedirectPath("/randevu?step=2#onay", "http://localhost:3000")).toBe(
      "/randevu?step=2#onay"
    );
  });
});
