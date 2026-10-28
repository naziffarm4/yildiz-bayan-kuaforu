"use client";

import React, { useState } from "react";
import type { AppointmentItem, ServiceItem } from "@yildiz/types";
import { Card, Button, Badge } from "@yildiz/ui";
import { useContent } from "../lib/content-context";

interface AppointmentTrackerProps {
  appointments: AppointmentItem[];
  services: ServiceItem[];
  onOpenBooking: () => void;
}

export const AppointmentTracker: React.FC<AppointmentTrackerProps> = ({
  appointments,
  services,
  onOpenBooking,
}) => {
  const { pageTexts } = useContent();
  const trackerTexts = pageTexts.trackerSection;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [foundAppointment, setFoundAppointment] = useState<AppointmentItem | null>(null);

  const cleanPhone = (p: string) => p.replace(/\D/g, "");

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = cleanPhone(phoneNumber);
    if (!query) return;

    // Telefonun son 10 hanesini eşleştir
    const target = query.slice(-10);
    const matched = appointments.find((a) => cleanPhone(a.musteriTelefon).endsWith(target));

    setFoundAppointment(matched ?? null);
    setHasSearched(true);
  };

  const getServiceNames = (ids: string[]) => {
    return ids
      .map((id) => services.find((s) => s.id === id)?.ad)
      .filter((name): name is string => Boolean(name))
      .join(", ");
  };

  const getStatusBadge = (status: AppointmentItem["durum"]) => {
    switch (status) {
      case "Onaylandı":
        return <Badge variant="green">✓ Onaylandı</Badge>;
      case "Beklemede":
        return <Badge variant="amber">⏳ Onay Bekliyor (Slot Bloke)</Badge>;
      case "Tamamlandı":
        return <Badge variant="gold">★ Tamamlandı</Badge>;
      case "İptal Edildi":
      case "Süresi Doldu":
        return <Badge variant="gray">✕ {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <section id="randevu-sorgula" className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
      <Card className="bg-bg-primary border-border shadow-sm p-6 sm:p-10">
        <div className="text-center max-w-xl mx-auto mb-8">
          <Badge variant="gold">{trackerTexts?.rozet || "Randevu Takip & Sorgulama"}</Badge>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-text-primary">
            {trackerTexts?.baslik || "Randevunuzun Durumunu Öğrenin"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary">
            {trackerTexts?.aciklama ||
              "Telefon numaranızı girerek onay durumunu, atanan uzmanınızı ve randevu detaylarınızı görüntüleyin."}
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Örn: 0532 123 45 67"
            className="flex-1 px-4 py-3 rounded-md border border-border bg-white text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent-gold"
            aria-label="Sorgulanacak Telefon Numarası"
          />
          <Button type="submit" variant="primary" size="md">
            {trackerTexts?.butonMetni || "Sorgula"}
          </Button>
        </form>

        {/* Sorgulama Sonuç Kartı */}
        {hasSearched && (
          <div className="mt-8 border-t border-border pt-6 max-w-lg mx-auto">
            {foundAppointment ? (
              <div className="bg-bg-secondary rounded-xl p-5 border border-border/80">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
                  <div>
                    <h3 className="font-serif font-bold text-base text-text-primary">
                      {foundAppointment.musteriAdSoyad}
                    </h3>
                    <p className="text-xs text-text-secondary">{foundAppointment.musteriTelefon}</p>
                  </div>
                  <div>{getStatusBadge(foundAppointment.durum)}</div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tarih &amp; Saat:</span>
                    <span className="font-semibold text-text-primary">
                      {new Date(foundAppointment.tarihSaat).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-text-secondary">Seçilen Hizmetler:</span>
                    <span className="font-medium text-text-primary text-right max-w-[240px]">
                      {getServiceNames(foundAppointment.hizmetIdleri)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-text-secondary">Toplam Süre:</span>
                    <span className="font-medium text-text-primary">
                      {foundAppointment.toplamSureDakika} dakika (Tampon süre dahil)
                    </span>
                  </div>

                  {foundAppointment.durum === "Beklemede" && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900 leading-relaxed">
                      💡 <strong>Slot Bloke Süresi:</strong> Randevunuz personelimiz tarafından onaylanana kadar 30 dakika boyunca adınıza ayrılmıştır. Onay SMS’i ile bilgilendirileceksiniz.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-text-secondary">
                  Bu telefon numarasına ait aktif bir randevu bulunamadı.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenBooking}
                  className="mt-4"
                >
                  Yeni Randevu Oluştur
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  );
};
