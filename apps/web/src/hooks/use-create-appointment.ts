"use client";

import { useState, useCallback } from "react";
import type { AppointmentItem } from "@yildiz/types";
import { toast } from "@/stores/toast-store";

export function useCreateAppointment() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const handleAppointmentCreated = useCallback(async (newAppointment: AppointmentItem) => {
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
          kvkk_onay: newAppointment.kvkkOnay ?? true,
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
  }, []);

  return { appointments, setAppointments, handleAppointmentCreated };
}
