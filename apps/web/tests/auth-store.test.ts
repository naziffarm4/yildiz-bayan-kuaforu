import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/lib/auth-context";

const mockFrom = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      signOut: mockSignOut,
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe("Zustand useAuthStore Mimarisi (Single Source of Truth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      appointments: [],
      isLoading: false,
      isGoogleUser: false,
    });
  });

  it("Başlangıç durumunda user null ve appointments boş olmalıdır", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.appointments).toEqual([]);
  });

  it("setUser çağrıldığında user state'i güncellenir", () => {
    const testUser: AuthUser = {
      id: "u-123",
      ad: "Gizem",
      soyad: "Akın",
      telefon: "05321112233",
      eposta: "gizem@example.com",
      rol: "Musteri",
      toplamPuan: 200,
      smsDogrulandi: true,
    };

    useAuthStore.getState().setUser(testUser, true);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(testUser);
    expect(state.isGoogleUser).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("updateProfile optimistik olarak Zustand store'daki kullanıcıyı anında günceller ve DB'ye yalnızca ad/soyad/eposta gönderir", async () => {
    const initialUser: AuthUser = {
      id: "u-123",
      ad: "Gizem",
      soyad: "Akın",
      telefon: "05321112233",
      eposta: "gizem@example.com",
      rol: "Musteri",
      toplamPuan: 200,
      smsDogrulandi: true,
    };

    useAuthStore.getState().setUser(initialUser);

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const result = await useAuthStore.getState().updateProfile({
      ad: "Gizem Nur",
      telefon: "05329998877",
    });

    expect(result.success).toBe(true);
    const updated = useAuthStore.getState().user;
    expect(updated?.ad).toBe("Gizem Nur");
    expect(updated?.telefon).toBe("+905329998877");
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpdate).toHaveBeenCalledWith({ ad: "Gizem Nur" });
  });

  it("0599 ile başlayan geçici OAuth telefonu tespit edilir", () => {
    const tempUser: AuthUser = {
      id: "u-oauth",
      ad: "Google",
      soyad: "User",
      telefon: "05991234567",
      eposta: "user@gmail.com",
      rol: "Musteri",
      toplamPuan: 0,
      smsDogrulandi: false,
    };

    useAuthStore.getState().setUser(tempUser);
    const isTempPhone = Boolean(
      useAuthStore.getState().user?.telefon?.startsWith("0599")
    );
    expect(isTempPhone).toBe(true);
  });

  it("updatePassword 8 karakterden kısa şifreleri reddeder (G-14)", async () => {
    const result = await useAuthStore.getState().updatePassword("1234567");
    expect(result.success).toBe(false);
    expect(result.error).toContain("en az 8 karakter");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("updatePassword geçerli şifreyi supabase.auth.updateUser ile kaydeder", async () => {
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });

    const result = await useAuthStore.getState().updatePassword("YeniSifre123!");
    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "YeniSifre123!" });
  });

  it("sendPhoneOtp geçerli Türkiye mobil numarasıyla supabase.auth.signInWithOtp (shouldCreateUser: false) çağırır (G-04, O-3)", async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

    const result = await useAuthStore.getState().sendPhoneOtp("0532 100 00 01");
    expect(result.success).toBe(true);
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      phone: "+905321000001",
      options: { shouldCreateUser: false },
    });
  });

  it("sendPhoneOtp geçersiz telefon numarasını reddeder", async () => {
    const result = await useAuthStore.getState().sendPhoneOtp("12345");
    expect(result.success).toBe(false);
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("loginWithPhone supabase.auth.verifyOtp çağırır ve hata durumunda sahte kullanıcı üretmez (G-04 / K-01)", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid OTP"),
    });

    const user = await useAuthStore.getState().loginWithPhone("05321000001", "000000");
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: "+905321000001",
      token: "000000",
      type: "sms",
    });
    expect(user).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("loginWithEmail yanlış şifre veya Supabase hatasında sahte Admin kullanıcısı üretmez (G-04 / K-01)", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid login credentials"),
    });

    const user = await useAuthStore
      .getState()
      .loginWithEmail("admin@yildizkuafor.com", "yanlisSifre123");
    expect(user).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("registerWithEmail 8 karakterden kısa şifreyi reddeder ve Supabase hatasında sahte kullanıcı üretmez", async () => {
    const shortRes = await useAuthStore
      .getState()
      .registerWithEmail("Ayşe", "Yılmaz", "05321112233", "ayse@example.com", "kisa12");
    expect(shortRes.success).toBe(false);
    expect(shortRes.error).toContain("en az 8 karakter");

    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const failRes = await useAuthStore
      .getState()
      .registerWithEmail("Ayşe", "Yılmaz", "05321112233", "ayse@example.com", "GecerliSifre123");
    expect(failRes.success).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("logout Zustand store'u sıfırlar ve Supabase signOut çağırır", async () => {
    useAuthStore.getState().setUser({
      id: "u-1",
      ad: "Test",
      soyad: "User",
      telefon: "05321000000",
      rol: "Musteri",
      toplamPuan: 50,
      smsDogrulandi: true,
    });

    mockSignOut.mockResolvedValue({ error: null });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.appointments).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("fetchUserAppointments müşteri ID'sine göre randevuları canlı çekip haritalar", async () => {
    useAuthStore.getState().setUser({
      id: "cust-999",
      ad: "Zeynep",
      soyad: "Demir",
      telefon: "05321000009",
      rol: "Musteri",
      toplamPuan: 100,
      smsDogrulandi: true,
    });

    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "app-1",
          musteri_id: "cust-999",
          musteri_ad_soyad: "Zeynep Demir",
          musteri_telefon: "05321000009",
          hizmet_idleri: ["srv-1"],
          calisan_idleri: ["stf-1"],
          tarih_saat: "2026-10-30T14:00:00Z",
          toplam_sure_dakika: 60,
          durum: "Onaylandı",
          kaynak: "Web",
          notlar: "Özel randevu notu",
          onaylayan_id: "adm-1",
          olusturulma_tarihi: "2026-10-25T10:00:00Z",
        },
      ],
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    await useAuthStore.getState().fetchUserAppointments();

    const appointments = useAuthStore.getState().appointments;
    expect(appointments).toHaveLength(1);
    expect(appointments[0].id).toBe("app-1");
    expect(appointments[0].musteriAdSoyad).toBe("Zeynep Demir");
    expect(appointments[0].durum).toBe("Onaylandı");
    expect(appointments[0].toplamSureDakika).toBe(60);
    expect(appointments[0].not).toBe("Özel randevu notu");
    expect(mockFrom).toHaveBeenCalledWith("appointments");
    expect(mockEq).toHaveBeenCalledWith("musteri_id", "cust-999");
  });
});
