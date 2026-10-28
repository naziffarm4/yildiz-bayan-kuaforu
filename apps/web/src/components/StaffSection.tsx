"use client";

import React from "react";
import Image from "next/image";
import { Card, Badge, Button } from "@yildiz/ui";
import { useContent } from "../lib/content-context";

interface StaffSectionProps {
  onOpenBooking: () => void;
}

export const StaffSection: React.FC<StaffSectionProps> = ({
  onOpenBooking,
}) => {
  const { pageTexts } = useContent();
  const artist = pageTexts.artist;

  return (
    <section id="ekibimiz" className="py-20 sm:py-24 bg-bg-secondary border-y border-border-main">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="gold">{artist.ustRozet}</Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-dark">
            {artist.anaBaslik}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {artist.altBaslik}
          </p>
        </div>

        {/* Lüks Editorial Stilist Kartı */}
        <Card className="p-8 sm:p-12 bg-bg-primary border border-border-main rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Sol: Sanatçı Portresi */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-xl bg-bg-secondary">
                <Image
                  src={artist.gorselUrl}
                  alt={`${artist.adSoyad} - ${artist.unvan}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center p-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    {artist.gorselRozet}
                  </span>
                </div>
              </div>
            </div>

            {/* Sağ: Felsefe, Unvan & VIP Randevu Aksiyonu */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary block">
                  {artist.etiket}
                </span>
                <h3 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark mt-1">
                  {artist.adSoyad}
                </h3>
                <p className="text-xs font-medium text-text-secondary mt-1">
                  {artist.unvan}
                </p>
              </div>

              <blockquote className="font-serif text-base sm:text-lg italic text-dark border-l-2 border-primary pl-4 py-1 leading-snug">
                &ldquo;{artist.alintiSoz}&rdquo;
              </blockquote>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {artist.biyografi}
              </p>

              {/* 3 VIP Özellik */}
              {artist.vipOzellikler && artist.vipOzellikler.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border-main">
                  {artist.vipOzellikler.map((vip, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-bg-secondary border border-border-main">
                      <span className="text-primary font-bold text-xs block">{vip.baslik}</span>
                      <span className="text-[11px] text-text-secondary mt-0.5 block leading-tight">
                        {vip.aciklama}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onOpenBooking}
                  className="px-8 shadow-md text-xs uppercase tracking-wider font-bold"
                >
                  {artist.butonMetni}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
