"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@yildiz/ui";

interface AboutCollageSectionProps {
  onOpenBooking: () => void;
}

export const AboutCollageSection: React.FC<AboutCollageSectionProps> = ({
  onOpenBooking,
}) => {
  const collagePhotos = [
    {
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      alt: "Yıldız Bayan Kuaförü Saç Tasarımı ve Şekillendirme",
      caption: "Haute Coiffure Tasarım",
    },
    {
      url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
      alt: "Salon İçi Lüks Detay ve Hizmet Seansı",
      caption: "Huzurlu Salon Atmosferi",
    },
    {
      url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80",
      alt: "Özel Renklendirme ve Balyaj Seansı",
      caption: "Kişiye Özel Renk Formülü",
    },
    {
      url: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80",
      alt: "Gelin Saçı ve Özel Gün Tasarımı",
      caption: "Usta Ellerden Dokunuş",
    },
  ];

  const features = [
    {
      title: "Kişiselleştirilmiş Saç Analizi",
      desc: "Ten alt tonunuza, yüz hatlarınıza ve saç dokunuza uygun özel kesim ve renklendirme formülasyonu.",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Tek Misafir İlkesi & Sıfır Bekleme",
      desc: "Aynı anda birden fazla misafirle bölünmeden, randevu saatinizde yalnızca size odaklanan butik hizmet.",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Premium Organik Ürünler & Olaplex",
      desc: "Saç sağlığını koruyan amonyaksız boyalar ve dünya standartlarında lüks bakım kompleksleri.",
      icon: (
        <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      title: "30 Dakika Koruma & Tampon Süre",
      desc: "Randevu talebiniz çalışma saatlerinde 30 dk adınıza bloke edilir; işlemler arası 15 dk hijyen tamponu uygulanır.",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-bg-secondary border-b border-border-main relative overflow-hidden">
      {/* Arka Plan Yumuşak Süsleme */}
      <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* SOL: 4'LÜ ASİMETRİK FOTOĞRAF KOLAJI (BEAUTYZONE SIGNATURE IMG-COLLAGE) */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-12 gap-3.5 sm:gap-4 items-center">
              {/* Kolaj 1. Görsel: Büyük Dikey Portre */}
              <div className="col-span-6 relative h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border-2 border-primary/40 shadow-lg bg-bg-primary group">
                <Image
                  src={collagePhotos[0].url}
                  alt={collagePhotos[0].alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 text-white">
                  <span className="text-[11px] font-serif italic text-primary font-semibold">
                    {collagePhotos[0].caption}
                  </span>
                </div>
              </div>

              {/* Kolaj Sağ Sütun: 2 Adet Görsel */}
              <div className="col-span-6 space-y-3.5 sm:space-y-4">
                {/* 2. Görsel: Salon İç Mekan */}
                <div className="relative h-[175px] sm:h-[200px] rounded-2xl overflow-hidden border border-border-main shadow-sm bg-bg-primary group">
                  <Image
                    src={collagePhotos[1].url}
                    alt={collagePhotos[1].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3 text-white">
                    <span className="text-[10px] tracking-wide text-gray-200">
                      {collagePhotos[1].caption}
                    </span>
                  </div>
                </div>

                {/* 3. Görsel: Renklendirme Detayı */}
                <div className="relative h-[175px] sm:h-[200px] rounded-2xl overflow-hidden border border-border-main shadow-sm bg-bg-primary group">
                  <Image
                    src={collagePhotos[2].url}
                    alt={collagePhotos[2].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3 text-white">
                    <span className="text-[10px] tracking-wide text-gray-200">
                      {collagePhotos[2].caption}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolaj Ortası/Altı Yüzen Kalite ve Tecrübe Rozeti */}
            <div className="absolute -bottom-5 right-4 sm:-bottom-6 sm:right-8 bg-bg-primary px-5 py-3.5 rounded-2xl border-2 border-primary/40 shadow-xl flex items-center gap-3.5 z-20">
              <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center text-primary font-serif font-bold text-lg shrink-0">
                ✦
              </div>
              <div>
                <span className="text-xs font-bold text-dark block">
                  %100 Kişiye Özel
                </span>
                <span className="text-[11px] text-dark/70 block mt-0.5 font-medium">
                  Özenli & Sakin Hizmet
                </span>
              </div>
            </div>
          </div>

          {/* SAĞ: İÇERİK VE ZARİF MADDELEME LİSTESİ */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
                Neden Bizi Seçmelisiniz?
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark leading-tight">
                Zarafetin, Ustalığın ve Huzurun Buluştuğu Butik Salon
              </h2>

              {/* Pembe ve Turkuaz Aksan Çizgisi */}
              <div className="flex items-center gap-2 pt-3">
                <span className="h-[2.5px] w-20 bg-primary rounded-full" />
                <span className="h-[2.5px] w-5 bg-secondary rounded-full" />
                <span className="h-1.5 w-1.5 rotate-45 bg-primary" />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-dark/80 leading-relaxed font-medium">
              YILDIZ BAYAN KUAFÖRÜ, Bağdat Caddesi&apos;nde kalabalık ve gürültülü salon telaşını geride bırakmanız için tasarlandı. Sıra beklemeden, yalnızca sizin için ayrılan sakin bir zaman diliminde dünya standartlarında saç tasarımının ayrıcalığını yaşayın.
            </p>

            {/* Maddeleme Listesi (BeautyZone Feature Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {features.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-bg-primary border border-border-main shadow-2xs hover:border-primary/60 hover:shadow-sm transition-all space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-secondary border border-primary/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-sm font-bold text-dark">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-dark/75 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Aksiyon Butonları */}
            <div className="pt-4 flex flex-wrap items-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenBooking}
                className="px-8 shadow-sm text-xs uppercase tracking-wider font-bold bg-primary hover:bg-primary-hover text-white border-0"
              >
                Hemen Randevu Al
              </Button>
              <Link href="/hakkimizda">
                <Button variant="outline" size="lg" className="px-6 text-xs uppercase tracking-wider font-bold text-dark border-border-main hover:border-primary hover:text-primary">
                  Hikayemizi Keşfedin →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
