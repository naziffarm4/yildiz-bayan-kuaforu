import { create } from "./zustand";
import type { AuthUser } from "@/lib/auth-context";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import type { AppointmentItem } from "@yildiz/types";
import { createClient } from "@/lib/supabase/client";

export interface AuthState {
  user: AuthUser | null;
  appointments: AppointmentItem[];
  isLoading: boolean;
  isGoogleUser: boolean;

  // Actions
  setUser: (user: AuthUser | null, isGoogleUser?: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  initAuth: () => Promise<void>;
  fetchUserAppointments: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string, code: string) => Promise<AuthUser | null>;
  loginWithEmail: (email: string, pass: string) => Promise<AuthUser | null>;
  registerWithEmail: (
    ad: string,
    soyad: string,
    telefon: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser | null }>;
  loginWithGoogle: (redirectToPath?: string) => Promise<{ user?: AuthUser | null; error?: string }>;
  updateProfile: (patch: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export async function fetchUserProfile(
  client: ReturnType<typeof createClient>,
  userId: string,
  email?: string,
  userMetadata?: Record<string, unknown>
): Promise<AuthUser | null> {
  try {
    const { data: profile, error } = await client
      .from("profiles")
      .select("id, ad, soyad, telefon, eposta, rol, toplam_puan, sms_dogrulandi")
      .eq("id", userId)
      .maybeSingle();

    if (!error && profile) {
      return {
        id: profile.id,
        ad: profile.ad || "Kullanıcı",
        soyad: profile.soyad || "",
        telefon: profile.telefon || "",
        eposta: profile.eposta || email || undefined,
        rol: (profile.rol as "Musteri" | "Calisan" | "Admin") || "Musteri",
        toplamPuan: profile.toplam_puan ?? 0,
        smsDogrulandi: Boolean(profile.sms_dogrulandi),
      };
    }

    const meta = userMetadata || {};
    const fullName = (meta.name as string) || (meta.full_name as string) || "";
    const nameParts = fullName ? fullName.split(" ") : [];

    return {
      id: userId,
      ad: (meta.ad as string) || (meta.first_name as string) || nameParts[0] || "Kullanıcı",
      soyad: (meta.soyad as string) || (meta.last_name as string) || nameParts.slice(1).join(" ") || "",
      telefon: (meta.telefon as string) || (meta.phone as string) || "",
      eposta: email,
      rol: "Musteri",
      toplamPuan: 0,
      smsDogrulandi: false,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  appointments: [],
  isLoading: true,
  isGoogleUser: false,

  setUser: (user, isGoogleUser) => {
    set({
      user,
      isLoading: false,
      ...(isGoogleUser !== undefined ? { isGoogleUser } : {}),
    });
    if (user?.id) {
      get().fetchUserAppointments();
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  initAuth: async () => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      set({ isLoading: false });
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        set({ user: null, appointments: [], isLoading: false, isGoogleUser: false });
        return;
      }

      const isGoogle =
        session.user.app_metadata?.provider === "google" ||
        session.user.identities?.some((id) => id.provider === "google") ||
        false;

      const authUser = await fetchUserProfile(
        supabase,
        session.user.id,
        session.user.email,
        session.user.user_metadata
      );

      set({ user: authUser, isLoading: false, isGoogleUser: isGoogle });
      await get().fetchUserAppointments();
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUserAppointments: async () => {
    const currentUser = get().user;
    if (!currentUser?.id) {
      set({ appointments: [] });
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, musteri_id, musteri_ad_soyad, musteri_telefon, hizmet_idleri, calisan_idleri, tarih_saat, toplam_sure_dakika, durum, kaynak, notlar, onaylayan_id, olusturulma_tarihi"
        )
        .eq("musteri_id", currentUser.id)
        .order("tarih_saat", { ascending: false });

      if (!error && data) {
        const mapped: AppointmentItem[] = data.map((row) => ({
          id: row.id,
          musteriId: row.musteri_id,
          musteriAdSoyad: row.musteri_ad_soyad,
          musteriTelefon: row.musteri_telefon,
          hizmetIdleri: row.hizmet_idleri,
          calisanIdleri: row.calisan_idleri,
          tarihSaat: row.tarih_saat,
          toplamSureDakika: row.toplam_sure_dakika,
          durum: row.durum,
          kaynak: row.kaynak,
          not: row.notlar || undefined,
          onaylayanKullaniciId: row.onaylayan_id || undefined,
          olusturulmaTarihi: row.olusturulma_tarihi,
        }));
        set({ appointments: mapped });
        return;
      }
    } catch (err: unknown) {
      console.warn("Kullanıcı randevuları alınırken uyarı:", err);
    }

    set({ appointments: [] });
  },

  sendPhoneOtp: async (phone: string) => {
    const formattedPhone = normalizePhoneNumber(phone);
    if (!/^\+905\d{9}$/.test(formattedPhone)) {
      return { success: false, error: "Lütfen geçerli bir telefon numarası giriniz." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: false },
      });

      if (error) {
        console.warn("SMS OTP gönderim uyarısı:", error.message);
        return {
          success: false,
          error: "SMS doğrulama kodu gönderilemedi. Lütfen bilgilerinizi kontrol ediniz.",
        };
      }

      return { success: true };
    } catch (err: unknown) {
      console.warn("SMS OTP gönderim hatası:", err);
      return {
        success: false,
        error: "SMS doğrulama kodu gönderilemedi. Lütfen daha sonra tekrar deneyiniz.",
      };
    }
  },

  loginWithPhone: async (phone: string, code: string): Promise<AuthUser | null> => {
    if (!phone || !code) return null;

    const formattedPhone = normalizePhoneNumber(phone);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      });

      if (!error && data?.user) {
        const profile = await fetchUserProfile(
          supabase,
          data.user.id,
          data.user.email,
          data.user.user_metadata
        );
        get().setUser(profile, false);
        return profile;
      }
    } catch {
      // Hata durumunda sahte kullanıcı üretilmez
    }

    return null;
  },

  loginWithEmail: async (email: string, pass: string): Promise<AuthUser | null> => {
    if (!email || !pass) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (!error && data?.user) {
        const profile = await fetchUserProfile(
          supabase,
          data.user.id,
          data.user.email,
          data.user.user_metadata
        );
        get().setUser(profile, false);
        return profile;
      }
    } catch {
      // Hata durumunda sahte kullanıcı üretilmez
    }

    return null;
  },

  registerWithEmail: async (
    ad: string,
    soyad: string,
    telefon: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser | null }> => {
    if (!ad || !soyad || !telefon || !email || !password) {
      return { success: false, error: "Lütfen tüm alanları doldurunuz." };
    }

    if (password.length < 8) {
      return { success: false, error: "Şifre en az 8 karakter olmalıdır." };
    }

    const formattedPhone = normalizePhoneNumber(telefon);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ad,
            soyad,
            telefon: formattedPhone || telefon,
          },
        },
      });

      if (error) {
        console.warn("E-posta kayıt uyarısı:", error.message);
        return {
          success: false,
          error: "Kayıt işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol ediniz.",
        };
      }

      if (data?.user) {
        const profile = await fetchUserProfile(
          supabase,
          data.user.id,
          data.user.email,
          data.user.user_metadata
        );
        if (data.session) {
          get().setUser(profile, false);
        }
        return { success: true, user: profile };
      }
    } catch (err: unknown) {
      console.warn("E-posta kayıt hatası:", err);
      return {
        success: false,
        error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyiniz.",
      };
    }

    return { success: false, error: "Kayıt işlemi gerçekleştirilemedi." };
  },

  updateProfile: async (patch: Partial<AuthUser>) => {
    const currentUser = get().user;
    if (!currentUser) {
      return { success: false, error: "Oturum açmış kullanıcı bulunamadı." };
    }

    const updatedUser: AuthUser = {
      ...currentUser,
      ...patch,
      telefon:
        patch.telefon !== undefined
          ? normalizePhoneNumber(patch.telefon) || patch.telefon
          : currentUser.telefon,
    };

    // İyimser Güncelleme (0ms Optimistic UI)
    set({ user: updatedUser });

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(patch.ad !== undefined ? { ad: patch.ad } : {}),
          ...(patch.soyad !== undefined ? { soyad: patch.soyad } : {}),
          ...(patch.eposta !== undefined ? { eposta: patch.eposta } : {}),
        })
        .eq("id", currentUser.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profil güncellenemedi.";
      return { success: false, error: msg };
    }

    return { success: true };
  },

  updatePassword: async (newPassword: string) => {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Şifre en az 8 karakter olmalıdır." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Şifre güncellenirken bir hata oluştu.";
      return { success: false, error: msg };
    }
  },

  loginWithGoogle: async (redirectToPath?: string) => {
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const nextParam = redirectToPath ? `?next=${encodeURIComponent(redirectToPath)}` : "";
      const redirectTo = `${origin}/auth/callback${nextParam}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { error: error.message };
      }
      return { user: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google ile giriş başlatılamadı.";
      return { error: msg };
    }
  },

  logout: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err: unknown) {
      console.warn("Oturum kapatılırken uyarı:", err);
    }
    set({ user: null, appointments: [], isLoading: false, isGoogleUser: false });
  },
}));
