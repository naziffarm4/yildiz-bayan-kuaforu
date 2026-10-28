"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Card, Button, Badge } from "@yildiz/ui";
import { useAppStore } from "@/stores/app-store";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export default function ServicesPage() {
  const services = useAppStore((s) => s.services);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const pageTexts = useAppStore((s) => s.pageTexts);
  const servicesTexts = pageTexts.servicesSection;

  const [activeCategory, setActiveCategory] = useState<string>("Tümü");

  // Canlı hizmetlerden dinamik benzersiz kategori listesi
  const dynamicCategories = Array.from(
    new Set(services.map((s) => s.kategori).filter(Boolean)),
  );
  const categories = ["Tümü", ...dynamicCategories];

  const filteredServices =
    activeCategory === "Tümü"
      ? services
      : services.filter((s) => s.kategori === activeCategory);

  if (isRefreshing && services.length === 0) {
    return <PageLoader variant="modal" message="Hizmetler yükleniyor..." />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Editorial Başlık (Supabase CMS Metinleri) */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary block">
              {servicesTexts?.rozet || "Haute Coiffure Menüsü"}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-dark">
              {servicesTexts?.baslik || "Özel Bakım & Tasarım Hizmetlerimiz"}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {servicesTexts?.aciklama ||
                "Her saç tipi eşsizdir. Salonumuzda tüm işlemler, saçınızın sağlığı ve doğal dokusu korunarak dünyaca ünlü profesyonel ürünlerle gerçekleştirilir."}
            </p>
          </div>
        </section>

        {/* Kategori Seçici */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-center gap-2 pb-8 border-b border-border-main/80">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-border-main"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Hizmet Kartları Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
            {filteredServices.length === 0 ? (
              <div className="col-span-full py-16 text-center text-text-secondary">
                <span className="text-3xl block mb-2">✂️</span>
                <p className="font-serif text-base font-bold text-dark">
                  Bu kategoride hizmet bulunmuyor.
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Lütfen diğer kategorileri inceleyiniz veya danışma hattımızla iletişime geçiniz.
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="group flex flex-col justify-between bg-bg-primary border border-border-main rounded-2xl shadow-xs hover:border-primary hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Kart Üst Alanı: Lüks Hizmet Fotoğrafı */}
                  <div className="relative h-52 w-full overflow-hidden bg-bg-secondary">
                    {service.gorselUrl ? (
                      <Image
                        src={service.gorselUrl}
                        alt={service.ad}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/30 font-serif text-4xl">
                        ✂️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Fotoğraf Üzerindeki Rozetler */}
                    <div className="absolute top-3.5 left-3.5">
                      <Badge variant="gold" className="shadow-xs backdrop-blur-xs bg-bg-primary/90 font-medium">
                        {service.kategori}
                      </Badge>
                    </div>

                    <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{service.tahminiSureDakika} dk</span>
                    </div>
                  </div>

                  {/* Kart Gövdesi: Başlık, Açıklama */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-dark tracking-tight group-hover:text-primary transition-colors">
                        {service.ad}
                      </h3>
                      {service.aciklama && (
                        <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3">
                          {service.aciklama}
                        </p>
                      )}
                    </div>

                    {/* Seans Bilgisi ve Randevu Butonu */}
                    <div className="pt-4 border-t border-border-main/50 flex items-center justify-between gap-3">
                      <div className="text-xs text-text-secondary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="font-medium text-[11px] text-text-secondary">
                          Tampon Süreli Seans
                        </span>
                      </div>

                      <Link href={`/randevu?service=${service.id}`}>
                        <Button variant="primary" size="sm" className="text-xs font-semibold px-4 shadow-xs bg-primary hover:bg-primary-hover text-white border-0">
                          Randevu Al →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Alt Bilgi & Danışma Kutusu */}
          <div className="mt-16 p-6 rounded-2xl bg-bg-secondary border border-border-main flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-text-secondary space-y-1">
              <span className="font-bold text-text-primary block text-sm font-serif">
                Özel Danışmanlık &amp; Saç Analizi:
              </span>
              <p>
                Renk değişimi veya komple röfle öncesinde saç uzmanlarımızla görüşmek için salonumuzu arayabilir veya doğrudan randevu alabilirsiniz.
              </p>
            </div>
            <Link href="/iletisim">
              <Button variant="outline" size="sm" className="text-xs font-semibold shrink-0">
                Bize Ulaşın
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
