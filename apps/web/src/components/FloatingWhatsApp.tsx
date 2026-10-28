"use client";

import React from "react";
import { useContent } from "../lib/content-context";

export const FloatingWhatsApp: React.FC = () => {
  const { salonInfo } = useContent();
  const cleanPhone = salonInfo.telefon.replace(/\s+/g, "");
  const whatsappUrl = `https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    "Merhaba Yıldız Bayan Kuaförü, randevu ve hizmetleriniz hakkında bilgi almak istiyorum.",
  )}`;

  return (
    <aside
      aria-label="Hızlı Telefon ve WhatsApp İletişim Butonları"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-auto"
    >
      {/* 1. 📞 HEMEN ARA BUTONU (Zarif Altın / Koyu Gri Yuvarlak Buton - w-12 h-12) */}
      <a
        href={`tel:${cleanPhone}`}
        aria-label="Kuaförümüzü Telefonla Doğrudan Arayın"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-dark hover:bg-black text-white border-2 border-primary/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        title={`Telefonla Hemen Ara: ${salonInfo.telefon}`}
      >
        <svg className="w-5 h-5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>

        {/* Masaüstünde Hover İpucu */}
        <span className="hidden group-hover:sm:inline-block absolute right-14 whitespace-nowrap bg-black/85 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-md pointer-events-none transition-opacity">
          Hemen Ara ({salonInfo.telefon})
        </span>
      </a>

      {/* 2. 💬 WHATSAPP RANDEVU BUTONU (Canlı Parlayan Zümrüt Yeşili Yuvarlak Buton - w-12 h-12) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Randevu Hattı ile Görüşün"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        title="WhatsApp Doğrudan Randevu Hattı"
      >
        {/* Canlı Parlama Efekti */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border border-white" />
        </span>

        {/* Resmi WhatsApp SVG İkonu */}
        <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Masaüstünde Hover İpucu */}
        <span className="hidden group-hover:sm:inline-block absolute right-14 whitespace-nowrap bg-black/85 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-md pointer-events-none transition-opacity">
          WhatsApp Hattı
        </span>
      </a>
    </aside>
  );
};

export const FloatingActions = FloatingWhatsApp;
