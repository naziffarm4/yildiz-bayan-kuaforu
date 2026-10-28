"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@yildiz/ui";
import { useContent } from "../lib/content-context";

interface HeroProps {
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  const { pageTexts } = useContent();
  const hero = pageTexts.hero;
  const heroMedia = pageTexts.heroMedia;
  const heroFeatures = pageTexts.heroFeatures;

  const handleScrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("hizmetler");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative max-w-full overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-secondary pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 border-b border-border-main">
      {/* Zarif Lüks Pembe ve Turkuaz Arka Plan Işık Hüzmeleri */}
      <div className="absolute top-0 right-10 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -ml-20 -mb-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* SOL SÜTUN: BEAUTYZONE TARZI ASİMETRİK TİPOGRAFİ VE GÜÇLÜ CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Üst Rozet & İnce Ayırıcı */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-bg-primary border border-primary/30 shadow-xs backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                {hero.badge || "Kadıköy & Bağdat Caddesi Butik Salon"}
              </span>
              <span className="text-dark/30 text-xs hidden sm:inline">•</span>
              <span className="text-[11px] text-dark/70 hidden sm:inline font-semibold">
                {hero.altRozet || "Randevulu Özel Hizmet"}
              </span>
            </div>

            {/* Asimetrik Çift Katmanlı Başlık (Derin Mürdüm text-dark & Canlı Pembe text-primary) */}
            <div className="space-y-3">
              <h1 className="font-serif text-3.5xl sm:text-5xl lg:text-6xl font-extrabold text-dark tracking-tight leading-[1.12]">
                {hero.title || "Zarafet ve Ustalığın"} <br />
                <span className="text-primary font-normal italic font-serif">
                  {hero.titleHighlight || "Kişiselleştirilmiş"}
                </span>{" "}
                <span>{hero.titleEnd || "Buluşması"}</span>
              </h1>

              {/* BeautyZone İmzası: Canlı Pembe ve Turkuaz Aksan Çizgisi */}
              <div className="flex items-center gap-2 pt-1">
                <span className="h-[2.5px] w-16 bg-primary rounded-full" />
                <span className="h-[2.5px] w-5 bg-secondary rounded-full" />
                <span className="h-1.5 w-1.5 rotate-45 bg-primary" />
              </div>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-dark/80 leading-relaxed max-w-xl font-medium">
              {hero.description ||
                "YILDIZ BAYAN KUAFÖRÜ’nde her dokunuş saç dokunuza ve tarzınıza özel tasarlanır. Kusursuz balyaj, tasarım kesim, haute couture gelin saçları ve özel bakımlarla sıra beklemeden, huzur dolu lüks bir atmosferde güzelliğinizi taçlandırın."}
            </p>

            {/* CTA Butonları */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenBooking}
                className="px-8 h-12 text-xs uppercase tracking-wider font-bold shadow-md hover:shadow-lg bg-primary hover:bg-primary-hover text-white border-0 transition-all"
              >
                <span>{hero.butonRandevu || "Online Randevu Oluştur"}</span>
                <span className="ml-2 font-normal" aria-hidden="true">→</span>
              </Button>

              <a
                href="#hizmetler"
                onClick={handleScrollToServices}
                className="inline-flex items-center justify-center h-12 px-6 rounded-md text-xs uppercase tracking-wider font-bold text-dark border border-border-main bg-bg-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors shadow-xs text-center"
              >
                Hizmetleri İncele
              </a>

              <Link
                href="/galeri"
                className="inline-flex items-center justify-center h-12 px-5 rounded-md text-xs uppercase tracking-wider font-bold text-dark/70 hover:text-primary hover:underline transition-colors text-center"
              >
                {hero.butonGaleri || "Koleksiyonu Keşfet →"}
              </Link>
            </div>

            {/* 3'lü İnce Vurgu Çubuğu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border-main">
              {heroFeatures && heroFeatures.length > 0 ? (
                heroFeatures.map((feature, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-primary font-serif text-xs sm:text-sm font-bold block">
                      {feature.baslik}
                    </span>
                    <p className="text-[11px] text-dark/75 leading-tight font-medium">
                      {feature.aciklama}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-primary font-serif text-xs sm:text-sm font-bold block">
                      01. Tampon Süreli Seans
                    </span>
                    <p className="text-[11px] text-dark/75 leading-tight font-medium">
                      Her işlem arası 15 dk hijyen ve hazırlık tampon süresi.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-primary font-serif text-xs sm:text-sm font-bold block">
                      02. Tek Misafir İlkesi
                    </span>
                    <p className="text-[11px] text-dark/75 leading-tight font-medium">
                      Aynı anda birden fazla müşteriyle bölünmeden tek odak.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-primary font-serif text-xs sm:text-sm font-bold block">
                      03. 30 Dk Koruma
                    </span>
                    <p className="text-[11px] text-dark/75 leading-tight font-medium">
                      Talebiniz adınıza 30 dakika boyunca güvenle bloke edilir.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SAĞ SÜTUN: BEAUTYZONE ÇİFT ÇERÇEVELİ LÜKS GÖRSEL VE FLOATING ROZET */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Arka Plan Dekoratif Dış Çerçeve */}
            <div className="absolute -inset-3 -z-10 rounded-3xl border-2 border-primary/30 hidden sm:block pointer-events-none transform translate-x-3 translate-y-3" />

            <div className="relative w-full max-w-md h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border-2 border-primary/60 shadow-2xl bg-bg-secondary">
              <Image
                src={
                  heroMedia?.gorselUrl ||
                  "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1000&q=85"
                }
                alt={heroMedia?.baslik || "Yıldız Bayan Kuaförü Lüks Saç Tasarımı"}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
                priority
              />

              {/* Alt Karartma ve Editorial Tipografi */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-6 sm:p-7 text-white">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-primary block mb-1">
                  {heroMedia?.rozet || "Haute Coiffure 2026"}
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm">
                  {heroMedia?.baslik || "Zarif Dalgalar & Sıcak Bal Yansımaları"}
                </span>
                <span className="text-xs text-gray-200 mt-1 font-light">
                  {heroMedia?.altBaslik || "Yıldız Bayan Kuaförü Özel Koleksiyonu"}
                </span>
              </div>
            </div>

            {/* Sol Alt Yüzen VIP Deneyim Rozeti */}
            <div className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 z-20 bg-bg-primary/95 backdrop-blur-md px-4 py-3 rounded-xl border-2 border-primary/40 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-serif font-bold text-base shrink-0">
                ★
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-dark block leading-none">
                  15+ Yıl Ustalık
                </span>
                <span className="text-[10px] text-dark/70 mt-1 block font-medium">
                  Bağdat Caddesi Butik Salon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
