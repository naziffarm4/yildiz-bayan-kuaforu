import React from "react";
import { Card } from "@yildiz/ui";

export interface ContactMapEmbedProps {
  adres: string;
  googleHaritaUrl: string;
  transitNote: string;
}

export function ContactMapSkeleton() {
  return (
    <Card className="p-0 overflow-hidden bg-bg-primary border-border shadow-xs animate-pulse">
      <div className="p-4 bg-bg-secondary border-b border-border flex items-center justify-between">
        <div className="w-36 h-3.5 rounded bg-border-main" />
        <div className="w-20 h-3 rounded bg-border-main" />
      </div>
      <div className="h-56 bg-bg-secondary flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-12 h-12 rounded-full bg-border-main" />
        <div className="w-48 h-3.5 rounded bg-border-main" />
        <div className="w-64 h-3 rounded bg-border-main/70" />
      </div>
    </Card>
  );
}

export function ContactMapEmbed({ adres, googleHaritaUrl, transitNote }: ContactMapEmbedProps) {
  // Google Maps embed URL
  const encodedAddress = encodeURIComponent(adres || "Bağdat Caddesi No: 342, Kadıköy / İstanbul");
  const embedSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <Card className="p-0 overflow-hidden bg-bg-primary border-border shadow-xs">
      <div className="p-4 bg-bg-secondary border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <span>📍</span> Google Harita &amp; Yol Tarifi
        </span>
        <a
          href={googleHaritaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 transition-colors"
        >
          Haritada Aç ↗
        </a>
      </div>

      {/* Harita Iframe Embed */}
      <div className="relative w-full h-56 bg-bg-secondary overflow-hidden">
        <iframe
          title="Yıldız Bayan Kuaförü Lokasyon Haritası"
          src={embedSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full grayscale-[0.2] contrast-[1.05]"
        />
      </div>

      {/* Adres ve Ulaşım Açıklaması */}
      <div className="p-4 bg-bg-secondary border-t border-border text-center space-y-1">
        <span className="font-serif font-bold text-xs sm:text-sm text-text-primary block">
          {adres}
        </span>
        <p className="text-[11px] text-text-secondary leading-relaxed max-w-md mx-auto">
          {transitNote}
        </p>
      </div>
    </Card>
  );
}
