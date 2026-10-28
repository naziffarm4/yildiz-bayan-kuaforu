"use client";

import React, { useState } from "react";
import type { ServiceItem } from "@yildiz/types";
import { Card, Button, Badge } from "@yildiz/ui";
import { useContent } from "../lib/content-context";

interface ServiceCatalogProps {
  services: ServiceItem[];
  onSelectService: (serviceId: string) => void;
}

// BeautyZone Kuaför Salonu İkonları (text-primary Pembe & text-secondary Turkuaz)
function getServiceIcon(kategori: string, ad: string) {
  const normalized = (kategori + " " + ad).toLowerCase();

  if (normalized.includes("kesim") || normalized.includes("fön") || normalized.includes("tasarım")) {
    return (
      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0M12 12L9.121 9.121m0 5.758a3 3 0 10-4.242 4.242 3 3 0 004.242-4.242z" />
      </svg>
    );
  }

  if (normalized.includes("boya") || normalized.includes("röfle") || normalized.includes("balyaj") || normalized.includes("renk")) {
    return (
      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 5 5 0 015-5c1 0 1.5.5 2 1s1.5 1 2.5 1 2-.5 3-1.5 2-2 3.5-2 2.5.5 3 1.5 1 2 2 3a4 4 0 01-4 4H7z" />
      </svg>
    );
  }

  if (normalized.includes("gelin") || normalized.includes("özel gün") || normalized.includes("topuz") || normalized.includes("örgü")) {
    return (
      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }

  if (normalized.includes("keratin") || normalized.includes("botoks") || normalized.includes("bakım") || normalized.includes("tedavi")) {
    return (
      <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  }

  if (normalized.includes("manikür") || normalized.includes("pedikür") || normalized.includes("el") || normalized.includes("ayak")) {
    return (
      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21a9 9 0 110-18 9 9 0 010 18z" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  services,
  onSelectService,
}) => {
  const { pageTexts } = useContent();
  const servicesTexts = pageTexts.servicesSection;
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  const categories = [
    "Tümü",
    "Saç Tasarımı",
    "Renklendirme",
    "Bakım & Tedavi",
    "Özel Gün",
    "El & Ayak Bakımı",
  ];

  const filteredServices =
    selectedCategory === "Tümü"
      ? services
      : services.filter((s) => s.kategori === selectedCategory);

  return (
    <section id="hizmetler" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* BEAUTYZONE TARZI BAŞLIK & PEMBE AKSAN */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
          {servicesTexts?.rozet || "Özel Hizmet Kataloğu"}
        </span>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark">
          {servicesTexts?.baslik || "Ustalıkla Sunulan Hizmetlerimiz"}
        </h2>

        {/* Pembe ve Turkuaz Çizgi Aksanı */}
        <div className="flex items-center justify-center gap-2 pt-3">
          <span className="h-[2.5px] w-16 bg-primary rounded-full" />
          <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
          <span className="h-[2.5px] w-16 bg-primary rounded-full" />
        </div>

        <p className="mt-4 text-xs sm:text-sm md:text-base text-dark/80 leading-relaxed font-medium">
          {servicesTexts?.aciklama ||
            "Tüm işlemlerimizde en kaliteli ürünler ve güncel saç tasarım teknikleri uygulanmaktadır. İstediğiniz hizmeti seçerek tek tıkla online randevunuza ekleyebilirsiniz."}
        </p>
      </div>

      {/* Kategori Filtre Butonları (Pill Tabs) */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-12" role="tablist">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "bg-bg-primary text-dark border border-border-main hover:text-primary hover:border-primary"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Hizmet Kartları Grid (BeautyZone İkon & Lüks Kart Mimarisi - Şartname Madde 11: Fiyatlar Gizli) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {filteredServices.map((service) => (
          <Card
            key={service.id}
            className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-bg-primary border border-border-main hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          >
            <div>
              {/* Kart Üst Başlık: İkon + Kategori + Tahmini Süre */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-primary/30 flex items-center justify-center shadow-2xs group-hover:scale-105 group-hover:bg-primary/10 transition-all">
                  {getServiceIcon(service.kategori, service.ad)}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="gray" className="text-[11px] font-semibold">
                    {service.kategori}
                  </Badge>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-dark bg-bg-secondary px-2.5 py-1 rounded-full border border-border-main shadow-2xs">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{service.tahminiSureDakika} dk</span>
                  </span>
                </div>
              </div>

              {/* Hizmet Adı & Açıklama */}
              <h3 className="font-serif text-lg sm:text-xl font-bold text-dark mb-2 group-hover:text-primary transition-colors">
                {service.ad}
              </h3>
              <p className="text-xs sm:text-sm text-dark/75 leading-relaxed line-clamp-3 font-medium">
                {service.aciklama ||
                  "Kişiye özel saç analizi, hijyenik seans ve dünya standartlarında birinci sınıf ürünlerle uygulanan özel saç tasarımı."}
              </p>
            </div>

            {/* Kart Altı: Buton & Seans Notu */}
            <div className="mt-6 pt-4 border-t border-border-main/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-dark/70 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Kişiye Özel Seans</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectService(service.id)}
                className="text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-2xs"
                aria-label={`${service.ad} hizmetini randevuya ekle`}
              >
                + Randevuya Ekle
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 text-dark/60">
          <p className="text-sm">Bu kategoride şu anda listelenen aktif hizmet bulunmamaktadır.</p>
        </div>
      )}
    </section>
  );
};
