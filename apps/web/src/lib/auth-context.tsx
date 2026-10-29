"use client";

import React, { createContext, useContext, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserProfile, useAuthStore } from "@/stores/auth-store";

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

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  updateProfile: (
    data: Partial<AuthUser>
  ) => Promise<{ success: boolean; error?: string } | void> | void;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<boolean>(false);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      useAuthStore.getState().setLoading(false);
      return;
    }

    let mounted = true;
    const client = supabase;

    void useAuthStore.getState().initAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const isGoogle =
          session.user.app_metadata?.provider === "google" ||
          session.user.identities?.some((id) => id.provider === "google") ||
          false;
        const profile = await fetchUserProfile(
          client,
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
        if (mounted) {
          useAuthStore.getState().setUser(profile, isGoogle);
        }
      } else {
        if (mounted) {
          useAuthStore.getState().setUser(null, false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={true}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const isInsideProvider = useContext(AuthContext);
  const state = useAuthStore();

  if (!isInsideProvider) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return {
    user: state.user,
    isAuthenticated: state.user !== null,
    isLoading: state.isLoading,
    sendPhoneOtp: state.sendPhoneOtp,
    loginWithPhone: state.loginWithPhone,
    loginWithEmail: state.loginWithEmail,
    registerWithEmail: state.registerWithEmail,
    loginWithGoogle: state.loginWithGoogle,
    updateProfile: state.updateProfile,
    logout: state.logout,
  };
};
