"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@yildiz/ui";
import { useAppStore } from "@/stores/app-store";

interface SplitBannerSectionProps {
  onOpenBooking: () => void;
}

export const SplitBannerSection: React.FC<SplitBannerSectionProps> = ({
  onOpenBooking,
}) => {
  const about = useAppStore((s) => s.pageTexts.about);

  return (
    <section className="py-0 border-b border-border-main overflow-hidden">
      {/* 1. BLOK: BEYAZ & DİKEY GÖRSEL SPLIT DÜZENİ */}
      <div className="bg-bg-primary py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* SOL SÜTUN: EDİTORİAL DİKEY GÖRSEL & LÜKS ÇERÇEVE */}
            <div className="lg:col-span-6 relative">
              <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl bg-bg-secondary group">
                <Image
                  src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=85"
                  alt="Özel Gün ve Haute Coiffure Gelin Saçı Tasarımı"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Karartma ve Alt Başlık */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-primary block mb-1">
                    Haute Coiffure Bridal
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    Kusursuz Gelin & Özel Gün Tasarımları
                  </h3>
                  <p className="text-xs text-gray-200 mt-1">
                    Duvak, taç ve yüz analitiğine dayalı kusursuz prova seansları.
                  </p>
                </div>
              </div>

              {/* Pembe Köşe Vurgusu */}
              <div className="absolute -top-3 -left-3 w-16 h-16 border-t-2 border-l-2 border-primary rounded-tl-2xl pointer-events-none hidden sm:block" />
            </div>

            {/* SAĞ SÜTUN: İÇERİK & GÜÇLÜ İSTATİSTİKLER */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
                  Özel Gün & Gelin Suiti
                </span>
                <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark leading-tight">
                  En Özel Gününüzde Kusursuz ve Eşsiz Bir İmza
                </h2>

                <div className="flex items-center gap-2 pt-3">
                  <span className="h-[2.5px] w-20 bg-primary rounded-full" />
                  <span className="h-[2.5px] w-5 bg-secondary rounded-full" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-dark/80 leading-relaxed font-medium">
                Düğün, nişan ve özel davetlerinizde tüm detaylar titizlikle planlanır. Gelin saçınız; gelinlik modeliniz, duvağınız ve organizasyon konseptinize uyumlu şekilde provalı seanslarla hayata geçirilir.
              </p>

              {/* 3 İstatistik / Güven Rozeti */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-main text-center shadow-2xs">
                  <span className="font-serif text-2xl font-extrabold text-primary block">
                    15+
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-dark/75 font-semibold mt-0.5 block">
                    Yıllık Ustalık
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-main text-center shadow-2xs">
                  <span className="font-serif text-2xl font-extrabold text-secondary block">
                    %100
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-dark/75 font-semibold mt-0.5 block">
                    Kişiye Özel İlgi
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-main text-center shadow-2xs">
                  <span className="font-serif text-2xl font-extrabold text-primary block">
                    0 Dk
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-dark/75 font-semibold mt-0.5 block">
                    Bekleme Garantisi
                  </span>
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="pt-3 flex flex-wrap items-center gap-3.5">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onOpenBooking}
                  className="px-8 shadow-sm text-xs uppercase tracking-wider font-bold bg-primary hover:bg-primary-hover text-white border-0"
                >
                  Gelin Seansı Planla →
                </Button>
                <Link href="/galeri">
                  <Button variant="outline" size="lg" className="px-6 text-xs uppercase tracking-wider font-bold text-dark border-border-main hover:border-primary hover:text-primary">
                    Gelin Koleksiyonunu Gör
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BLOK: BEAUTYZONE CANLI PEMBE (bg-primary) FELSEFE VE RANDEVU BANTI */}
      <div className="bg-primary text-white py-14 sm:py-18 relative overflow-hidden">
        {/* Zarif Turkuaz Arka Plan Parıltısı */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="text-white text-2xl select-none" aria-hidden="true">
            ✦ ✦ ✦
          </span>

          <blockquote className="font-serif text-xl sm:text-2xl lg:text-3xl font-normal italic text-white max-w-3xl mx-auto leading-relaxed drop-shadow-xs">
            &ldquo;{about?.quote || "Güzellik, aceleye getirilmeyecek kadar kutsal bir sanattır."}&rdquo;
          </blockquote>

          <div className="pt-1">
            <span className="text-xs uppercase tracking-[0.25em] text-white font-extrabold block">
              {about?.founder || "Yıldız Bayan Kuaförü — Kurucu & Master Stilist"}
            </span>
            <span className="text-[11px] text-white/85 mt-1 block font-medium">
              Bağdat Caddesi Butik Salon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
