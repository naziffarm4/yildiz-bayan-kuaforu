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
  updateProfile: (patch: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (redirectToPath?: string) => Promise<{ user?: AuthUser | null; error?: string }>;
  logout: () => Promise<void>;
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      const authUser: AuthUser = profile
        ? {
            id: profile.id,
            ad: profile.ad || "Kullanıcı",
            soyad: profile.soyad || "",
            telefon: profile.telefon || "",
            eposta: profile.eposta || session.user.email || undefined,
            rol: (profile.rol as "Musteri" | "Calisan" | "Admin") || "Musteri",
            toplamPuan: profile.toplam_puan ?? 0,
            smsDogrulandi: Boolean(profile.sms_dogrulandi),
          }
        : {
            id: session.user.id,
            ad: (session.user.user_metadata?.ad as string) || "Kullanıcı",
            soyad: (session.user.user_metadata?.soyad as string) || "",
            telefon: (session.user.user_metadata?.telefon as string) || "",
            eposta: session.user.email,
            rol: "Musteri",
            toplamPuan: 0,
            smsDogrulandi: false,
          };

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
        .select("*")
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
          ...(patch.telefon !== undefined ? { telefon: updatedUser.telefon } : {}),
          ...(patch.eposta !== undefined ? { eposta: patch.eposta } : {}),
        })
        .eq("id", currentUser.id);

      if (error) {
        if (process.env.NODE_ENV === "production") {
          return { success: false, error: error.message };
        }
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "production") {
        const msg = err instanceof Error ? err.message : "Profil güncellenemedi.";
        return { success: false, error: msg };
      }
    }

    return { success: true };
  },

  updatePassword: async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
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
      if (process.env.NODE_ENV !== "production") {
        return { success: true };
      }
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
