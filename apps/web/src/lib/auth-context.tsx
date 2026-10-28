"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { normalizePhoneNumber } from "./phone-utils";

export { normalizePhoneNumber } from "./phone-utils";

export interface AuthUser {
  id: string;
  ad: string;
  soyad: string;
  telefon: string;
  eposta?: string;
  rol: "Musteri" | "Calisan" | "Admin";
  toplamPuan: number;
  smsDogrulandi: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  updateProfile: (data: Partial<AuthUser>) => Promise<void> | void;
  logout: () => Promise<void> | void;
}

export function getDevAuthUser(identifier: string): AuthUser {
  const clean = identifier.toLowerCase().replace(/\s+/g, "");

  const isCalisan =
    clean.includes("elif") ||
    clean.includes("merve") ||
    clean.includes("seda") ||
    clean.includes("personel") ||
    clean.includes("calisan") ||
    clean.endsWith("1000002") ||
    clean.endsWith("1000003") ||
    clean.endsWith("1000004");

  const isSpecial =
    !isCalisan &&
    (clean.includes("admin") ||
      clean.startsWith("yildiz@") ||
      clean === "yildiz" ||
      clean.endsWith("1000001"));

  const staffName = clean.includes("merve")
    ? { ad: "Merve", soyad: "Aydın" }
    : clean.includes("seda")
      ? { ad: "Seda", soyad: "Kaya" }
      : { ad: "Elif", soyad: "Yıldırım" };

  return {
    id: isSpecial
      ? "b2010000-0000-4000-8000-000000000001"
      : isCalisan
        ? "c1010000-0000-4000-8000-000000000001"
        : "u1010000-0000-4000-8000-000000000001",
    ad: isSpecial ? "Yıldız" : isCalisan ? staffName.ad : "Selin",
    soyad: isSpecial ? "Aksoy" : isCalisan ? staffName.soyad : "Doğan",
    telefon: identifier.includes("@") ? "05321000001" : identifier,
    eposta: identifier.includes("@")
      ? identifier
      : `${isSpecial ? "admin" : isCalisan ? staffName.ad.toLowerCase() : "selin"}@yildizkuafor.com`,
    rol: isSpecial ? "Admin" : isCalisan ? "Calisan" : "Musteri",
    toplamPuan: isSpecial || isCalisan ? 0 : 140,
    smsDogrulandi: true,
  };
}

// Profil tablosundan kullanıcı detaylarını çeken yardımcı fonksiyon
async function fetchProfile(
  client: ReturnType<typeof createClient>,
  userId: string,
  email?: string,
  userMetadata?: Record<string, unknown>
): Promise<AuthUser | null> {
  try {
    const { data: profile, error } = await client
      .from("profiles")
      .select("*")
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

    // Veritabanı profili henüz hazır değilse auth metadata fallback
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zustand useAuthStore ile çift yönlü/reaktif senkronizasyon
  useEffect(() => {
    useAuthStore.getState().setUser(user);
  }, [user]);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // Reaktif Supabase Auth Listener & getSession()
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // 1. Mevcut oturumu kontrol et
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchProfile(
            supabase,
            session.user.id,
            session.user.email,
            session.user.user_metadata
          );
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
        if (mounted) setIsLoading(false);
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    // 2. Auth durumu değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchProfile(
          supabase,
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
        if (mounted) setUser(profile);
      } else {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Telefon & SMS OTP ile Giriş
  const loginWithPhone = async (phone: string, code: string): Promise<AuthUser | null> => {
    if (!phone || !code) return null;

    const formattedPhone = normalizePhoneNumber(phone);

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: code,
          type: "sms",
        });

        if (!error && data?.user) {
          const profile = await fetchProfile(
            supabase,
            data.user.id,
            data.user.email,
            data.user.user_metadata
          );
          setUser(profile);
          return profile;
        }
      } catch {
        // verifyOtp hatası durumunda test moduna geçilir
      }
    }

    // Geliştirme ortamı / test modu desteği
    if (process.env.NODE_ENV !== "production") {
      const devUser = getDevAuthUser(phone);
      setUser(devUser);
      return devUser;
    }

    return null;
  };

  // E-posta ve Şifre ile Giriş
  const loginWithEmail = async (email: string, pass: string): Promise<AuthUser | null> => {
    if (!email || !pass) return null;

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (!error && data?.user) {
          const profile = await fetchProfile(
            supabase,
            data.user.id,
            data.user.email,
            data.user.user_metadata
          );
          setUser(profile);
          return profile;
        }
      } catch {
        // signInWithPassword hatası durumunda test moduna geçilir
      }
    }

    // Geliştirme ortamı / test modu desteği
    if (process.env.NODE_ENV !== "production") {
      const devUser = getDevAuthUser(email);
      setUser(devUser);
      return devUser;
    }

    return null;
  };

  // Müşteri Kayıt Fonksiyonu (E-posta, Şifre ve Profil Meta Verileri ile)
  const registerWithEmail = async (
    ad: string,
    soyad: string,
    telefon: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser | null }> => {
    if (!ad || !soyad || !telefon || !email || !password) {
      return { success: false, error: "Lütfen tüm alanları doldurunuz." };
    }

    const formattedPhone = normalizePhoneNumber(telefon);

    if (supabase) {
      try {
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
          return { success: false, error: error.message };
        }

        if (data?.user) {
          const profile = await fetchProfile(
            supabase,
            data.user.id,
            data.user.email,
            data.user.user_metadata
          );
          if (data.session) {
            setUser(profile);
          }
          return { success: true, user: profile };
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu.";
        if (process.env.NODE_ENV === "production") {
          return { success: false, error: message };
        }
      }
    }

    // Geliştirme ortamı / test modu desteği
    if (process.env.NODE_ENV !== "production") {
      const devUser: AuthUser = {
        id: "u1010000-0000-4000-8000-000000000003",
        ad,
        soyad,
        telefon: formattedPhone || telefon,
        eposta: email,
        rol: "Musteri",
        toplamPuan: 0,
        smsDogrulandi: false,
      };
      setUser(devUser);
      return { success: true, user: devUser };
    }

    return { success: false, error: "Kayıt işlemi gerçekleştirilemedi." };
  };

  // Google OAuth ile Giriş
  const loginWithGoogle = async (
    redirectToPath?: string
  ): Promise<{ user?: AuthUser | null; error?: string }> => {
    if (supabase) {
      try {
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
          const isLocalhost =
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1" ||
              process.env.NODE_ENV !== "production");

          const isProviderDisabled =
            error.message.toLowerCase().includes("provider is not enabled") ||
            error.message.toLowerCase().includes("unsupported provider");

          if (isLocalhost && isProviderDisabled) {
            const devUser: AuthUser = {
              id: "u1010000-0000-4000-8000-000000000002",
              ad: "Büşra (Google Dev)",
              soyad: "Çelik",
              telefon: "05329998877",
              eposta: "busra.celik@gmail.com",
              rol: "Musteri",
              toplamPuan: 85,
              smsDogrulandi: true,
            };
            setUser(devUser);
            return { user: devUser };
          }

          return { error: error.message };
        }

        return { user: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Google ile giriş başlatılamadı.";
        return { error: message };
      }
    }

    // Geliştirme ortamı / test modu desteği
    if (process.env.NODE_ENV !== "production") {
      const devUser: AuthUser = {
        id: "u1010000-0000-4000-8000-000000000002",
        ad: "Büşra (Google Dev)",
        soyad: "Çelik",
        telefon: "05329998877",
        eposta: "busra.celik@gmail.com",
        rol: "Musteri",
        toplamPuan: 85,
        smsDogrulandi: true,
      };
      setUser(devUser);
      return { user: devUser };
    }

    return { error: "Kimlik doğrulama servisine erişilemedi." };
  };

  // Profil Güncelleme (Rol değiştirme engellidir, sadece iletişim bilgileri güncellenir)
  const updateProfile = async (data: Partial<AuthUser>) => {
    if (!user) return;

    setUser((prev) => (prev ? { ...prev, ...data } : null));

    if (supabase) {
      try {
        await supabase
          .from("profiles")
          .update({
            ...(data.ad !== undefined ? { ad: data.ad } : {}),
            ...(data.soyad !== undefined ? { soyad: data.soyad } : {}),
            ...(data.telefon !== undefined ? { telefon: data.telefon } : {}),
            ...(data.eposta !== undefined ? { eposta: data.eposta } : {}),
          })
          .eq("id", user.id);
      } catch {
        // Profil güncelleme hatası güvenle yutulur
      }
    }
  };

  // Çıkış Yap
  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // signOut hatası güvenle yutulur
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        loginWithPhone,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
