import React from "react";
import type {
  AppointmentItem,
  CashPayment,
  StockItem,
  ServiceItem,
  StaffProfile,
} from "@yildiz/types";
import { Card } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

export interface AdminDashboardProps {
  appointments: AppointmentItem[];
  payments: CashPayment[];
  stockItems: StockItem[];
  services: ServiceItem[];
  staff: StaffProfile[];
  onNavigateToTab: (tab: "appointments" | "pos" | "stock") => void;
  onOpenQuickPOS: () => void;
  onOpenApproveModal: (appointment: AppointmentItem) => void;
  onOpenPOSWithAppointment: (appointment: AppointmentItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  appointments,
  payments,
  stockItems,
  services,
  staff,
  onNavigateToTab,
  onOpenQuickPOS,
  onOpenApproveModal,
  onOpenPOSWithAppointment,
}) => {
  // Metrikler
  const totalDailyRevenue = payments.reduce((acc, curr) => acc + curr.odenenTutar, 0);
  const pendingAppointments = appointments.filter((a) => a.durum === "Beklemede");
  const completedAppointments = appointments.filter((a) => a.durum === "Tamamlandı");
  const criticalStocks = stockItems.filter((s) => s.miktar <= s.kritikSeviye);

  const getServiceNames = (ids: string[]) => {
    return ids
      .map((id) => services.find((s) => s.id === id)?.ad)
      .filter(Boolean)
      .join(", ");
  };

  const getStaffName = (ids: string[]) => {
    if (ids.length === 0) return "Atanmadı";
    const found = staff.find((s) => s.id === ids[0]);
    return found ? `${found.ad} ${found.soyad}` : "Uzman";
  };

  return (
    <div className="space-y-8">
      {/* Üst Karşılama ve Hızlı Aksiyon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">
            Salon Genel Bakış &amp; Durum
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Bugünün randevuları, kasa tahsilatları ve operasyonel göstergeleri.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenQuickPOS}
          className="shadow-sm"
        >
          ⚡ Randevusuz Müşteri / Hızlı Kasa Aç
        </Button>
      </div>

      {/* KPI İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Günlük Ciro / Kasa
            </span>
            <span className="text-xl">💰</span>
          </div>
          <div className="mt-3">
            <span className="font-serif text-2xl font-bold text-text-primary">
              {totalDailyRevenue.toLocaleString("tr-TR")} ₺
            </span>
            <span className="text-[11px] text-emerald-700 block mt-1 font-medium">
              ✓ {payments.length} adet tahsilat işlemi
            </span>
          </div>
        </Card>

        <Card
          className="p-5 bg-white border-border cursor-pointer hover:border-accent-gold transition-colors"
          onClick={() => onNavigateToTab("appointments")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Onay Bekleyenler
            </span>
            <span className="text-xl">⏳</span>
          </div>
          <div className="mt-3">
            <span className="font-serif text-2xl font-bold text-amber-700">
              {pendingAppointments.length}
            </span>
            <span className="text-[11px] text-amber-800 block mt-1 font-medium">
              30 dk slot blokajı devrede →
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-white border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Tamamlanan Randevular
            </span>
            <span className="text-xl">✂️</span>
          </div>
          <div className="mt-3">
            <span className="font-serif text-2xl font-bold text-text-primary">
              {completedAppointments.length}
            </span>
            <span className="text-[11px] text-text-secondary block mt-1">
              Bugün işlem gören müşteri sayısı
            </span>
          </div>
        </Card>

        <Card
          className="p-5 bg-white border-border cursor-pointer hover:border-amber-500 transition-colors"
          onClick={() => onNavigateToTab("stock")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Kritik Stok Uyarısı
            </span>
            <span className="text-xl">📦</span>
          </div>
          <div className="mt-3">
            <span className="font-serif text-2xl font-bold text-red-600">
              {criticalStocks.length} Ürün
            </span>
            <span className="text-[11px] text-red-700 block mt-1 font-medium">
              Kritik eşiğin altına indi →
            </span>
          </div>
        </Card>
      </div>

      {/* Bekleyen & Yaklaşan Randevular Tablosu */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-text-primary">
              Yaklaşan &amp; İşlem Bekleyen Randevular
            </h2>
            <p className="text-xs text-text-secondary">
              Personel onayları ve kasaya aktarım işlemlerini buradan yönetebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab("appointments")}
            className="text-xs font-semibold text-accent-gold hover:underline"
          >
            Tüm Takvimi Gör ({appointments.length}) →
          </button>
        </div>

        {/* Mobilde Dokunmatik Randevu Kartları */}
        <div className="block md:hidden divide-y divide-border/60">
          {appointments.slice(0, 5).map((app) => (
            <div key={app.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-sm text-text-primary">
                    {app.musteriAdSoyad}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                    <a
                      href={`tel:${app.musteriTelefon.replace(/\s+/g, "")}`}
                      className="text-text-secondary hover:text-accent-gold underline underline-offset-2"
                    >
                      📞 {app.musteriTelefon}
                    </a>
                    <span>•</span>
                    <Badge variant="gray">{app.kaynak}</Badge>
                  </div>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-bg-secondary text-text-primary border border-border/80">
                  📅 {new Date(app.tarihSaat).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-bg-secondary border border-border/60 text-xs space-y-1">
                <div className="text-text-secondary">
                  ✂️ <strong className="text-text-primary">{getServiceNames(app.hizmetIdleri)}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary">
                  <span>👤 Stilist: {getStaffName(app.calisanIdleri)}</span>
                  <span>⏱️ {app.toplamSureDakika} dk</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  {app.durum === "Beklemede" && <Badge variant="amber">Beklemede</Badge>}
                  {app.durum === "Onaylandı" && <Badge variant="green">Onaylandı</Badge>}
                  {app.durum === "Tamamlandı" && <Badge variant="gold">Tamamlandı</Badge>}
                  {app.durum === "İptal Edildi" && <Badge variant="gray">İptal Edildi</Badge>}
                </div>

                <div className="flex gap-2">
                  {app.durum === "Beklemede" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenApproveModal(app)}
                      className="text-xs h-9 px-3.5 font-bold"
                    >
                      Onayla ✓
                    </Button>
                  )}
                  {app.durum === "Onaylandı" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenPOSWithAppointment(app)}
                      className="text-xs h-9 px-3.5 font-bold"
                    >
                      💳 Kasaya Al
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Masaüstü Tablo Görünümü */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-secondary text-text-secondary font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4">Tarih &amp; Saat</th>
                <th className="py-3 px-4">Hizmetler</th>
                <th className="py-3 px-4">Stilist</th>
                <th className="py-3 px-4">Süre</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.slice(0, 5).map((app) => (
                <tr key={app.id} className="hover:bg-bg-secondary/50">
                  <td className="py-3.5 px-4 font-semibold text-text-primary">
                    {app.musteriAdSoyad}
                    <span className="text-[11px] text-text-secondary block font-normal">
                      {app.musteriTelefon} ({app.kaynak})
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
                    {getStaffName(app.calisanIdleri)}
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">
                    {app.toplamSureDakika} dk
                  </td>
                  <td className="py-3.5 px-4">
                    {app.durum === "Beklemede" && (
                      <Badge variant="amber">Beklemede</Badge>
                    )}
                    {app.durum === "Onaylandı" && (
                      <Badge variant="green">Onaylandı</Badge>
                    )}
                    {app.durum === "Tamamlandı" && (
                      <Badge variant="gold">Tamamlandı</Badge>
                    )}
                    {app.durum === "İptal Edildi" && (
                      <Badge variant="gray">İptal Edildi</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {app.durum === "Beklemede" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onOpenApproveModal(app)}
                        className="text-xs h-7 px-2.5"
                      >
                        Onayla
                      </Button>
                    )}
                    {app.durum === "Onaylandı" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenPOSWithAppointment(app)}
                        className="text-xs h-7 px-2.5"
                      >
                        Kasaya Al
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
