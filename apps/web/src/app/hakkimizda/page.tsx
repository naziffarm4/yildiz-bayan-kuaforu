"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Button, Badge } from "@yildiz/ui";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { useAppStore } from "@/stores/app-store";

export default function AboutPage() {
  const bootstrapApp = useAppStore((s) => s.bootstrapApp);
  const pageTexts = useAppStore((s) => s.pageTexts);
  const isInitialLoaded = useAppStore((s) => s.isInitialLoaded);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const about = pageTexts.about;

  React.useEffect(() => {
    bootstrapApp();
  }, [bootstrapApp]);

  if (!isInitialLoaded && isRefreshing) {
    return <PageLoader variant="modal" message="Hakkımızda sayfası yükleniyor..." />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Editorial Üst Manşet */}
        <section className="py-20 sm:py-28 bg-bg-secondary border-b border-border-main">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="gold">Editorial Story &amp; Vision</Badge>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-dark leading-tight">
              &ldquo;{about.quote}&rdquo;
            </h1>
            <p className="text-sm sm:text-base text-text-secondary font-serif italic max-w-xl mx-auto">
              {about.founder}
            </p>
          </div>
        </section>

        {/* Dergi Röportajı Mizanpajı */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Sol Görsel (Editorial Portre) */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-border shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80"
                  alt="Yıldız Aksoy Salon Atmosferi"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl border border-border shadow-lg hidden sm:block max-w-xs">
                <span className="text-[11px] font-bold text-accent-gold uppercase tracking-wider block mb-1">
                  Bağdat Caddesi
                </span>
                <p className="text-xs text-text-secondary leading-snug">
                  Her dokunuşta sanatsal vizyon, her randevuda kişiselleştirilmiş dinginlik.
                </p>
              </div>
            </div>

            {/* Sağ Metin Alanı */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase font-bold tracking-[0.25em] text-accent-gold block">
                {about.manifestoTitle}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-text-primary leading-tight">
                {about.storyTitle}
              </h2>
              <div className="text-xs sm:text-sm text-text-secondary leading-relaxed space-y-4">
                <p>{about.storyText}</p>
                <p>
                  Yıldız Bayan Kuaförü&apos;nde misafirlerimiz kapıdan girdikleri andan itibaren zamansız bir
                  estetik yolculuğuna çıkarlar. Kullanılan organik İnoa boyalar, Olaplex bağ koruyucu protokolleri
                  ve aromaterapik saç bakım masajları ile saçınızın canlılığını korumayı taahhüt ediyoruz.
                </p>
              </div>

              {/* 3 Temel İlke Sütunları */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border">
                <div className="space-y-1">
                  <span className="font-serif text-lg font-bold text-text-primary block">
                    01. Zarafet
                  </span>
                  <p className="text-[11px] text-text-secondary">
                    Abartıdan uzak, doğal saç dokusunu ve yüz mimarisini ön plana çıkaran tasarımlar.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-serif text-lg font-bold text-text-primary block">
                    02. Hijyen &amp; Konfor
                  </span>
                  <p className="text-[11px] text-text-secondary">
                    Tıbbi otoklav sterilizasyonu, tek kullanımlık ürünler ve sakinleştirici müzik eşliği.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-serif text-lg font-bold text-text-primary block">
                    03. Zaman Disiplini
                  </span>
                  <p className="text-[11px] text-text-secondary">
                    Her randevu arasında 15 dakikalık tampon süre ile beklemesiz koltuk garantisi.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/randevu">
                  <Button variant="primary" size="md">
                    Kişisel Seansınızı Planlayın →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
