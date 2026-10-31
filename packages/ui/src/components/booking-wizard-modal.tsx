"use client";

import React, { useState, useId, useEffect } from "react";
import type {
  ServiceItem,
  AppointmentItem,
} from "@yildiz/types";
import {
  calculateAppointmentTotalDuration,
  generateSafeUUID,
  toIstanbulIso,
} from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";

export interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  initialSelectedServiceId?: string | null;
  onAppointmentCreated: (appointment: AppointmentItem) => void | Promise<void>;
}

const ALL_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen,
  onClose,
  services,
  initialSelectedServiceId,
  onAppointmentCreated,
}) => {
  const modalId = useId();

  // 4 Adımlı Sadeleştirilmiş Akış
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Tarihler: Bugün ve gelecek 6 gün
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const availableDates: { label: string; value: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayStr =
      i === 0
        ? "Bugün"
        : d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
    availableDates.push({ label: dayStr, value: val, isToday: i === 0 });
  }

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0]?.value ?? todayStr);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Müşteri İletişim Formu State
  const [customerName, setCustomerName] = useState("");
  const [customerSurname, setCustomerSurname] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [kvkkConsent, setKvkkConsent] = useState(false);

  // SMS Doğrulama Durumu
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [enteredSmsCode, setEnteredSmsCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Başarı Onayı & 30 Dk Slot Blokaj Sayacı
  const [createdAppointment, setCreatedAppointment] = useState<AppointmentItem | null>(null);
  const [blockCountdown, setBlockCountdown] = useState<number>(30 * 60);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Önceden seçilmiş hizmet varsa ekle
  useEffect(() => {
    if (initialSelectedServiceId) {
      setSelectedServiceIds((prev) =>
        prev.includes(initialSelectedServiceId) ? prev : [...prev, initialSelectedServiceId],
      );
    }
  }, [initialSelectedServiceId]);

  // 30 Dk Slot Koruma Sayacı (Adım 4)
  useEffect(() => {
    if (step === 4 && blockCountdown > 0) {
      const timer = setInterval(() => {
        setBlockCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, blockCountdown]);

  if (!isOpen) return null;

  // Hesaplamalar
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const serviceDurations = selectedServices.map((s) => s.tahminiSureDakika);
  const bufferMinutes = 15;
  const totalDuration = calculateAppointmentTotalDuration(serviceDurations, bufferMinutes);

  // AKILLI BUGÜN SAAT FİLTRESİ
  const getFilteredTimeSlots = (): string[] => {
    if (selectedDate !== todayStr) {
      return ALL_TIME_SLOTS;
    }

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return ALL_TIME_SLOTS.filter((slot) => {
      const [hoursStr, minutesStr] = slot.split(":");
      const h = Number(hoursStr);
      const m = Number(minutesStr);
      if (isNaN(h) || isNaN(m)) return false;
      const slotTotalMinutes = h * 60 + m;
      return slotTotalMinutes > currentTotalMinutes;
    });
  };

  const visibleSlots = getFilteredTimeSlots();

  // İlk boş saate alma fonksiyonu
  const handleAutoFirstSlot = () => {
    if (visibleSlots.length > 0 && visibleSlots[0]) {
      setSelectedTime(visibleSlots[0]);
      setStep(3);
    } else {
      const tomorrow = availableDates[1]?.value;
      if (tomorrow) {
        setSelectedDate(tomorrow);
        setSelectedTime("09:00");
        setStep(3);
      }
    }
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  };

  const handleSendSms = () => {
    if (!customerPhone || customerPhone.replace(/\D/g, "").length < 10) {
      setFormError("Lütfen geçerli bir telefon numarası giriniz.");
      return;
    }
    setFormError(null);
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setSmsCode(randomCode);
    setSmsSent(true);
  };

  const handleVerifySmsAndConfirm = async () => {
    if (!customerName.trim() || !customerSurname.trim()) {
      setFormError("Lütfen ad ve soyad alanlarını doldurunuz.");
      return;
    }
    if (enteredSmsCode !== smsCode) {
      setFormError("Girdiğiniz SMS doğrulama kodu hatalı.");
      return;
    }
    if (!kvkkConsent) {
      setFormError("Lütfen KVKK Aydınlatma Metni'ni onaylayınız.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const cleanAdSoyad = `${customerName.trim()} ${customerSurname.trim()}`;
      const cleanPhone = customerPhone.trim();

      // Yeni randevu objesi (Çalışan ataması admin tarafından onay sırasında yapılır)
      const newAppointment: AppointmentItem = {
        id: generateSafeUUID(),
        musteriId: generateSafeUUID(),
        musteriAdSoyad: cleanAdSoyad,
        musteriTelefon: cleanPhone,
        hizmetIdleri: selectedServiceIds,
        calisanIdleri: [],
        tarihSaat: toIstanbulIso(selectedDate, selectedTime),
        toplamSureDakika: totalDuration,
        durum: "Beklemede",
        kaynak: "Web",
        not: customerNote.trim() || undefined,
        olusturulmaTarihi: new Date().toISOString(),
        kvkkOnay: true,
      };

      await onAppointmentCreated(newAppointment);
      setCreatedAppointment(newAppointment);
      setStep(4);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Randevu kaydedilirken bir hata oluştu.";
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-bg-primary rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Başlık ve Adım Göstergesi */}
        <div className="px-6 py-5 border-b border-border bg-bg-secondary flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-gold block">
              VIP Online Randevu Masası
            </span>
            <h2 id={`${modalId}-title`} className="font-serif text-xl font-bold text-text-primary">
              {step === 1 && "Adım 1: Hizmet Seçimi"}
              {step === 2 && "Adım 2: Randevu Tarihi & Saati"}
              {step === 3 && "Adım 3: İletişim Bilgileri & SMS Onayı"}
              {step === 4 && "Adım 4: Randevu Alındı"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-gold"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* 4 Adımlı İlerleme Çubuğu */}
        <div
          className="w-full bg-border-main h-1.5"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={4}
        >
          <div
            className="bg-accent-gold h-1.5 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Gövde */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ADIM 1: ÇOKLU HİZMET SEÇİMİ */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Almak istediğiniz bir veya birden fazla saç ve güzellik hizmetini seçebilirsiniz. Toplam işlem ve tampon süresi adınıza rezerve edilir.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {services.map((service) => {
                  const isChecked = selectedServiceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-accent-gold/10 border-accent-gold shadow-sm"
                          : "bg-white border-border hover:border-accent-gold/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleService(service.id)}
                        className="mt-1 h-4 w-4 rounded border-border text-accent-gold focus:ring-accent-gold"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text-primary">{service.ad}</span>
                          <span className="font-medium text-accent-gold">{service.tahminiSureDakika} dk</span>
                        </div>
                        <span className="text-[11px] text-text-secondary block mt-0.5 line-clamp-1">
                          {service.aciklama}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Dinamik Süre ve Tampon Kutusu */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-text-secondary block">
                    Seçilen Hizmet Sayısı: {selectedServiceIds.length} • Tampon Süre: +15 dk
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    Toplam Seans Süresi: {totalDuration > 15 ? totalDuration : 0} Dakika
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-accent-gold font-semibold uppercase tracking-wider block">
                    👑 Butik VIP Hizmet
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Yıldız Bayan Kuaförü Güvencesiyle
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ADIM 2: TARİH VE 30 DAKİKALIK SAAT SLATLARI (AKILLI BUGÜN FİLTRESİYLE) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  Size en uygun randevu gününü ve 30 dakikalık saat dilimini seçiniz.
                </p>
                <button
                  type="button"
                  onClick={handleAutoFirstSlot}
                  className="text-xs font-semibold text-accent-gold hover:underline flex items-center gap-1"
                >
                  ⚡ İlk Boş Saate Al
                </button>
              </div>

              {/* Günler */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">
                  1. Randevu Gününü Belirleyin
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.value);
                          setSelectedTime(""); // Gün değiştiğinde saati sıfırla
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-all ${
                          isSelected
                            ? "bg-text-primary text-white border-text-primary shadow-sm font-bold"
                            : "bg-white border-border text-text-primary hover:bg-bg-secondary"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 30 Dakikalık Saat Dilimleri */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text-primary">
                    2. Saat Dilimi Seçiniz (30 dk aralıklar)
                  </label>
                  <span className="text-[11px] text-accent-gold font-medium">
                    Toplam Seans: {totalDuration} dk
                  </span>
                </div>

                {visibleSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center">
                    Bugün için çalışma saatleri içerisindeki seanslar tamamlanmıştır. Lütfen yarın veya sonraki günleri seçiniz.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                    {visibleSlots.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-1 rounded-md border text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? "bg-accent-gold text-white border-accent-gold shadow-sm"
                              : "bg-white border-border text-text-primary hover:border-primary/60 hover:bg-bg-secondary"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADIM 3: MÜŞTERİ BİLGİLERİ & SMS DOĞRULAMA */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Randevu saatinizin adınıza ayrılması ve anlık bilgilendirme için lütfen telefon numaranızı doğrulayınız.
              </p>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Adınız *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Adınız"
                    className="w-full px-3 py-2 rounded-md border border-border bg-white text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Soyadınız *
                  </label>
                  <input
                    type="text"
                    value={customerSurname}
                    onChange={(e) => setCustomerSurname(e.target.value)}
                    placeholder="Soyadınız"
                    className="w-full px-3 py-2 rounded-md border border-border bg-white text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Telefon Numaranız (SMS Onayı İçin) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-white text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendSms}
                    disabled={smsSent}
                  >
                    {smsSent ? "Kodu Yeniden İste" : "SMS Kodu Gönder"}
                  </Button>
                </div>
              </div>

              {/* SMS Doğrulama Kutusu */}
              {smsSent && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      📱 SMS Doğrulama Kodu
                    </span>
                    <span className="text-xs font-mono font-bold text-accent-gold bg-white px-2 py-0.5 rounded border border-accent-gold/40">
                      Kod: {smsCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Telefonunuza gelen 4 haneli SMS kodunu aşağıdaki kutuya giriniz:
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredSmsCode}
                      onChange={(e) => setEnteredSmsCode(e.target.value)}
                      placeholder="4 Haneli Kod"
                      className="w-32 px-3 py-1.5 rounded-md border border-amber-300 bg-white text-sm text-center font-mono font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setEnteredSmsCode(smsCode)}
                      className="text-xs text-accent-gold underline hover:text-accent-gold-hover"
                    >
                      (Otomatik Doldur)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Özel İstek / Alerji veya Saç Notu (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Örn: Hassas saç derisi, önceki boya tonu vb."
                  className="w-full px-3 py-2 rounded-md border border-border bg-white text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
              </div>

              {/* KVKK Onay Kutusu (O8) */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="booking-kvkk-consent"
                  type="checkbox"
                  checked={kvkkConsent}
                  onChange={(e) => setKvkkConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent-gold focus:ring-accent-gold cursor-pointer"
                />
                <label
                  htmlFor="booking-kvkk-consent"
                  className="text-[11px] leading-relaxed text-text-secondary select-none cursor-pointer"
                >
                  6698 sayılı KVKK kapsamında{" "}
                  <a
                    href="/kvkk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-gold font-semibold underline hover:text-text-primary"
                  >
                    Aydınlatma Metni
                  </a>
                  &apos;ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum.
                </label>
              </div>
            </div>
          )}

          {/* ADIM 4: ÖZET VE ONAY (30 DK BLOKAJ GERİ SAYIMI) */}
          {step === 4 && createdAppointment && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
                ✓
              </div>

              <div>
                <Badge variant="amber">⏳ Onay Bekliyor (Slot Bloke)</Badge>
                <h3 className="font-serif text-2xl font-bold text-text-primary mt-2">
                  Randevu Talebiniz Alındı!
                </h3>
                <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                  Sayın <strong>{createdAppointment.musteriAdSoyad}</strong>, randevunuz salonumuzun sistemine iletildi.
                </p>
              </div>

              {/* 30 Dk Geri Sayım Kutusu (Şartname Madde 4) */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 max-w-md mx-auto">
                <span className="text-xs font-semibold text-amber-900 block">
                  Geçici Slot Blokaj Kalan Süresi
                </span>
                <span className="font-mono text-2xl font-bold text-amber-900 block my-1">
                  {formatCountdown(blockCountdown)}
                </span>
                <span className="text-[11px] text-amber-800 leading-tight block">
                  Seçtiğiniz saat dilimi 30 dakika boyunca adınıza bloke edilmiştir. Salonumuz onayladığında SMS ile bilgilendirileceksiniz.
                </span>
              </div>

              {/* Randevu Özeti */}
              <div className="bg-bg-secondary rounded-xl p-4 border border-border text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tarih &amp; Saat:</span>
                  <span className="font-bold text-text-primary">
                    {selectedDate} - {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Seçilen Hizmetler:</span>
                  <span className="font-medium text-text-primary">
                    {selectedServices.map((s) => s.ad).join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Uzman Ataması:</span>
                  <span className="font-medium text-text-primary">
                    Onay Sırasında Belirlenecek
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Toplam Süre:</span>
                  <span className="font-medium text-text-primary">
                    {totalDuration} Dakika (15 dk tampon dahil)
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-xs">
                  <span className="text-text-secondary">Hizmet Türü:</span>
                  <span className="font-semibold text-accent-gold">Kişiye Özel Butik VIP Hizmet</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Aksiyon Çubuğu */}
        <div className="px-6 py-4 border-t border-border bg-bg-secondary flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1))}
            >
              ← Geri
            </Button>
          ) : (
            <div />
          )}

          <div>
            {step === 1 && (
              <Button
                variant="primary"
                size="md"
                disabled={selectedServiceIds.length === 0}
                onClick={() => setStep(2)}
              >
                İleri: Tarih &amp; Saat Seçimi ({selectedServiceIds.length}) →
              </Button>
            )}

            {step === 2 && (
              <Button
                variant="primary"
                size="md"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                İleri: İletişim Bilgileri →
              </Button>
            )}

            {step === 3 && (
              <Button
                variant="primary"
                size="md"
                disabled={!smsSent || !enteredSmsCode || !kvkkConsent || isSubmitting}
                onClick={handleVerifySmsAndConfirm}
              >
                {isSubmitting ? "Kaydediliyor..." : "Randevuyu Onayla ve Bloke Et ✓"}
              </Button>
            )}

            {step === 4 && (
              <Button variant="primary" size="md" onClick={onClose}>
                Tamamla ve Kapat
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
