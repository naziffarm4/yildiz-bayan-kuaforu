"use client";

import React, { useState, useEffect } from "react";
import type {
  AppointmentItem,
  CashPayment,
  PaymentMethod,
  ServiceItem,
  StaffProfile,
} from "@yildiz/types";
import {
  calculateCommission,
  calculateLoyaltyPoints,
  calculateLoyaltyDiscount,
  generateSafeUUID,
} from "@yildiz/types";
import { Card } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

export interface CashRegisterPOSProps {
  appointments: AppointmentItem[];
  services: ServiceItem[];
  staff: StaffProfile[];
  payments: CashPayment[];
  selectedAppointmentForPOS: AppointmentItem | null;
  onClearSelectedAppointment: () => void;
  onPaymentCompleted: (
    payment: CashPayment,
    appointmentId?: string,
    meta?: {
      serviceIds?: string[];
      discountType?: "TL" | "PERCENT";
      discountValue?: number;
      usedPointsCount?: number;
    },
  ) => Promise<void> | void;
  activeStaffName: string;
}

export const CashRegisterPOS: React.FC<CashRegisterPOSProps> = ({
  appointments,
  services,
  staff,
  payments,
  selectedAppointmentForPOS,
  onClearSelectedAppointment,
  onPaymentCompleted,
  activeStaffName: _activeStaffName,
}) => {
  // Seçili randevu veya serbest giriş
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Seçili Hizmetler
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string>(staff[0]?.id ?? "");

  // İndirim & Puan
  const [discountType, setDiscountType] = useState<"TL" | "PERCENT">("TL");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [usedPoints, setUsedPoints] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);

  // Ödeme ve Not
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Nakit");
  const [privateNote, setPrivateNote] = useState("");
  const [cashDifferenceInput, setCashDifferenceInput] = useState<string>("");

  // Tahsilat Sonrası Memnuniyet Modalı State
  const [successReviewModal, setSuccessReviewModal] = useState<{
    customerName: string;
    customerPhone: string;
    serviceNames: string;
    paymentId: string;
    appointmentId?: string;
    reviewUrl: string;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Randevu POS'a aktarıldıysa alanları doldur
  useEffect(() => {
    if (selectedAppointmentForPOS) {
      setSelectedAppointmentId(selectedAppointmentForPOS.id);
      setCustomerName(selectedAppointmentForPOS.musteriAdSoyad);
      setCustomerPhone(selectedAppointmentForPOS.musteriTelefon);
      setSelectedServiceIds(selectedAppointmentForPOS.hizmetIdleri);
      if (selectedAppointmentForPOS.calisanIdleri[0]) {
        setStaffId(selectedAppointmentForPOS.calisanIdleri[0]);
      }
    }
  }, [selectedAppointmentForPOS]);

  // Randevu dropdown'dan seçildiğinde
  const handleSelectAppointment = (appId: string) => {
    setSelectedAppointmentId(appId);
    if (!appId) {
      setCustomerName("");
      setCustomerPhone("");
      setSelectedServiceIds([]);
      return;
    }
    const app = appointments.find((a) => a.id === appId);
    if (app) {
      setCustomerName(app.musteriAdSoyad);
      setCustomerPhone(app.musteriTelefon);
      setSelectedServiceIds(app.hizmetIdleri);
      if (app.calisanIdleri[0]) {
        setStaffId(app.calisanIdleri[0]);
      }
    }
  };

  const handleAddService = (serviceId: string) => {
    if (!serviceId) return;
    setSelectedServiceIds((prev) => [...prev, serviceId]);
  };

  const handleRemoveService = (index: number) => {
    setSelectedServiceIds((prev) => prev.filter((_, i) => i !== index));
  };

  // Hesaplamalar
  const activeStaff = staff.find((s) => s.id === staffId);
  const commissionRate = activeStaff?.komisyonOrani ?? 20;

  const currentServices = selectedServiceIds
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is ServiceItem => Boolean(s));

  const subTotal = currentServices.reduce((acc, curr) => acc + curr.fiyat, 0);

  // İndirim Tutarı
  let discountAmount = 0;
  if (discountType === "PERCENT") {
    discountAmount = Math.round(subTotal * (discountValue / 100));
  } else {
    discountAmount = discountValue;
  }
  discountAmount = Math.min(discountAmount, subTotal);

  // Puan İndirimi
  const pointDiscountAmount = calculateLoyaltyDiscount(usedPoints);
  const totalDeductions = discountAmount + pointDiscountAmount;

  // Net Tahsilat Tutarı
  const netPayable = Math.max(0, subTotal - totalDeductions);

  // Komisyon hesabı (Şartname Madde 6: indirimli hizmet tutarı üzerinden, bahşiş hariç)
  const earnedCommission = calculateCommission(netPayable, commissionRate);

  // Kazanılacak Sadakat Puanı (Şartname Madde 7: her 10 TL için 1 puan)
  const earnedPoints = calculateLoyaltyPoints(netPayable);

  // Z Raporu / Gün Sonu Hesaplamaları
  const totalNakit = payments.filter((p) => p.odemeYontemi === "Nakit").reduce((a, b) => a + b.odenenTutar, 0);
  const totalKart = payments.filter((p) => p.odemeYontemi === "Kart").reduce((a, b) => a + b.odenenTutar, 0);
  const totalHavale = payments.filter((p) => p.odemeYontemi === "Havale_EFT").reduce((a, b) => a + b.odenenTutar, 0);
  const totalVeresiye = payments.filter((p) => p.veresiye || p.odemeYontemi === "Veresiye").reduce((a, b) => a + b.odenenTutar, 0);
  const grandTotal = totalNakit + totalKart + totalHavale + totalVeresiye;

  const physicalCashCount = parseFloat(cashDifferenceInput) || totalNakit;
  const cashDifference = physicalCashCount - totalNakit;

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || currentServices.length === 0 || isSubmittingPayment) return;

    setPaymentError(null);
    setIsSubmittingPayment(true);

    const paymentId = generateSafeUUID();
    const apptId = selectedAppointmentId || undefined;
    const matchedAppointment = apptId
      ? appointments.find((a) => a.id === apptId)
      : undefined;
    const resolvedCustomerId = matchedAppointment?.musteriId || generateSafeUUID();
    const servicesStr = currentServices.map((s) => s.ad).join(", ");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const reviewUrl = `${origin}/degerlendir?ref=${encodeURIComponent(apptId || paymentId)}&name=${encodeURIComponent(customerName.trim())}&service=${encodeURIComponent(servicesStr)}`;

    const newPayment: CashPayment = {
      id: paymentId,
      randevuId: apptId,
      musteriId: resolvedCustomerId,
      musteriAdSoyad: customerName.trim(),
      islemiYapanCalisanId: staffId,
      hizmetAdlari: currentServices.map((s) => s.ad),
      toplamTutar: subTotal,
      odenenTutar: netPayable,
      indirimTutari: discountAmount,
      kullanilanPuanTutari: pointDiscountAmount,
      odemeYontemi: paymentMethod,
      bahsisTutari: tipAmount,
      veresiye: paymentMethod === "Veresiye",
      gizliNot: privateNote.trim() || undefined,
      olusturulmaTarihi: new Date().toISOString(),
    };

    try {
      await onPaymentCompleted(newPayment, apptId, {
        serviceIds: selectedServiceIds,
        discountType,
        discountValue,
        usedPointsCount: usedPoints,
      });

      // Başarılı tahsilat ve misafir memnuniyet modalını aç
      setSuccessReviewModal({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceNames: servicesStr,
        paymentId,
        appointmentId: apptId,
        reviewUrl,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tahsilat kaydedilirken bir hata oluştu.";
      setPaymentError(msg);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCloseReviewModal = () => {
    setSuccessReviewModal(null);
    setCopyFeedback(false);
    setSmsFeedback(false);

    // Formu temizle
    setSelectedAppointmentId("");
    setCustomerName("");
    setCustomerPhone("");
    setSelectedServiceIds([]);
    setDiscountValue(0);
    setUsedPoints(0);
    setTipAmount(0);
    setPrivateNote("");
    onClearSelectedAppointment();
  };

  const handleSendWhatsApp = () => {
    if (!successReviewModal) return;
    const cleanPhone = successReviewModal.customerPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("90")
      ? cleanPhone
      : cleanPhone.startsWith("0")
      ? `9${cleanPhone}`
      : `90${cleanPhone}`;
    const message = `Sayın ${successReviewModal.customerName}, bugün Yıldız Bayan Kuaförü'nde aldığınız ${successReviewModal.serviceNames} hizmeti için teşekkür ederiz. Deneyiminizi 30 saniyede değerlendirmek ve memnuniyetinizi paylaşmak için: ${successReviewModal.reviewUrl}`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyLink = async () => {
    if (!successReviewModal) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(successReviewModal.reviewUrl);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 3000);
      }
    } catch (err: unknown) {
      console.warn("Panoya kopyalama başarısız:", err);
    }
  };

  const handleSendSMS = () => {
    setSmsFeedback(true);
    setTimeout(() => setSmsFeedback(false), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-text-primary">
          Kasa &amp; POS Sistemi (Tek Kasa)
        </h1>
        <p className="text-xs text-text-secondary">
          Randevu ve kapıdan gelen müşterilerin tahsilatını yapın, hakediş ve gün sonu kapanışını izleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: ÖDEME ALMA / POS FORMU */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white border-border shadow-xs">
            <form onSubmit={handleCompletePayment} className="space-y-5">
              {/* Randevu Seçimi (Hızlı Aktarım) */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Onaylı Randevudan Aktar (İsteğe Bağlı)
                </label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => handleSelectAppointment(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-bg-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
                >
                  <option value="">-- Randevusuz Müşteri (Serbest Giriş) --</option>
                  {appointments
                    .filter((a) => a.durum === "Onaylandı")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.musteriAdSoyad} - {a.musteriTelefon} (
                        {new Date(a.tarihSaat).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        )
                      </option>
                    ))}
                </select>
              </div>

              {/* Müşteri Bilgileri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Müşteri Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                </div>
              </div>

              {/* Hizmet Listesi ve Ekleme */}
              <div className="border border-border rounded-xl p-4 bg-bg-secondary">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <label htmlFor="pos-add-service" className="text-xs font-bold text-text-primary block">
                    İşlem Gören Hizmetler ({currentServices.length})
                  </label>
                  <div className="w-full sm:w-auto">
                    <select
                      id="pos-add-service"
                      className="w-full sm:w-auto px-3 py-2.5 rounded-lg text-xs bg-white text-text-primary border border-border shadow-xs focus:outline-none focus:ring-1 focus:ring-accent-gold"
                      defaultValue=""
                      onChange={(e) => {
                        handleAddService(e.target.value);
                        e.target.value = "";
                      }}
                    >
                      <option value="" disabled>
                        + Hizmet Ekle
                      </option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.ad} ({s.fiyat} ₺)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {currentServices.length === 0 ? (
                  <p className="text-xs text-text-secondary py-3 text-center">
                    Henüz hizmet eklenmedi. Lütfen yukarıdan seçin.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {currentServices.map((service, idx) => (
                      <li key={idx} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-text-primary truncate">{service.ad}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-text-primary">{service.fiyat} ₺</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="w-7 h-7 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 text-xs flex items-center justify-center transition-colors"
                            title="Hizmeti Çıkar"
                            aria-label={`${service.ad} hizmetini listeden çıkar`}
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* İndirim ve Puan Uygulama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    İndirim Türü &amp; Değeri
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "TL" | "PERCENT")}
                      className="px-2 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                    >
                      <option value="TL">₺ Sabit</option>
                      <option value="PERCENT">% Yüzde</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full px-2 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Sadakat Puanı Harca
                  </label>
                  <input
                    type="number"
                    step={10}
                    min={0}
                    value={usedPoints}
                    onChange={(e) => setUsedPoints(Number(e.target.value))}
                    placeholder="Puan (100p = 50₺)"
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                  {usedPoints > 0 && (
                    <span className="text-[10px] text-accent-gold block mt-0.5 font-medium">
                      -{pointDiscountAmount} ₺ Puan İndirimi
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Bahşiş Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Number(e.target.value))}
                    placeholder="Bahşiş (Komisyonsuz)"
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                </div>
              </div>

              {/* Ödeme Yöntemi (Mobilde 2x2 Grid ve Büyük Butonlar) */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">
                  Ödeme Yöntemi *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "Nakit" as const, label: "Nakit", icon: "💵" },
                    { id: "Kart" as const, label: "Kredi / Banka Kartı", icon: "💳" },
                    { id: "Havale_EFT" as const, label: "Havale / EFT", icon: "🏦" },
                    { id: "Veresiye" as const, label: "Veresiye (Borç)", icon: "📝" },
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`h-12 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-accent-gold text-white border-accent-gold shadow-xs"
                            : "bg-bg-secondary text-text-primary border-border hover:bg-border-main"
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* İşlemi Yapan Kuaför */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  İşlemi Yapan Kuaför *
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-xs bg-white text-text-primary font-medium"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ad} {s.soyad} (%{s.komisyonOrani} Komisyon)
                    </option>
                  ))}
                </select>
              </div>

              {/* Gizli Müşteri Notu (Şartname Madde 5) */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Kasa / Gizli Müşteri Notu (Müşteriye Görünmez)
                </label>
                <input
                  type="text"
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="Örn: Saç açmada 20 volüm kullanıldı, bir sonraki gelişinde dip boya yapılacak."
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                />
              </div>

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {paymentError}
                </div>
              )}

              {/* Fiş Özeti & Tahsil Et Butonu */}
              <div className="p-4 sm:p-5 rounded-xl bg-bg-secondary border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-text-secondary">Ara Toplam: </span>
                    <span className="font-semibold text-text-primary">{subTotal} ₺</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Toplam İndirim: </span>
                    <span className="font-semibold text-red-600">-{totalDeductions} ₺</span>
                  </div>
                  <div className="text-[11px] text-accent-gold font-medium">
                    ⚡ Kazanılacak Sadakat Puanı: <strong>+{earnedPoints} Puan</strong> | Kuaför Komisyonu: <strong>{earnedCommission} ₺</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 text-center sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-text-secondary uppercase block font-semibold">
                      Tahsil Edilecek Net Tutar
                    </span>
                    <span className="font-serif text-2xl font-bold text-accent-gold">
                      {netPayable.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={currentServices.length === 0}
                    className="shadow-sm h-14 w-full sm:w-auto font-bold text-base px-8 active:scale-[0.98] transition-transform"
                  >
                    Tahsilatı Tamamla ✓
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* SAĞ: GÜN SONU KASA KAPANIŞI (Z RAPORU) & SON İŞLEMLER */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border-border shadow-xs">
            <div className="border-b border-border pb-3 mb-4">
              <span className="text-[10px] uppercase font-bold text-accent-gold block">
                Mali Kapanış
              </span>
              <h2 className="font-serif text-lg font-bold text-text-primary">
                Gün Sonu Z Raporu Özeti
              </h2>
              <span className="text-xs text-text-secondary">
                {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-text-secondary">💵 Nakit Tahsilat:</span>
                <span className="font-bold text-text-primary">{totalNakit.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-text-secondary">💳 Kredi / Banka Kartı:</span>
                <span className="font-bold text-text-primary">{totalKart.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-text-secondary">🏦 Havale / EFT:</span>
                <span className="font-bold text-text-primary">{totalHavale.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-text-secondary">📝 Açık Veresiye:</span>
                <span className="font-bold text-amber-800">{totalVeresiye.toLocaleString("tr-TR")} ₺</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-border font-serif text-sm font-bold">
                <span>Toplam Günlük Ciro:</span>
                <span className="text-accent-gold">{grandTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>

            {/* Nakit Kasa Farkı Hesabı (Şartname Madde 18) */}
            <div className="mt-5 p-3.5 rounded-lg bg-bg-secondary border border-border space-y-2">
              <span className="text-xs font-semibold text-text-primary block">
                Fiziki Nakit Sayımı &amp; Kasa Farkı
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Kasadaki Nakit (TL)"
                  value={cashDifferenceInput}
                  onChange={(e) => setCashDifferenceInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-border rounded text-xs bg-white text-text-primary"
                />
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-text-secondary">Kasa Farkı:</span>
                <span
                  className={`font-bold ${
                    cashDifference === 0
                      ? "text-emerald-700"
                      : cashDifference > 0
                        ? "text-blue-600"
                        : "text-red-600"
                  }`}
                >
                  {cashDifference > 0 ? `+${cashDifference}` : cashDifference} ₺{" "}
                  {cashDifference === 0 ? "(Tam)" : cashDifference > 0 ? "(Fazla)" : "(Açık)"}
                </span>
              </div>
            </div>
          </Card>

          {/* Son Kasa Hareketleri */}
          <Card className="p-5 bg-white border-border shadow-xs">
            <h3 className="font-serif text-sm font-bold text-text-primary mb-3">
              Son Yapılan Tahsilatlar ({payments.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {payments.map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg border border-border/80 bg-bg-secondary text-xs">
                  <div className="flex justify-between font-semibold text-text-primary">
                    <span>{p.musteriAdSoyad}</span>
                    <span className="text-accent-gold font-bold">{p.odenenTutar} ₺</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-secondary mt-1">
                    <span>{p.odemeYontemi}</span>
                    <span>
                      {new Date(p.olusturulmaTarihi).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {p.gizliNot && (
                    <p className="text-[10px] text-text-secondary/90 italic mt-1 bg-white p-1 rounded border border-border/50">
                      Not: {p.gizliNot}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* TAHSİLAT BAŞARILI & MİSAFİR MEMNUNİYET DAVETİ MODALI */}
      {successReviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={handleCloseReviewModal}
        >
          <div
            className="bg-white rounded-2xl border border-accent-gold/50 shadow-2xl w-full max-w-lg overflow-hidden p-6 sm:p-7 space-y-5 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Üst Alan */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xl flex items-center justify-center mx-auto shadow-inner">
                ✓
              </div>
              <Badge variant="gold">Tahsilat Kaydedildi</Badge>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                Misafir Memnuniyet Daveti
              </h2>
              <p className="text-xs text-text-secondary">
                <strong className="text-text-primary">{successReviewModal.customerName}</strong> için
                hizmet sonrası değerlendirme ve Google memnuniyet bağlantısı hazırlandı.
              </p>
            </div>

            {/* Bilgi Özeti */}
            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Müşteri:</span>
                <span className="font-semibold text-text-primary">{successReviewModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Hizmetler:</span>
                <span className="font-semibold text-text-primary text-right max-w-xs truncate">
                  {successReviewModal.serviceNames}
                </span>
              </div>
              {successReviewModal.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Telefon:</span>
                  <span className="font-mono text-text-primary">{successReviewModal.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Bağlantı Kutusu */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-text-secondary">
                Kişiselleştirilmiş Değerlendirme Bağlantısı
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={successReviewModal.reviewUrl}
                  className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs font-mono text-text-secondary truncate outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="text-xs shrink-0 font-semibold"
                >
                  {copyFeedback ? "Kopyalandı! ✓" : "📋 Kopyala"}
                </Button>
              </div>
            </div>

            {smsFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 text-center animate-fadeIn">
                SMS ile değerlendirme daveti iletildi ✅
              </div>
            )}

            {/* Aksiyon Butonları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <span>💬 WhatsApp ile Gönder</span>
              </button>

              <button
                type="button"
                onClick={handleSendSMS}
                className="w-full py-2.5 px-4 rounded-xl bg-bg-secondary hover:bg-border-main border border-border text-text-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>📱 SMS Gönder</span>
              </button>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCloseReviewModal}
                className="w-full sm:w-auto text-xs font-bold px-6"
              >
                Kapat &amp; Yeni Müşteri →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
