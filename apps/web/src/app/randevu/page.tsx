"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { AppointmentTracker } from "@/components/AppointmentTracker";
import { Badge, BookingWizardModal } from "@yildiz/ui";
import { useAppStore } from "@/stores/app-store";
import { useCreateAppointment } from "@/hooks/use-create-appointment";

function RandevuContent() {
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("service");

  const services = useAppStore((s) => s.services);
  const isInitialLoaded = useAppStore((s) => s.isInitialLoaded);
  const isRefreshing = useAppStore((s) => s.isRefreshing);

  const { appointments, handleAppointmentCreated } = useCreateAppointment();

  const handleScrollToBookingForm = () => {
    const el = document.getElementById("randevu-formu");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isInitialLoaded && isRefreshing) {
    return <PageLoader variant="modal" message="Randevu masası hazırlanıyor..." />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1 pt-8 sm:pt-12 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Başlık */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <Badge variant="gold">VIP Randevu &amp; Rezervasyon</Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Online Randevu Masası
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            İstediğiniz bakım ve tasarım hizmetlerini seçin. Sistemimiz randevu sürenize özel 15 dakikalık
            tampon süreyi otomatik olarak ekler ve beklemeden koltuğunuza geçmenizi sağlar.
          </p>
        </div>

        {/* Sayfa İçi Gömülü 4 Adımlı Randevu Sihirbazı */}
        <div id="randevu-formu" className="mb-14">
          <BookingWizardModal
            isOpen={true}
            inline={true}
            services={services}
            initialSelectedServiceId={preselectedServiceId}
            onAppointmentCreated={handleAppointmentCreated}
          />
        </div>

        {/* Randevu Sorgulama / Durum Kutusu */}
        <AppointmentTracker
          appointments={appointments}
          services={services}
          onOpenBooking={handleScrollToBookingForm}
        />
      </main>

      <Footer />
    </div>
  );
}

export default function RandevuPage() {
  return (
    <Suspense fallback={<PageLoader variant="modal" />}>
      <RandevuContent />
    </Suspense>
  );
}
