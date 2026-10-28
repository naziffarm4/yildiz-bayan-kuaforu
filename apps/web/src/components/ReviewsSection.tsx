"use client";

import React from "react";
import type { CustomerReview } from "@yildiz/types";
import { useContent } from "../lib/content-context";

interface ReviewsSectionProps {
  reviews: CustomerReview[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  const { pageTexts } = useContent();
  const reviewsTexts = pageTexts.reviewsSection;

  const googleRating = reviewsTexts?.googleRating ?? 4.9;
  const googleReviewCount = reviewsTexts?.googleReviewCount ?? 14;
  const googleWriteReviewUrl =
    reviewsTexts?.googleWriteReviewUrl ||
    "https://search.google.com/local/writereview?placeid=ChIJR_wdvgizzBQR0tN_pKYFp3M";

  return (
    <section id="yorumlar" className="relative py-20 sm:py-24 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary overflow-hidden border-b border-border-main">
      {/* Arka Plan Dekoratif Parıltılar */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bölüm Başlığı & Canlı Google İstatistiği */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
            {reviewsTexts?.rozet || "Misafir Deneyimleri"}
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark tracking-tight">
            {reviewsTexts?.baslik || "Değerli Misafirlerimizin Yorumları"}
          </h2>

          {/* BeautyZone İmzası Pembe & Turkuaz Çizgi */}
          <div className="flex items-center justify-center gap-2 pt-3">
            <span className="h-[2.5px] w-16 bg-primary rounded-full" />
            <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
            <span className="h-[2.5px] w-16 bg-primary rounded-full" />
          </div>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-dark/80 leading-relaxed font-medium">
            {reviewsTexts?.aciklama ||
              "Salonumuzda ağırladığımız misafirlerimizin samimi değerlendirmeleri ve Google puanlarımız."}
          </p>

          {/* Lüks Google Puanı & Yorum Bırakma Butonu */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-bg-primary border border-border-main shadow-xs text-xs font-bold text-dark">
              {/* Google Renkli İkonu */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
              <div className="flex text-amber-500 gap-0.5 text-xs drop-shadow-[0_1px_1px_rgba(229,169,60,0.3)]" aria-hidden="true">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <span>
                <strong>Google Puanı: {googleRating} / 5.0</strong>
                <span className="text-dark/60 ml-1.5 hidden sm:inline font-normal">
                  ({googleReviewCount} Doğrulanmış Misafir Değerlendirmesi)
                </span>
                <span className="text-dark/60 ml-1 sm:hidden font-normal">
                  ({googleReviewCount})
                </span>
              </span>
            </div>

            <a
              href={googleWriteReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/15 hover:bg-primary text-primary hover:text-white font-bold text-xs tracking-wide border border-primary/40 transition-all shadow-xs"
            >
              <span>Google&apos;da Bizi Değerlendirin</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Dengeli ve Lüks Yorum Kartları Izgarası */}
        <div className="flex flex-wrap justify-center gap-6 lg:gap-7">
          {reviews.map((rev) => {
            const initials =
              rev.musteriAdi
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "M";

            const isGoogle = rev.kaynak === "Google";

            return (
              <div
                key={rev.id}
                className="w-full md:w-[calc(50%-14px)] lg:w-[calc(33.333%-19px)] max-w-md flex"
              >
                <div className="group w-full flex flex-col justify-between bg-bg-primary rounded-2xl p-6 sm:p-7 border border-border-main hover:border-primary shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
                  {/* Arka Plan Dekoratif Filigran Tırnak İşareti */}
                  <span
                    className="absolute top-3 right-5 font-serif text-6xl text-primary/15 select-none pointer-events-none leading-none group-hover:text-primary/25 transition-colors"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>

                  {/* Arka Plan Üst Köşe Hafif Pembe Parıltısı */}
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-primary/20 transition-all" />

                  {/* Kart Üst Alanı: Avatar + Müşteri Bilgisi + Doğrulama */}
                  <div>
                    <div className="flex items-center gap-3.5 relative z-10">
                      {/* Monogram Baş Harf Avatarı */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-bg-secondary to-pink-50 text-primary font-serif font-bold text-sm flex items-center justify-center border border-primary/30 shadow-xs shrink-0 ring-2 ring-white">
                        {initials}
                      </div>

                      {/* Müşteri Adı & Doğrulama Rozeti */}
                      <div className="min-w-0 flex-1">
                        <div className="font-serif text-base font-bold text-dark tracking-tight truncate">
                          {rev.musteriAdi}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-dark/70 mt-0.5 font-medium">
                          {isGoogle ? (
                            <>
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span className="font-semibold text-emerald-700">Google Doğrulanmış</span>
                            </>
                          ) : (
                            <span className="font-bold text-primary">Salon Misafiri</span>
                          )}
                          <span className="text-gray-300">•</span>
                          <span>{rev.tarih}</span>
                        </div>
                      </div>
                    </div>

                    {/* Yıldız Puanı & Hizmet Rozeti */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border-main/50">
                      <div className="flex items-center gap-1.5" aria-label={`${rev.puan} yıldız`}>
                        <div className="flex text-amber-500 text-sm gap-0.5">
                          {Array.from({ length: rev.puan }).map((_, i) => (
                            <span key={i} className="leading-none drop-shadow-[0_1px_1px_rgba(229,169,60,0.3)]">★</span>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-dark ml-0.5">
                          {rev.puan}.0
                        </span>
                      </div>

                      {rev.hizmetTuru && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 truncate max-w-[170px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="truncate">{rev.hizmetTuru}</span>
                        </span>
                      )}
                    </div>

                    {/* Yorum İçeriği */}
                    {rev.yorum && rev.yorum.trim() ? (
                      <p className="mt-4 text-xs sm:text-sm text-dark/85 leading-relaxed italic relative z-10 line-clamp-4 font-medium">
                        &ldquo;{rev.yorum}&rdquo;
                      </p>
                    ) : (
                      <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-pink-50 via-bg-primary to-pink-50 border border-primary/20 relative z-10">
                        <p className="text-xs text-dark/75 leading-relaxed italic font-medium">
                          &ldquo;Google Haritalar üzerinden 5 yıldızlı tam puan vererek salonumuzun hizmet kalitesini ve misafirperverliğini tavsiye etti.&rdquo;
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-primary">
                          <span>★</span>
                          <span>Kusursuz Misafir Deneyimi</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kart Alt Alanı: Doğrulanmış Ziyaret & Orijinal Google Bağlantısı */}
                  <div className="mt-6 pt-3.5 border-t border-border-main/50 flex items-center justify-between text-xs font-medium">
                    <span className="text-[11px] text-dark/65 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Doğrulanmış Değerlendirme
                    </span>

                    {rev.googleReviewUrl && (
                      <a
                        href={rev.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Google&apos;da Gör
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
