"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Badge, PasswordInput } from "@yildiz/ui";
import { useAuth } from "@/lib/auth-context";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/stores/toast-store";
import { PageLoader } from "@/components/PageLoader";

function LoginForm() {
  const searchParams = useSearchParams();
  const { sendPhoneOtp, loginWithPhone, loginWithEmail, loginWithGoogle } = useAuth();

  const redirectParam = searchParams.get("redirect") || searchParams.get("next");
  const safeRedirect = safeRedirectPath(redirectParam, undefined, "") || null;

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // Telefon Formu
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [enteredSmsCode, setEnteredSmsCode] = useState("");

  // E-posta Formu
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUserByRole = (role: "Musteri" | "Calisan" | "Admin") => {
    if (
      safeRedirect &&
      safeRedirect !== "/giris" &&
      safeRedirect !== "/kayit" &&
      !safeRedirect.startsWith("/giris?") &&
      !safeRedirect.startsWith("/kayit?")
    ) {
      window.location.href = safeRedirect;
      return;
    }

    if (role === "Admin" || role === "Calisan") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/profil";
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setLoading(true);
    const result = await sendPhoneOtp(phoneNumber);
    setLoading(false);

    if (!result.success) {
      const err = result.error || "SMS doğrulama kodu gönderilemedi.";
      setError(err);
      toast.error(err);
      return;
    }

    setSmsSent(true);
    toast.info("SMS doğrulama kodu gönderildi.");
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = enteredSmsCode.trim();
    if (cleanCode.length < 4 || cleanCode.length > 6) {
      const err = "Lütfen telefonunuza gönderilen doğrulama kodunu giriniz.";
      setError(err);
      toast.error(err);
      return;
    }
    setError(null);
    setLoading(true);
    const loggedUser = await loginWithPhone(phoneNumber, cleanCode);
    setLoading(false);
    if (loggedUser) {
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
      redirectUserByRole(loggedUser.rol);
    } else {
      const err = "Giriş yapılamadı, lütfen tekrar deneyiniz.";
      setError(err);
      toast.error(err);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      const err = "Lütfen tüm alanları doldurunuz.";
      setError(err);
      toast.error(err);
      return;
    }
    setError(null);
    setLoading(true);
    const loggedUser = await loginWithEmail(email, password);
    setLoading(false);
    if (loggedUser) {
      toast.success("Hoş geldiniz! Giriş başarılı.");
      redirectUserByRole(loggedUser.rol);
    } else {
      const err = "Giriş bilgileri doğrulanamadı.";
      setError(err);
      toast.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginWithGoogle(safeRedirect || undefined);
      setLoading(false);

      if (result?.error) {
        let msg = `Google ile giriş başarısız: ${result.error}`;
        if (
          result.error.toLowerCase().includes("provider is not enabled") ||
          result.error.toLowerCase().includes("unsupported provider")
        ) {
          msg = "Google ile giriş sağlayıcısı henüz yapılandırılmamış.";
        }
        setError(msg);
        toast.error(msg);
        return;
      }

      if (result?.user) {
        toast.success("Google ile giriş başarılı!");
        redirectUserByRole(result.user.rol);
      }
    } catch (err: unknown) {
      setLoading(false);
      const message =
        err instanceof Error
          ? err.message
          : "Google ile giriş sırasında beklenmedik bir hata oluştu.";
      setError(message);
      toast.error(message);
    }
  };

  const registerHref = safeRedirect
    ? `/kayit?redirect=${encodeURIComponent(safeRedirect)}`
    : "/kayit";

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-secondary flex flex-col justify-center items-center p-4 sm:p-6 text-text-primary">
      {/* Üst Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group focus:outline-none">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shadow-xs group-hover:scale-105 transition-transform bg-bg-secondary">
          <Image
            src="/yildiz-logo.png"
            alt="Yıldız Bayan Kuaförü Logo"
            fill
            className="object-contain p-1"
            priority
          />
        </div>
        <div>
          <span className="font-serif text-2xl font-bold tracking-widest block leading-none">
            YILDIZ
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-accent-gold font-semibold">
            Haute Coiffure
          </span>
        </div>
      </Link>

      <Card className="w-full max-w-md p-6 sm:p-8 bg-white border-border shadow-lg rounded-2xl space-y-6">
        {/* Karşılama Başlığı */}
        <div className="text-center space-y-1">
          <Badge variant="gold" className="text-[10px] uppercase font-bold tracking-widest">
            Güvenli Giriş Portalı
          </Badge>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary pt-1">
            Hesabınıza Giriş Yapın
          </h1>
          <p className="text-xs text-text-secondary">
            Randevularınızı takip edin, işlemlerinizi ve puanlarınızı yönetin.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Giriş Yöntemi Sekmeleri */}
        <div className="flex border-b border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setError(null);
            }}
            className={`flex-1 pb-2 text-center transition-colors ${
              authMethod === "phone"
                ? "border-b-2 border-accent-gold text-text-primary font-bold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            📱 SMS Kodu ile Giriş
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setError(null);
            }}
            className={`flex-1 pb-2 text-center transition-colors ${
              authMethod === "email"
                ? "border-b-2 border-accent-gold text-text-primary font-bold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            ✉️ E-posta &amp; Şifre
          </button>
        </div>

        {/* 1. YÖNTEM: TELEFON & SMS KODU */}
        {authMethod === "phone" && (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Telefon Numaranız
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendOtp}
                  className="text-xs whitespace-nowrap"
                >
                  {smsSent ? "Tekrar İste" : "Kod Gönder"}
                </Button>
              </div>
            </div>

            {smsSent && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <label className="block text-[11px] font-bold text-amber-900">
                  SMS Doğrulama Kodu
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  minLength={4}
                  maxLength={6}
                  required
                  value={enteredSmsCode}
                  onChange={(e) => setEnteredSmsCode(e.target.value)}
                  placeholder="6 Haneli Kod"
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-md text-sm text-center font-mono font-bold bg-white text-text-primary"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!smsSent || enteredSmsCode.trim().length < 4 || loading}
              className="w-full text-xs font-bold h-11"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
            </Button>
          </form>
        )}

        {/* 2. YÖNTEM: E-POSTA & ŞİFRE */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad@ornek.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Şifre
              </label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full text-xs font-bold h-11"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
            </Button>
          </form>
        )}

        {/* 3. YÖNTEM: GOOGLE İLE GİRİŞ */}
        <div className="pt-2 border-t border-border space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-bg-secondary hover:bg-border-main text-xs font-semibold text-text-primary transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google ile Giriş Yap
          </button>
        </div>

        {/* Alt Bilgi */}
        <div className="text-center pt-2 space-y-2">
          <p className="text-xs text-text-secondary">
            Hesabınız yok mu?{" "}
            <Link href={registerHref} className="text-accent-gold font-semibold hover:underline">
              Kayıt Olun
            </Link>
          </p>
          <div>
            <Link href="/" className="text-xs text-text-secondary hover:text-accent-gold transition-colors">
              ← Ana Sayfaya Geri Dön
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
