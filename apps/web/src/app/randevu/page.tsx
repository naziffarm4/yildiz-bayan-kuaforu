"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { AppointmentTracker } from "@/components/AppointmentTracker";
import type { AppointmentItem } from "@yildiz/types";
import { Badge, Button, BookingWizardModal } from "@yildiz/ui";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/stores/toast-store";

function RandevuContent() {
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("service");

  const services = useAppStore((s) => s.services);
  const isInitialLoaded = useAppStore((s) => s.isInitialLoaded);
  const isRefreshing = useAppStore((s) => s.isRefreshing);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(true);

  const handleAppointmentCreated = async (newApp: AppointmentItem) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_ad_soyad: newApp.musteriAdSoyad,
          musteri_telefon: newApp.musteriTelefon,
          hizmet_idleri: newApp.hizmetIdleri,
          tarih_saat: newApp.tarihSaat,
          toplam_sure_dakika: newApp.toplamSureDakika,
          notlar: newApp.not,
          kvkk_onay: newApp.kvkkOnay ?? true,
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

  useEffect(() => {
    setIsWizardOpen(true);
  }, [preselectedServiceId]);

  if (!isInitialLoaded && isRefreshing) {
    return <PageLoader variant="modal" message="Randevu masası hazırlanıyor..." />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar onOpenBooking={() => setIsWizardOpen(true)} />

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

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsWizardOpen(true)}
              className="shadow-sm"
            >
              ⚡ Randevu Sihirbazını Başlat
            </Button>
          </div>
        </div>

        {/* Randevu Sorgulama / Durum Kutusu */}
        <AppointmentTracker
          appointments={appointments}
          services={services}
          onOpenBooking={() => setIsWizardOpen(true)}
        />

        {/* İnteraktif 4 Adımlı Randevu Sihirbazı */}
        <BookingWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          services={services}
          initialSelectedServiceId={preselectedServiceId}
          onAppointmentCreated={handleAppointmentCreated}
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
