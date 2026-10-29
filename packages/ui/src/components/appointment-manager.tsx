"use client";

import React, { useState } from "react";
import type {
  AppointmentItem,
  AppointmentStatus,
  ServiceItem,
  StaffProfile,
} from "@yildiz/types";
import { generateSafeUUID } from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";

export interface AppointmentManagerProps {
  appointments: AppointmentItem[];
  services: ServiceItem[];
  staff: StaffProfile[];
  onUpdateAppointment: (updated: AppointmentItem) => void;
  onCreateAppointment: (created: AppointmentItem) => void;
  onOpenPOSWithAppointment: (appointment: AppointmentItem) => void;
  onDeleteAppointment?: (id: string) => void;
  activeStaffName: string;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({
  appointments,
  services,
  staff,
  onUpdateAppointment,
  onCreateAppointment,
  onOpenPOSWithAppointment,
  onDeleteAppointment,
  activeStaffName: _activeStaffName,
}) => {
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "Tümü">("Tümü");

  // Onaylama Modalı State
  const [approvingApp, setApprovingApp] = useState<AppointmentItem | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [extendedDuration, setExtendedDuration] = useState<number>(0);

  // Manuel Randevu Modalı State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualServiceIds, setManualServiceIds] = useState<string[]>([]);
  const [manualStaffId, setManualStaffId] = useState<string>("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualSource, setManualSource] = useState<"Telefon" | "WhatsApp" | "İşletmeye Geldi">("Telefon");
  const [manualNote, setManualNote] = useState("");

  const filteredAppointments =
    filterStatus === "Tümü"
      ? appointments
      : appointments.filter((a) => a.durum === filterStatus);

  const getServiceNames = (ids: string[]) => {
    return ids
      .map((id) => services.find((s) => s.id === id)?.ad)
      .filter(Boolean)
      .join(", ");
  };

  const getStaffNames = (ids: string[]) => {
    if (ids.length === 0) return "Atanmadı";
    return ids
      .map((id) => {
        const found = staff.find((s) => s.id === id);
        return found ? `${found.ad} ${found.soyad}` : "";
      })
      .filter(Boolean)
      .join(" & ");
  };

  // Onay modalını aç
  const handleOpenApproveModal = (app: AppointmentItem) => {
    setApprovingApp(app);
    setSelectedStaffIds(app.calisanIdleri.length > 0 ? app.calisanIdleri : [staff[0]?.id ?? ""]);
    setExtendedDuration(app.toplamSureDakika);
  };

  // Çakışma kontrolü (aynı çalışanın aynı saat diliminde başka randevusu var mı)
  const hasConflict = () => {
    if (!approvingApp || selectedStaffIds.length === 0) return false;
    return appointments.some(
      (a) =>
        a.id !== approvingApp.id &&
        a.durum === "Onaylandı" &&
        a.tarihSaat === approvingApp.tarihSaat &&
        a.calisanIdleri.some((id: string) => selectedStaffIds.includes(id)),
    );
  };

  const handleConfirmApproval = () => {
    if (!approvingApp) return;
    const updated: AppointmentItem = {
      ...approvingApp,
      durum: "Onaylandı",
      calisanIdleri: selectedStaffIds,
      toplamSureDakika: extendedDuration,
      onaylayanKullaniciId: generateSafeUUID(),
    };
    onUpdateAppointment(updated);
    setApprovingApp(null);
  };

  const handleSetNoShow = (app: AppointmentItem) => {
    const updated: AppointmentItem = {
      ...app,
      durum: "Gelmedi",
    };
    onUpdateAppointment(updated);
  };

  const handleCancel = (app: AppointmentItem) => {
    const updated: AppointmentItem = {
      ...app,
      durum: "İptal Edildi",
    };
    onUpdateAppointment(updated);
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim() || manualServiceIds.length === 0) return;

    const selectedServs = services.filter((s) => manualServiceIds.includes(s.id));
    const totalDuration = selectedServs.reduce((acc, curr) => acc + curr.tahminiSureDakika, 0) + 15;

    const newApp: AppointmentItem = {
      id: generateSafeUUID(),
      musteriId: generateSafeUUID(),
      musteriAdSoyad: manualName.trim(),
      musteriTelefon: manualPhone.trim(),
      hizmetIdleri: manualServiceIds,
      calisanIdleri: manualStaffId ? [manualStaffId] : [staff[0]?.id ?? ""],
      tarihSaat: `${manualDate || "2026-10-21"}T${manualTime || "15:00"}:00.000Z`,
      toplamSureDakika: totalDuration,
      durum: "Onaylandı", // Manuel ve randevusuz gelenler doğrudan onaylıdır (Şartname Bölüm 4)
      kaynak: manualSource,
      not: manualNote.trim() || undefined,
      onaylayanKullaniciId: generateSafeUUID(),
      olusturulmaTarihi: new Date().toISOString(),
    };

    onCreateAppointment(newApp);
    setIsManualModalOpen(false);
    // Sıfırla
    setManualName("");
    setManualPhone("");
    setManualServiceIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">
            Randevu Yönetimi &amp; Takvim
          </h1>
          <p className="text-xs text-text-secondary">
            Gelen randevu taleplerini onaylayın, çalışan atayın veya salona gelen misafirleri kaydedin.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsManualModalOpen(true)}
          className="shadow-xs"
        >
          + Yeni Manuel Randevu Ekle
        </Button>
      </div>

      {/* Durum Filtre Butonları (Mobilde Yatay Kaydırılabilir) */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto whitespace-nowrap scrollbar-none" role="tablist">
        {(["Tümü", "Beklemede", "Onaylandı", "Tamamlandı", "İptal Edildi", "Gelmedi", "Süresi Doldu"] as const).map(
          (status) => {
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-text-primary text-white shadow-xs"
                    : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                {status}
              </button>
            );
          },
        )}
      </div>

      {/* MOBİL KART GÖRÜNÜMÜ (lg:hidden) */}
      <div className="block lg:hidden space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-text-secondary bg-white rounded-xl border border-border text-xs">
            Bu filtreye uygun randevu kaydı bulunamadı.
          </div>
        ) : (
          filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="p-4 bg-white rounded-xl border border-border shadow-xs space-y-3"
            >
              {/* Üstte: Müşteri Adı, Telefon (tıklanabilir tel:) ve Tarih / Saat rozeti */}
              <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                <div>
                  <h3 className="font-serif font-bold text-base text-text-primary">
                    {app.musteriAdSoyad}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <a
                      href={`tel:${app.musteriTelefon.replace(/\s+/g, "")}`}
                      className="text-text-secondary hover:text-accent-gold font-medium flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>📞</span>
                      <span>{app.musteriTelefon}</span>
                    </a>
                    <span>•</span>
                    <Badge variant="gray">{app.kaynak}</Badge>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-secondary text-text-primary border border-border/80">
                    📅 {new Date(app.tarihSaat).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Ortada: Alınan Hizmetler, Atanan Stilist ve Durum Rozeti */}
              <div className="p-3 rounded-lg bg-bg-secondary border border-border/60 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-secondary font-medium">Hizmetler:</span>
                  <span className="font-semibold text-text-primary text-right truncate max-w-[200px]">
                    ✂️ {getServiceNames(app.hizmetIdleri)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-secondary font-medium">Atanan Stilist:</span>
                  <span className="font-semibold text-text-primary text-right">
                    👤 {getStaffNames(app.calisanIdleri)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-text-secondary font-medium">
                    Süre: <strong className="text-accent-gold">{app.toplamSureDakika} dk</strong>
                  </span>
                  <div>
                    {app.durum === "Beklemede" && <Badge variant="amber">Beklemede</Badge>}
                    {app.durum === "Onaylandı" && <Badge variant="green">Onaylandı</Badge>}
                    {app.durum === "Tamamlandı" && <Badge variant="gold">Tamamlandı</Badge>}
                    {app.durum === "İptal Edildi" && <Badge variant="gray">İptal Edildi</Badge>}
                    {app.durum === "Gelmedi" && <Badge variant="pink">Gelmedi</Badge>}
                    {app.durum === "Süresi Doldu" && <Badge variant="gray">Süresi Doldu</Badge>}
                  </div>
                </div>

                {app.not && (
                  <div className="text-[11px] text-text-secondary italic pt-1.5 border-t border-border/40">
                    Not: &ldquo;{app.not}&rdquo;
                  </div>
                )}
              </div>

              {/* Altta: Parmakla kolay basılan aksiyon butonları */}
              <div className="flex items-center gap-2 pt-1">
                {app.durum === "Beklemede" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenApproveModal(app)}
                      className="flex-1 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <span>✓</span>
                      <span>Onayla</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(app)}
                      className="h-11 px-4 rounded-xl bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 border border-red-200 font-semibold text-xs sm:text-sm flex items-center justify-center transition-all"
                    >
                      İptal
                    </button>
                  </>
                )}

                {app.durum === "Onaylandı" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenPOSWithAppointment(app)}
                      className="flex-1 h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <span>💳</span>
                      <span>Kasa Aç (Tahsilat)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetNoShow(app)}
                      className="h-11 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs transition-colors"
                    >
                      Gelmedi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(app)}
                      className="h-11 px-3 text-xs text-text-secondary hover:text-red-600"
                    >
                      İptal
                    </button>
                  </>
                )}

                {app.durum !== "Beklemede" &&
                  app.durum !== "Onaylandı" &&
                  app.durum !== "İptal Edildi" &&
                  app.durum !== "Tamamlandı" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(app)}
                      className="w-full h-10 rounded-lg text-xs text-text-secondary hover:text-red-600 border border-border"
                    >
                      Randevuyu İptal Et
                    </button>
                  )}

                {onDeleteAppointment && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${app.musteriAdSoyad}" randevu kaydını silmek istediğinize emin misiniz?`)) {
                        onDeleteAppointment(app.id);
                      }
                    }}
                    className="h-10 px-3 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
                    title="Randevuyu Sil"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MASAÜSTÜ TABLO GÖRÜNÜMÜ (hidden lg:block) */}
      <div className="hidden lg:block bg-white rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-secondary text-text-secondary font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4">Tarih &amp; Saat</th>
                <th className="py-3 px-4">Hizmetler</th>
                <th className="py-3 px-4">Atanan Stilist</th>
                <th className="py-3 px-4">Süre</th>
                <th className="py-3 px-4">Kaynak</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-secondary">
                    Bu filtreye uygun randevu kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-bg-secondary/60">
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {app.musteriAdSoyad}
                      <span className="text-[11px] text-text-secondary block font-normal">
                        {app.musteriTelefon}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      {new Date(app.tarihSaat).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary max-w-xs truncate">
                      {getServiceNames(app.hizmetIdleri)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      {getStaffNames(app.calisanIdleri)}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">
                      {app.toplamSureDakika} dk
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="gray">{app.kaynak}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.durum === "Beklemede" && <Badge variant="amber">Beklemede</Badge>}
                      {app.durum === "Onaylandı" && <Badge variant="green">Onaylandı</Badge>}
                      {app.durum === "Tamamlandı" && <Badge variant="gold">Tamamlandı</Badge>}
                      {app.durum === "İptal Edildi" && <Badge variant="gray">İptal Edildi</Badge>}
                      {app.durum === "Gelmedi" && <Badge variant="pink">Gelmedi</Badge>}
                      {app.durum === "Süresi Doldu" && <Badge variant="gray">Süresi Doldu</Badge>}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {app.durum === "Beklemede" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenApproveModal(app)}
                          className="h-7 px-2.5 text-xs"
                        >
                          Onayla
                        </Button>
                      )}

                      {app.durum === "Onaylandı" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenPOSWithAppointment(app)}
                            className="h-7 px-2.5 text-xs"
                          >
                            Kasaya Al
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetNoShow(app)}
                            className="h-7 px-2.5 text-xs text-red-600 hover:text-red-700"
                          >
                            Gelmedi
                          </Button>
                        </>
                      )}

                      {app.durum !== "İptal Edildi" && app.durum !== "Tamamlandı" && (
                        <button
                          type="button"
                          onClick={() => handleCancel(app)}
                          className="text-[11px] text-text-secondary hover:text-red-600 px-2 py-1"
                        >
                          İptal
                        </button>
                      )}

                      {onDeleteAppointment && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`"${app.musteriAdSoyad}" randevu kaydını silmek istediğinize emin misiniz?`)) {
                              onDeleteAppointment(app.id);
                            }
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 px-2 py-1 font-semibold"
                          title="Randevuyu Sil"
                        >
                          Sil
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ONAY VE STİLİST ATAMA MODALI */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-3 sm:mx-auto max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[11px] text-accent-gold uppercase font-semibold block">
                Randevu Onaylama &amp; Atama
              </span>
              <h3 className="font-serif text-lg font-bold text-text-primary">
                {approvingApp.musteriAdSoyad}
              </h3>
              <p className="text-xs text-text-secondary">
                {getServiceNames(approvingApp.hizmetIdleri)}
              </p>
            </div>

            {/* Çakışma Uyarısı (Şartname Madde 4) */}
            {hasConflict() && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-900">
                ⚠️ <strong>Çakışma Uyarısı:</strong> Seçilen stilistin bu saatte başka bir onaylı randevusu bulunuyor. Yine de onaylamak istiyorsanız devam edebilirsiniz.
              </div>
            )}

            {/* Çalışan Seçimi (İzinli çalışanlar elenir) */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Görevi Yürütecek Stilistler (Çoklu Seçilebilir)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border rounded-md p-2 bg-white">
                {staff.map((m) => {
                  const isLeave = m.izinli;
                  const isChecked = selectedStaffIds.includes(m.id);

                  if (isLeave) {
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded text-xs opacity-50 bg-bg-secondary"
                      >
                        <span>
                          {m.ad} {m.soyad} ({m.unvan})
                        </span>
                        <Badge variant="pink">İzinli / Raporlu</Badge>
                      </div>
                    );
                  }

                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-bg-secondary text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedStaffIds((prev) =>
                            prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                          );
                        }}
                        className="rounded border-border text-accent-gold focus:ring-accent-gold"
                      />
                      <span className="font-medium text-text-primary">
                        {m.ad} {m.soyad} ({m.unvan})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Süre Uzatma İmkânı (Şartname Madde 4) */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                İşlem Süresi (Uzatma İmkânı - Dakika)
              </label>
              <input
                type="number"
                step={15}
                min={30}
                value={extendedDuration}
                onChange={(e) => setExtendedDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold"
              />
              <span className="text-[11px] text-text-secondary mt-1 block">
                Gerektiğinde saç yoğunluğuna göre süreyi uzatabilirsiniz.
              </span>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApprovingApp(null)}
              >
                Vazgeç
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApproval}
                disabled={selectedStaffIds.length === 0}
              >
                Randevuyu Kesinleştir ✓
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MANUEL RANDEVU EKLEME MODALI */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleCreateManual}
            className="bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-3 sm:mx-auto max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4"
          >
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-accent-gold uppercase font-semibold block">
                  Hızlı Kayıt
                </span>
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Manuel Randevu Oluştur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Müşteri Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Müşteri Ad Soyad"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  required
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Randevu Kaynağı *
                </label>
                <select
                  value={manualSource}
                  onChange={(e) =>
                    setManualSource(e.target.value as "Telefon" | "WhatsApp" | "İşletmeye Geldi")
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                >
                  <option value="Telefon">Telefon</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="İşletmeye Geldi">İşletmeye Geldi (Kapıdan Giriş)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Atanacak Stilist
                </label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                >
                  <option value="">İlk Müsait Uzman</option>
                  {staff
                    .filter((s) => !s.izinli)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ad} {s.soyad} ({s.unvan})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Hizmetleri Seçiniz *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-border rounded-md p-2 bg-white">
                {services.map((s) => {
                  const isChecked = manualServiceIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setManualServiceIds((prev) =>
                            prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                          );
                        }}
                        className="rounded border-border text-accent-gold"
                      />
                      <span className="truncate">
                        {s.ad} ({s.fiyat} ₺)
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  Saat
                </label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Özel Not / İşlem Açıklaması
              </label>
              <textarea
                rows={2}
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Örn: Müşteri acil fön istedi."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>

            {manualSource === "İşletmeye Geldi" && (
              <p className="text-[11px] text-accent-gold">
                ℹ️ &ldquo;İşletmeye Geldi&rdquo; seçildiğinde müşteriye SMS bildirimi gönderilmez, randevu hemen onaylı hale gelir.
              </p>
            )}

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsManualModalOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={manualServiceIds.length === 0}
              >
                Randevuyu Kaydet ✓
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
