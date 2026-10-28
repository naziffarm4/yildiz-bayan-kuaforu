"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AppointmentItem } from "@yildiz/types";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AboutCollageSection } from "@/components/AboutCollageSection";
import { ServiceCatalog } from "@/components/ServiceCatalog";
import { SplitBannerSection } from "@/components/SplitBannerSection";
import { StaffSection } from "@/components/StaffSection";
import { AppointmentTracker } from "@/components/AppointmentTracker";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/stores/toast-store";
import { Button, Badge, BookingWizardModal } from "@yildiz/ui";

export default function HomePage() {
  const services = useAppStore((s) => s.services);
  const gallery = useAppStore((s) => s.gallery);
  const reviews = useAppStore((s) => s.reviews);
  const pageTexts = useAppStore((s) => s.pageTexts);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Lookbook vitrin fotoğrafları (Dinamik galeriden ilk 3'ü)
  const mainLookbookPhoto = gallery[0];
  const sideLookbookPhoto1 = gallery[1] || gallery[0];
  const sideLookbookPhoto2 = gallery[2] || gallery[0];

  const handleOpenBooking = () => {
    setSelectedServiceId(null);
    setIsBookingOpen(true);
  };

  const handleSelectServiceFromCatalog = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsBookingOpen(true);
  };

  const handleScrollToTracker = () => {
    const el = document.getElementById("randevu-sorgula");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAppointmentCreated = async (newAppointment: AppointmentItem) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_ad_soyad: newAppointment.musteriAdSoyad,
          musteri_telefon: newAppointment.musteriTelefon,
          hizmet_idleri: newAppointment.hizmetIdleri,
          tarih_saat: newAppointment.tarihSaat,
          toplam_sure_dakika: newAppointment.toplamSureDakika,
          notlar: newAppointment.not,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Randevu talebi oluşturulurken bir hata oluştu.";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      toast.success("Randevu talebiniz başarıyla alındı!");
      const serverApp = result.data;
      const formattedApp: AppointmentItem = {
        id: serverApp.id,
        musteriId: serverApp.musteri_id,
        musteriAdSoyad: serverApp.musteri_ad_soyad,
        musteriTelefon: serverApp.musteri_telefon,
        hizmetIdleri: serverApp.hizmet_idleri,
        calisanIdleri: serverApp.calisan_idleri || [],
        tarihSaat: serverApp.tarih_saat,
        toplamSureDakika: serverApp.toplam_sure_dakika,
        durum: serverApp.durum,
        kaynak: serverApp.kaynak,
        not: serverApp.notlar || undefined,
        olusturulmaTarihi: serverApp.olusturulma_tarihi,
      };
      setAppointments((prev) => [formattedApp, ...prev]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      const genericErr = "Randevu talebi sunucuya iletilemedi.";
      toast.error(genericErr);
      throw new Error(genericErr);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary selection:bg-primary/20 selection:text-text-primary pb-16 md:pb-0">
      {/* Üst Navigasyon & TopBar */}
      <Navbar
        onOpenBooking={handleOpenBooking}
        onOpenTracker={handleScrollToTracker}
      />

      <main className="flex-1">
        {/* 1. HERO (GİRİŞ) BÖLÜMÜ - BEAUTYZONE ÇİFT KATMANLI TİPOGRAFİ & LÜKS GÖRSEL */}
        <Hero onOpenBooking={handleOpenBooking} />

        {/* 2. "NEDEN BİZİ SEÇMELİSİNİZ?" - BEAUTYZONE 4'LÜ ASİMETRİK FOTOĞRAF KOLAJI & AVANTAJ LİSTESİ */}
        <AboutCollageSection onOpenBooking={handleOpenBooking} />

        {/* 3. HİZMET KATALOĞU - BEAUTYZONE İKON IZGARASI (ŞARTNAME MADDE 11: FİYATLAR GİZLİ) */}
        <ServiceCatalog
          services={services}
          onSelectService={handleSelectServiceFromCatalog}
        />

        {/* 4. ÇİFT RENKLİ SPLIT BANNER BLOKLARI - EDİTORİAL TANITIM & FELSEFE BANTI */}
        <SplitBannerSection onOpenBooking={handleOpenBooking} />

        {/* 5. LOOKBOOK & EDITORIAL VİTRİN (GALERİDEN İLK 3 ÇALIŞMA) */}
        <section className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border-main">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-primary block mb-2">
                {pageTexts.hero?.lookbookBadge || "Haute Coiffure Portföyü"}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark">
                {pageTexts.hero?.lookbookTitle || "Zarafetin ve Ustalığın İmzası"}
              </h2>
              {/* Pembe & Turkuaz Aksan Çizgisi */}
              <div className="flex items-center gap-2 pt-2">
                <span className="h-[2px] w-14 bg-primary rounded-full" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              </div>
            </div>
            <Link href="/galeri">
              <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider font-bold text-dark border-border-main hover:border-primary hover:text-primary">
                Tüm Koleksiyonu İncele →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Sol 1 Adet Büyük Vitrin Kartı */}
            <div className="md:col-span-7 group relative h-[460px] sm:h-[500px] rounded-2xl overflow-hidden border border-border-main bg-bg-secondary shadow-sm">
              {mainLookbookPhoto?.gorselUrl ? (
                <Image
                  src={mainLookbookPhoto.gorselUrl}
                  alt={mainLookbookPhoto.baslik || "Lookbook Tasarımı"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=85"
                  alt="Yıldız Bayan Kuaförü Saç Tasarımı"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                {mainLookbookPhoto?.kategori ? (
                  <Badge variant="gold" className="w-fit mb-2">
                    {mainLookbookPhoto.kategori}
                  </Badge>
                ) : (
                  <Badge variant="gold" className="w-fit mb-2">
                    Haute Coiffure
                  </Badge>
                )}
                <h3 className="font-serif text-2xl font-bold">
                  {mainLookbookPhoto?.baslik || "Özel Kesim & Balyaj Tasarımı"}
                </h3>
                <p className="text-xs text-gray-300 mt-1 max-w-md">
                  {mainLookbookPhoto?.stilist || "Yıldız Bayan Kuaförü Özel Koleksiyonu"}
                </p>
              </div>
            </div>

            {/* Sağ 2 Adet Dikey Vitrin Kartı */}
            <div className="md:col-span-5 grid grid-rows-2 gap-6">
              <div className="group relative h-[218px] sm:h-[238px] rounded-2xl overflow-hidden border border-border-main bg-bg-secondary shadow-sm">
                <Image
                  src={
                    sideLookbookPhoto1?.gorselUrl ||
                    "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={sideLookbookPhoto1?.baslik || "Lookbook Tasarımı"}
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                    {sideLookbookPhoto1?.kategori || "Renklendirme"}
                  </span>
                  <h4 className="font-serif text-lg font-bold">
                    {sideLookbookPhoto1?.baslik || "Doğal Işıltılı Sarı Balyaj"}
                  </h4>
                </div>
              </div>

              <div className="group relative h-[218px] sm:h-[238px] rounded-2xl overflow-hidden border border-border-main bg-bg-secondary shadow-sm">
                <Image
                  src={
                    sideLookbookPhoto2?.gorselUrl ||
                    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={sideLookbookPhoto2?.baslik || "Lookbook Tasarımı"}
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                    {sideLookbookPhoto2?.kategori || "Özel Gün"}
                  </span>
                  <h4 className="font-serif text-lg font-bold">
                    {sideLookbookPhoto2?.baslik || "Romantik Dalgalı Gelin Saçı"}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. UZMAN KADRO & SALON MASTER STİLİST BÖLÜMÜ */}
        <StaffSection onOpenBooking={handleOpenBooking} />

        {/* 7. SON 5 DOĞRULANMIŞ MÜŞTERİ YORUMU (ŞARTNAME MADDE 13: GOOGLE & SALON KARIŞIK) */}
        <ReviewsSection reviews={reviews.slice(0, 5)} />

        {/* 8. RANDEVU DURUM TAKİP & SORGULAMA KUTUSU */}
        <AppointmentTracker
          appointments={appointments}
          services={services}
          onOpenBooking={handleOpenBooking}
        />

        {/* 9. GÜÇLÜ EDITORIAL RANDEVU ÇAĞRISI (CTA) */}
        <section className="py-20 sm:py-24 bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-secondary border-t border-border-main">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <span className="text-[11px] uppercase font-bold tracking-[0.3em] text-primary block">
              {pageTexts.homeCTA?.rozet || "Zaman Sizin İçin Akıyor"}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark">
              {pageTexts.homeCTA?.baslik || "Kendinize Hak Ettiğiniz Zarafeti Armağan Edin"}
            </h2>

            {/* Pembe ve Turkuaz Aksan Çizgisi */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="h-[2.5px] w-16 bg-primary rounded-full" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-[2.5px] w-16 bg-primary rounded-full" />
            </div>

            <p className="text-xs sm:text-sm md:text-base text-dark/80 max-w-xl mx-auto leading-relaxed font-medium">
              {pageTexts.homeCTA?.aciklama ||
                "Randevu oluşturduğunuzda seçtiğiniz saat dilimi 30 dakika boyunca adınıza rezerve edilir ve salonumuzda bekleme olmadan, konforlu bir atmosferde ağırlanırsınız."}
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOpenBooking}
                className="px-8 shadow-sm text-xs uppercase tracking-wider font-bold bg-primary hover:bg-primary-hover text-white border-0"
              >
                {pageTexts.homeCTA?.butonMetni || "Hemen Randevu Al"}
              </Button>
              <Link href="/hizmetler">
                <Button variant="outline" size="lg" className="px-8 text-xs uppercase tracking-wider font-bold text-dark border-border-main hover:border-primary hover:text-primary">
                  Hizmetlerimizi İnceleyin
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Alt Bilgi */}
      <Footer />

      {/* İnteraktif Randevu Alma Modalı */}
      <BookingWizardModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
        initialSelectedServiceId={selectedServiceId}
        onAppointmentCreated={handleAppointmentCreated}
      />

      {/* Sabit WhatsApp İletişim Butonu */}
      <FloatingWhatsApp />
    </div>
  );
}
