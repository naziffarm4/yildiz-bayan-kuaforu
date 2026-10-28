"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Badge, PasswordInput } from "@yildiz/ui";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/stores/toast-store";
import { PageLoader } from "@/components/PageLoader";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerWithEmail } = useAuth();

  const redirectParam = searchParams.get("redirect") || searchParams.get("next");
  const safeRedirect =
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    !redirectParam.toLowerCase().startsWith("/\\")
      ? redirectParam
      : null;

  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kvkkConsent, setKvkkConsent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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

    const cleanPhone = telefon.replace(/\D/g, "");
    const isValidPhone =
      (cleanPhone.length === 11 && cleanPhone.startsWith("05")) ||
      (cleanPhone.length === 10 && cleanPhone.startsWith("5"));

    if (!isValidPhone) {
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

    if (password.length < 6) {
      const err = "Şifreniz en az 6 karakterden oluşmalıdır.";
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
      toast.success("Kaydınız başarıyla oluşturuldu! Hoş geldiniz.");
      setTimeout(() => {
        router.push(safeRedirect || "/profil");
      }, 2000);
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
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
                kapsamında Kişisel Verilerin Korunması Aydınlatma Metni&apos;ni ve Açık Rıza
                Metni&apos;ni okudum, onaylıyorum.
              </label>
            </div>

            {/* Kayıt Butonu */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full text-xs font-bold h-11 shadow-sm"
            >
              {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol →"}
            </Button>
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
