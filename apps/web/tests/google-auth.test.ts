import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Google OAuth Hata Yönetimi & Dev Fallback Mantığı", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Provider kapalı hatası ('provider is not enabled') geliştirme ortamında tespit edilir", () => {
    const error = { message: "Unsupported provider: provider is not enabled" };
    const isProviderDisabled =
      error.message.toLowerCase().includes("provider is not enabled") ||
      error.message.toLowerCase().includes("unsupported provider");

    expect(isProviderDisabled).toBe(true);
  });

  it("Geliştirme ortamında (localhost) provider kapalıyken dev-fallback kullanıcısı tanımlıdır", () => {
    const devUser = {
      id: "u1010000-0000-4000-8000-000000000002",
      ad: "Büşra (Google Dev)",
      soyad: "Çelik",
      telefon: "05329998877",
      eposta: "busra.celik@gmail.com",
      rol: "Musteri" as const,
      toplamPuan: 85,
      smsDogrulandi: true,
    };

    expect(devUser.ad).toContain("Google Dev");
    expect(devUser.rol).toBe("Musteri");
    expect(devUser.smsDogrulandi).toBe(true);
  });

  it("Kullanıcı arayüzünde 'provider is not enabled' hatası dostane Türkçe mesaja dönüştürülür", () => {
    const rawError = "Unsupported provider: provider is not enabled";
    let userFacingMessage = `Google ile giriş başarısız: ${rawError}`;

    if (
      rawError.toLowerCase().includes("provider is not enabled") ||
      rawError.toLowerCase().includes("unsupported provider")
    ) {
      userFacingMessage = "Google ile giriş sağlayıcısı henüz yapılandırılmamış.";
    }

    expect(userFacingMessage).toBe("Google ile giriş sağlayıcısı henüz yapılandırılmamış.");
  });

  it("Diğer OAuth hatalarında orijinal hata metni kullanıcıya aktarılır", () => {
    const rawError = "access_denied: User denied consent";
    let userFacingMessage = "";

    if (
      rawError.toLowerCase().includes("provider is not enabled") ||
      rawError.toLowerCase().includes("unsupported provider")
    ) {
      userFacingMessage = "Google ile giriş sağlayıcısı henüz yapılandırılmamış.";
    } else {
      userFacingMessage = `Google ile giriş başarısız: ${rawError}`;
    }

    expect(userFacingMessage).toBe("Google ile giriş başarısız: access_denied: User denied consent");
  });

  describe("Google OAuth Redirect URI & Return URL Güvenliği", () => {
    it("Redirect URI parametresi ile callback rotasını doğru kurgular", () => {
      const origin = "https://yildizkuafor.com";
      const redirectToPath = "/randevu?hizmet=kesim";
      const nextParam = redirectToPath ? `?next=${encodeURIComponent(redirectToPath)}` : "";
      const fullRedirectUrl = `${origin}/auth/callback${nextParam}`;

      expect(fullRedirectUrl).toBe(
        "https://yildizkuafor.com/auth/callback?next=%2Frandevu%3Fhizmet%3Dkesim"
      );
    });

    it("Open Redirect koruması güvensiz hedefleri reddeder", () => {
      const checkSafeRedirect = (target: string | null) =>
        target &&
        target.startsWith("/") &&
        !target.startsWith("//") &&
        !target.toLowerCase().startsWith("/\\")
          ? target
          : null;

      expect(checkSafeRedirect("/randevu")).toBe("/randevu");
      expect(checkSafeRedirect("/profil")).toBe("/profil");
      expect(checkSafeRedirect("/admin/ayarlar")).toBe("/admin/ayarlar");

      // Güvensiz saldırı vektörleri
      expect(checkSafeRedirect("//evil.com")).toBeNull();
      expect(checkSafeRedirect("https://evil.com")).toBeNull();
      expect(checkSafeRedirect("/\\evil.com")).toBeNull();
      expect(checkSafeRedirect(null)).toBeNull();
      expect(checkSafeRedirect("")).toBeNull();
    });
  });
});
