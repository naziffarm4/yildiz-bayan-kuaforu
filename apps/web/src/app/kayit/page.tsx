"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidTrPhone } from "@yildiz/types";
import { Button, Card, Badge, PasswordInput } from "@yildiz/ui";
import { useAuth } from "@/lib/auth-context";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/stores/toast-store";
import { PageLoader } from "@/components/PageLoader";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerWithEmail, loginWithGoogle } = useAuth();

  const redirectParam = searchParams.get("redirect") || searchParams.get("next");
  const safeRedirect = safeRedirectPath(redirectParam, undefined, "") || null;

  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kvkkConsent, setKvkkConsent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);
    setGoogleRedirecting(false);
    try {
      const result = await loginWithGoogle(safeRedirect || undefined);
      if (result?.error) {
        setLoading(false);
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
      setGoogleRedirecting(true);
    } catch (err: unknown) {
      setLoading(false);
      setGoogleRedirecting(false);
      const message =
        err instanceof Error
          ? err.message
          : "Google ile giriş sırasında beklenmedik bir hata oluştu.";
      setError(message);
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAd = ad.trim();
    const cleanSoyad = soyad.trim();

    if (!cleanAd || !cleanSoyad) {
      const err = "Lütfen adınızı ve soyadınızı eksiksiz giriniz.";
      setError(err);
      toast.error(err);
      return;
    }

    if (!isValidTrPhone(telefon)) {
      const err = "Lütfen geçerli bir telefon numarası giriniz (Örn: 05XX XXX XX XX).";
      setError(err);
      toast.error(err);
      return;
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      const err = "Lütfen geçerli bir e-posta adresi giriniz.";
      setError(err);
      toast.error(err);
      return;
    }

    if (password.length < 8) {
      const err = "Şifre en az 8 karakter olmalıdır.";
      setError(err);
      toast.error(err);
      return;
    }

    if (!kvkkConsent) {
      const err = "Devam edebilmek için KVKK Aydınlatma ve Açık Rıza Metni'ni onaylamanız gerekmektedir.";
      setError(err);
      toast.error(err);
      return;
    }

    setLoading(true);
    const result = await registerWithEmail(cleanAd, cleanSoyad, telefon, email, password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      if (result.requiresEmailConfirmation) {
        setNeedsEmailConfirm(true);
        toast.info(
          "Kaydınız alındı! Lütfen e-posta adresinize gönderilen doğrulama bağlantısını onaylayınız."
        );
      } else {
        toast.success("Kaydınız başarıyla oluşturuldu! Hoş geldiniz.");
        setTimeout(() => {
          router.push(safeRedirect || "/profil");
        }, 2000);
      }
    } else {
      const err = result.error || "Kayıt işlemi sırasında bir hata oluştu.";
      setError(err);
      toast.error(err);
    }
  };

  const loginHref = safeRedirect
    ? `/giris?redirect=${encodeURIComponent(safeRedirect)}`
    : "/giris";

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
            Ayrıcalıklı Müşteri Kulübü
          </Badge>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary pt-1">
            Yeni Hesap Oluşturun
          </h1>
          <p className="text-xs text-text-secondary">
            Randevularınızı kolayca yönetin, özel indirim ve sadakat puanları kazanın.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 text-lg font-bold">
              ✓
            </div>
            <h2 className="font-serif text-base font-bold text-emerald-900">
              Kaydınız Başarıyla Oluşturuldu!
            </h2>
            {needsEmailConfirm ? (
              <>
                <p className="text-xs text-emerald-700">
                  Hesabınızı aktifleştirmek için <strong>{email}</strong> adresine gönderdiğimiz
                  doğrulama bağlantısına tıklayınız. Onayladıktan sonra e-posta ve şifrenizle giriş
                  yapabilirsiniz.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/giris?method=email")}
                  className="text-xs font-bold w-full"
                >
                  Giriş Sayfasına Git →
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-emerald-700">
                  Yıldız Bayan Kuaförü ailesine hoş geldiniz. Profil sayfanıza yönlendiriliyorsunuz...
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(safeRedirect || "/profil")}
                  className="text-xs font-bold w-full"
                >
                  Hemen Devam Et →
                </Button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ad ve Soyad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Adınız <span className="text-accent-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  placeholder="Örn: Ayşe"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Soyadınız <span className="text-accent-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={soyad}
                  onChange={(e) => setSoyad(e.target.value)}
                  placeholder="Örn: Yılmaz"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
              </div>
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Telefon Numaranız <span className="text-accent-gold">*</span>
              </label>
              <input
                type="tel"
                required
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
              />
              <span className="text-[10px] text-text-secondary mt-0.5 block">
                Randevu onayları ve SMS bildirimleri bu numaraya iletilir.
              </span>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                E-posta Adresi <span className="text-accent-gold">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@alanadi.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Şifre <span className="text-accent-gold">*</span>
              </label>
              <PasswordInput
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
              />
            </div>

            {/* KVKK Onay Kutusu */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="kvkk-checkbox"
                type="checkbox"
                required
                checked={kvkkConsent}
                onChange={(e) => setKvkkConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-accent-gold focus:ring-accent-gold cursor-pointer"
              />
              <label
                htmlFor="kvkk-checkbox"
                className="text-[11px] leading-relaxed text-text-secondary select-none cursor-pointer"
              >
                <span className="text-text-primary font-medium">6698 sayılı KVKK</span>{" "}
                kapsamında{" "}
                <Link
                  href="/kvkk"
                  target="_blank"
                  className="text-accent-gold font-semibold underline hover:text-text-primary"
                >
                  Kişisel Verilerin Korunması Aydınlatma Metni ve Açık Rıza Metni
                </Link>
                &apos;ni okudum, onaylıyorum.
              </label>
            </div>

            {/* Kayıt Butonu */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || googleRedirecting}
              className="w-full text-xs font-bold h-11 shadow-sm"
            >
              {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol →"}
            </Button>

            {/* Google ile Hızlı Giriş / Kayıt */}
            <div className="pt-2 border-t border-border space-y-3">
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={loading || googleRedirecting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-bg-secondary hover:bg-border-main text-xs font-semibold text-text-primary transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
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
                {googleRedirecting
                  ? "Google'a yönlendiriliyorsunuz..."
                  : "Google ile Hızlı Giriş / Kayıt Yap"}
              </button>
            </div>
          </form>
        )}

        {/* Alt Bilgi */}
        <div className="text-center pt-2 space-y-2 border-t border-border">
          <p className="text-xs text-text-secondary">
            Zaten hesabınız var mı?{" "}
            <Link href={loginHref} className="text-accent-gold font-semibold hover:underline">
              Giriş Yapın
            </Link>
          </p>
          <div>
            <Link
              href="/"
              className="text-xs text-text-secondary hover:text-accent-gold transition-colors"
            >
              ← Ana Sayfaya Geri Dön
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterForm />
    </Suspense>
  );
}
