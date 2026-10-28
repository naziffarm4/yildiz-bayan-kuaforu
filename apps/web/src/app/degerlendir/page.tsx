"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { useContent } from "@/lib/content-context";
import { Card, Button, Badge } from "@yildiz/ui";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

function DegerlendirContent() {
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref") || "";
  const initialName = searchParams.get("name") || "";
  const serviceName = searchParams.get("service") || "Salon Deneyimi";

  const { pageTexts, isLoading: isContentLoading } = useContent();

  const [customerName, setCustomerName] = useState(initialName);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFunnel, setSubmittedFunnel] = useState<"google" | "internal" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const googleWriteReviewUrl =
    pageTexts.reviewsSection?.googleWriteReviewUrl ||
    "https://search.google.com/local/writereview?placeid=ChIJR_wdvgizzBQR0tN_pKYFp3M";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg("Lütfen adınızı ve soyadınızı belirtiniz.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_adi: customerName.trim(),
          puan: rating,
          yorum: comment.trim(),
          hizmet_turu: serviceName,
          randevu_id: refId || null,
          kaynak: "Hizmet Sonrası",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Değerlendirme kaydedilemedi.");
      }

      setSubmittedFunnel(json.funnel === "google" ? "google" : "internal");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isContentLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1 pt-8 sm:pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        {/* Başlık ve Karşılama */}
        <div className="text-center space-y-3 mb-8">
          <Badge variant="gold">Haute Coiffure Deneyiminiz</Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-dark">
            {initialName ? `Sayın ${initialName}` : "Değerli Misafirimiz"}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            Bugün salonumuzda aldığınız <strong className="text-text-primary">{serviceName}</strong> hizmetini
            değerlendirerek zarafet ve hizmet kalitemizi mükemmelleştirmemize yardımcı olun.
          </p>
        </div>

        {/* Başarılı Gönderim Sonrası Kartlar */}
        {submittedFunnel ? (
          <Card className="p-8 sm:p-10 bg-bg-primary border-border-main shadow-lg rounded-2xl text-center space-y-6 animate-fadeIn">
            {submittedFunnel === "google" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/15 text-primary text-3xl flex items-center justify-center mx-auto shadow-inner">
                  ✨
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-accent-gold block">
                    Muhteşem Bir Deneyim
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
                    Geri Bildiriminiz İçin Teşekkür Ederiz
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
                    Yıldız Bayan Kuaförü kalitesini ve memnuniyetinizi Google Haritalar üzerinde de tek tıkla paylaşarak diğer misafirlerimize ilham vermek ister misiniz?
                  </p>
                </div>

                {/* Google Yönlendirme Kartı */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-bg-primary via-bg-secondary to-bg-primary border border-primary/40 shadow-xs space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-serif font-bold text-sm text-dark">
                      Google Doğrulanmış Misafir Değerlendirmesi
                    </span>
                  </div>

                  <a
                    href={googleWriteReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.99]"
                  >
                    <span>Google&apos;da Gör ve Paylaş</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>

                <div className="pt-2">
                  <Link href="/">
                    <Button variant="outline" size="sm" className="text-xs">
                      Ana Sayfaya Dön
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-accent-gold/10 text-accent-gold text-2xl flex items-center justify-center mx-auto">
                  🌸
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-accent-gold block">
                    Geri Bildiriminiz Alındı
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-text-primary">
                    Düşünceleriniz Bizim İçin Değerli
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
                    Geri bildiriminiz doğrudan yönetim ekibimize iletilmiştir. Salonumuzdaki deneyiminizi kusursuzlaştırmak adına en kısa sürede sizinle iletişime geçeceğiz.
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <Link href="/">
                    <Button variant="primary" size="sm" className="text-xs">
                      Ana Sayfaya Dön
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </Card>
        ) : (
          /* Değerlendirme Formu */
          <Card className="p-6 sm:p-8 bg-bg-primary border-border-main shadow-sm rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ad Soyad */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Adınız &amp; Soyadınız *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Örn: Ayşe Demir"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-bg-secondary text-xs sm:text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* 1 - 5 Yıldız Seçimi */}
              <div className="text-center space-y-2 py-3 bg-bg-secondary rounded-xl border border-border-main">
                <span className="text-xs font-semibold text-text-primary block">
                  Genel Deneyiminizden Ne Kadar Memnun Kaldınız?
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`text-3xl sm:text-4xl transition-transform hover:scale-125 focus:outline-none ${
                          active ? "text-amber-500 drop-shadow-xs" : "text-gray-300"
                        }`}
                        aria-label={`${star} Yıldız`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-primary block">
                  {rating === 5 && "Kusursuz / Mükemmel"}
                  {rating === 4 && "Çok İyi"}
                  {rating === 3 && "Ortalama"}
                  {rating === 2 && "Geliştirilmeli"}
                  {rating === 1 && "Memnun Kalmadım"}
                </span>
              </div>

              {/* Yorum Metni */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Deneyiminiz Hakkında Görüşleriniz
                  <span className="text-[10px] text-text-secondary font-normal ml-1">
                    (İsteğe bağlı)
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Salonumuzun hijyeni, stilistimizin ilgisi ve aldığınız hizmet hakkında düşüncelerinizi birkaç cümleyle paylaşın..."
                  className="w-full px-4 py-3 rounded-xl border border-border-main bg-bg-secondary text-xs sm:text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Gönder Butonu */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold shadow-md text-xs sm:text-sm h-12"
              >
                {isSubmitting ? "Kaydediliyor..." : "✓ Değerlendirmeyi Gönder"}
              </Button>
            </form>
          </Card>
        )}
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

export default function DegerlendirPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DegerlendirContent />
    </Suspense>
  );
}
