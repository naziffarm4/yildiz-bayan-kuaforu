"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Button, Card, Badge, PasswordInput } from "@yildiz/ui";
import { toast } from "@/stores/toast-store";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    appointments,
    isLoading,
    isGoogleUser,
    initAuth,
    fetchUserAppointments,
    updateProfile,
    updatePassword,
    logout,
  } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);

  // Form State
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");

  // Şifre State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // İlk yüklemede istemci tarafını hazırla ve oturumu kontrol et
  useEffect(() => {
    setIsMounted(true);
    initAuth();
  }, [initAuth]);

  // Giriş yapmamış kullanıcıyı anında /giris sayfasına yönlendir
  useEffect(() => {
    if (isMounted && !isLoading && !user) {
      router.replace("/giris");
    }
  }, [isMounted, isLoading, user, router]);

  // Kullanıcı değiştiğinde form alanlarını ve randevuları otomatik senkronize et
  useEffect(() => {
    if (user) {
      setAd(user.ad || "");
      setSoyad(user.soyad || "");
      setEposta(user.eposta || "");

      // 0599 ile başlayan geçici Google OAuth telefon numarasını boş göster
      if (user.telefon && user.telefon.startsWith("0599")) {
        setTelefon("");
      } else {
        setTelefon(user.telefon || "");
      }

      fetchUserAppointments();
    }
  }, [user, fetchUserAppointments]);

  const isTempPhone = Boolean(user?.telefon && user.telefon.startsWith("0599"));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);

    if (!ad.trim() || !soyad.trim()) {
      const err = "Lütfen ad ve soyad alanlarını doldurunuz.";
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setSavingProfile(true);
    const res = await updateProfile({
      ad: ad.trim(),
      soyad: soyad.trim(),
      telefon: telefon.trim(),
      eposta: eposta.trim() || undefined,
    });
    setSavingProfile(false);

    if (res.success) {
      const msg = "Profil bilgileriniz başarıyla güncellendi.";
      setFeedbackMsg(msg);
      toast.success(msg);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } else {
      const err = res.error || "Profil güncellenirken bir hata oluştu.";
      setErrorMsg(err);
      toast.error(err);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);

    if (!isGoogleUser && !currentPassword) {
      const err = "Lütfen mevcut şifrenizi giriniz.";
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      const err = "Yeni şifreniz en az 6 karakterden oluşmalıdır.";
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    if (newPassword !== confirmPassword) {
      const err = "Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.";
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setSavingPassword(true);
    const res = await updatePassword(newPassword);
    setSavingPassword(false);

    if (res.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const msg = isGoogleUser
        ? "Şifreniz başarıyla tanımlandı. Artık e-posta ve şifrenizle de giriş yapabilirsiniz."
        : "Şifreniz güvenli bir şekilde güncellendi.";
      setFeedbackMsg(msg);
      toast.success(msg);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      const err = res.error || "Şifre güncellenirken bir hata oluştu.";
      setErrorMsg(err);
      toast.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  if (!isMounted || isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1 pt-8 sm:pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Üst Karşılama ve Sadakat Puanı Özeti */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-gold block">
              Müşteri &amp; Üyelik Portalı
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-text-primary mt-1">
              Merhaba, {ad || user.ad} {soyad || user.soyad}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Hesap bilgilerinizi, güvenlik ayarlarınızı ve randevu geçmişinizi yönetin.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sadakat Puanı Kutusu */}
            <div className="px-4 py-3 rounded-xl bg-white border border-border shadow-2xs text-center flex-1 sm:flex-none">
              <span className="text-[10px] uppercase font-bold text-text-secondary block">
                Sadakat Puanınız
              </span>
              <span className="font-serif text-2xl font-bold text-accent-gold">
                {user.toplamPuan ?? 0} Puan
              </span>
              <span className="text-[10px] text-emerald-700 block font-medium">
                = {(user.toplamPuan ?? 0) * 0.5} ₺ İndirim Değeri
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>

        {/* Yetkili Personel / Yönetici İse Yönetim Paneli Hızlı Geçiş Butonu */}
        {(user.rol === "Admin" || user.rol === "Calisan") && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-bg-secondary via-amber-50 to-bg-secondary border-2 border-primary/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-text-primary">
                  👑 Yetkili Personel / Yönetici Oturumu
                </span>
                <Badge variant="gold">
                  {user.rol === "Admin" ? "Admin" : "Çalışan"}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Randevu onayları, kasa POS işlemleri, stok siparişleri ve personel hakedişleri için yönetim paneline geçebilirsiniz.
              </p>
            </div>

            <Link href="/admin">
              <Button variant="primary" size="md" className="font-bold text-xs shadow-md whitespace-nowrap">
                👑 Yönetim Masasına Geç (/admin) →
              </Button>
            </Link>
          </div>
        )}

        {feedbackMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            ✓ {feedbackMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SOL: Profil Bilgileri & Şifre Belirleme/Değiştirme (7 Kolon) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Profil Formu */}
            <Card className="p-6 bg-white border-border shadow-xs space-y-4">
              <h2 className="font-serif font-bold text-lg text-text-primary border-b border-border pb-2">
                Kişisel Bilgiler
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-text-primary mb-1">Ad *</label>
                    <input
                      type="text"
                      required
                      value={ad}
                      onChange={(e) => setAd(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-accent-gold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-text-primary mb-1">Soyad *</label>
                    <input
                      type="text"
                      required
                      value={soyad}
                      onChange={(e) => setSoyad(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-accent-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-text-primary mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={telefon}
                      onChange={(e) => setTelefon(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-accent-gold"
                    />
                    {isTempPhone && (
                      <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-1.5">
                        <span>⚠️</span>
                        <span>Randevu takibi ve bilgilendirmeler için lütfen telefon numaranızı kaydediniz.</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium text-text-primary mb-1">E-posta</label>
                    <input
                      type="email"
                      value={eposta}
                      onChange={(e) => setEposta(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-accent-gold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={savingProfile}
                    className="text-xs font-bold"
                  >
                    {savingProfile ? "Kaydediliyor..." : "Bilgileri Güncelle"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Şifre Belirleme / Değiştirme Formu */}
            <Card className="p-6 bg-white border-border shadow-xs space-y-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-text-primary border-b border-border pb-2">
                  {isGoogleUser ? "Hesabınıza Şifre Belirleyin" : "Güvenlik & Şifre Değiştir"}
                </h2>
                {isGoogleUser && (
                  <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">
                    Google hesabınıza güvenli bir şifre tanımlayarak dilediğinizde e-posta ve şifrenizle de doğrudan giriş yapabilirsiniz.
                  </p>
                )}
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
                {!isGoogleUser && (
                  <div>
                    <label className="block font-medium text-text-primary mb-1">Mevcut Şifre</label>
                    <PasswordInput
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-text-primary mb-1">
                      {isGoogleUser ? "Yeni Şifre Belirleyin" : "Yeni Şifre"}
                    </label>
                    <PasswordInput
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-text-primary mb-1">Yeni Şifre (Tekrar)</label>
                    <PasswordInput
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant={isGoogleUser ? "primary" : "outline"}
                    size="sm"
                    disabled={savingPassword}
                    className="text-xs font-bold"
                  >
                    {savingPassword
                      ? "Kaydediliyor..."
                      : isGoogleUser
                        ? "Şifre Belirle"
                        : "Şifreyi Değiştir"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* SAĞ: Canlı Randevularım (5 Kolon) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 bg-white border-border shadow-xs space-y-4" id="randevular">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h2 className="font-serif font-bold text-base text-text-primary">
                    Son Randevularım
                  </h2>
                  <p className="text-[11px] text-text-secondary">
                    Planlanan ve geçmiş işlemleriniz
                  </p>
                </div>
                <Link href="/randevu" className="text-xs font-semibold text-accent-gold hover:underline">
                  + Yeni Randevu
                </Link>
              </div>

              {appointments.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-bg-secondary border border-border-main flex items-center justify-center text-primary text-xl">
                    📅
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-text-primary">
                      Henüz kayıtlı bir randevunuz bulunmamaktadır.
                    </p>
                    <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                      Lüks saç tasarımı, renklendirme ve kişisel bakım hizmetlerimiz için hemen randevunuzu oluşturun.
                    </p>
                  </div>
                  <Link href="/randevu" className="inline-block pt-1">
                    <Button variant="primary" size="sm" className="text-xs font-bold shadow-xs bg-primary hover:bg-primary-hover text-white border-0">
                      + Yeni Randevu Oluştur
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1 max-h-[460px] overflow-y-auto pr-1">
                  {appointments.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-border-main/70 bg-bg-secondary text-xs space-y-1.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary">
                          {new Date(app.tarihSaat).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge
                          variant={
                            app.durum === "Onaylandı"
                              ? "green"
                              : app.durum === "Tamamlandı"
                                ? "gold"
                                : app.durum === "İptal Edildi"
                                  ? "gray"
                                  : "amber"
                          }
                        >
                          {app.durum}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary text-[11px]">
                        <span>Toplam Süre: {app.toplamSureDakika} dk</span>
                        {app.not && (
                          <span className="truncate max-w-[130px] italic">
                            &quot;{app.not}&quot;
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
