"use client";

import React, { useState } from "react";
import type { StaffProfile, CashPayment } from "@yildiz/types";
import { calculateCommission, formatTRY, generateSafeUUID } from "@yildiz/types";
import { Card } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";

export interface StaffCommissionManagerProps {
  staff: StaffProfile[];
  payments: CashPayment[];
  userRole: "Admin" | "Calisan";
  onToggleLeave: (staffId: string) => void;
  activeStaffId: string;
  onAddStaff?: (newStaff: StaffProfile) => void;
}

export const StaffCommissionManager: React.FC<StaffCommissionManagerProps> = ({
  staff,
  payments,
  userRole,
  onToggleLeave,
  activeStaffId,
  onAddStaff,
}) => {
  // Çalışan modunda sadece kendi hakedişini görebilir (Şartname Bölüm 3)
  const displayedStaff =
    userRole === "Calisan" ? staff.filter((s) => s.id === activeStaffId) : staff;

  // Yeni Çalışan Ekleme State'i
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");
  const [unvan, setUnvan] = useState("Usta Kuaför & Stilist");
  const [rol, setRol] = useState<"Admin" | "Calisan">("Calisan");
  const [komisyonOrani, setKomisyonOrani] = useState<number>(20);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim() || !soyad.trim() || !telefon.trim()) return;

    const newStaffMember: StaffProfile = {
      id: generateSafeUUID(),
      ad: ad.trim(),
      soyad: soyad.trim(),
      unvan: unvan.trim(),
      telefon: telefon.trim(),
      eposta: eposta.trim() || `${ad.toLowerCase()}@yildizkuafor.com`,
      rol,
      komisyonOrani,
      aktif: true,
      izinli: false,
      yetkinlikHizmetIdleri: [],
      avatar: rol === "Admin" ? "👑" : "✂️",
    };

    if (onAddStaff) {
      onAddStaff(newStaffMember);
    }

    setAd("");
    setSoyad("");
    setTelefon("");
    setEposta("");
    setUnvan("Usta Kuaför & Stilist");
    setKomisyonOrani(20);
    setIsAddingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">
            Personel &amp; Hakediş / Komisyon Yönetimi
          </h1>
          <p className="text-xs text-text-secondary">
            {userRole === "Admin"
              ? "Tüm personelin komisyon oranları, izin/rapor durumları ve net hakedişleri."
              : "Kişisel komisyon oranınız ve bu döneme ait net hakedişiniz."}
          </p>
        </div>

        {/* Yeni Çalışan Ekle Butonu (Sadece Admin Yetkisinde) */}
        {userRole === "Admin" && onAddStaff && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddingModalOpen(true)}
            className="text-xs font-bold shadow-xs whitespace-nowrap"
          >
            + Yeni Çalışan Ekle
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedStaff.map((member) => {
          // Bu çalışanın yaptığı işlemlerden üretilen toplam ciro
          const memberPayments = payments.filter((p) => p.islemiYapanCalisanId === member.id);
          const memberTotalRevenue = memberPayments.reduce((acc, curr) => acc + curr.odenenTutar, 0);
          const netCommission = calculateCommission(memberTotalRevenue, member.komisyonOrani);

          return (
            <Card
              key={member.id}
              className={`p-6 bg-white border transition-all ${
                member.izinli ? "border-amber-300 bg-amber-50/20" : "border-border shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-2xl">
                    {member.avatar ?? "💇‍♀️"}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-text-primary">
                      {member.ad} {member.soyad}
                    </h3>
                    <p className="text-xs text-accent-gold font-medium">{member.unvan}</p>
                  </div>
                </div>

                <Badge variant={member.rol === "Admin" ? "gold" : "pink"}>
                  {member.rol}
                </Badge>
              </div>

              {/* İzin / Durum Göstergesi */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">Çalışma Durumu:</span>
                {member.izinli ? (
                  <Badge variant="pink">İzinli / Raporlu (Randevu Alınamaz)</Badge>
                ) : (
                  <Badge variant="green">Aktif &amp; Görevde</Badge>
                )}
              </div>

              {/* Komisyon ve Ciro Özeti */}
              <div className="mt-4 p-3.5 rounded-lg bg-bg-secondary border border-border/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Komisyon Oranı:</span>
                  <span className="font-bold text-text-primary">%{member.komisyonOrani}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tamamlanan İşlem:</span>
                  <span className="font-medium text-text-primary">{memberPayments.length} Adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Hizmet Cirosu:</span>
                  <span className="font-medium text-text-primary">{formatTRY(memberTotalRevenue)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-border/60 font-serif text-sm font-bold">
                  <span>Net Hakediş:</span>
                  <span className="text-accent-gold">{formatTRY(netCommission)}</span>
                </div>
              </div>

              {/* İzin / Rapor Durum Değiştirme Butonu (Sadece Admin yetkisi) */}
              {userRole === "Admin" && (
                <div className="mt-5 pt-3 border-t border-border">
                  <Button
                    variant={member.izinli ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => onToggleLeave(member.id)}
                    className="w-full text-xs"
                  >
                    {member.izinli ? "İzni Sonlandır (Aktif Yap)" : "İzin / Raporlu İşaretle"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* YENİ ÇALIŞAN EKLEME MODALI */}
      {isAddingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsAddingModalOpen(false)}
        >
          <div
            className="bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-3 sm:mx-auto max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent-gold block">
                  İnsan Kaynakları
                </span>
                <h3 className="font-serif text-lg font-bold text-text-primary mt-0.5">
                  Yeni Kuaför / Personel Ekle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingModalOpen(false)}
                className="p-1 rounded-full text-text-secondary hover:text-text-primary font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-text-primary mb-1">Ad *</label>
                  <input
                    type="text"
                    required
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    placeholder="Ad"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-text-primary mb-1">Soyad *</label>
                  <input
                    type="text"
                    required
                    value={soyad}
                    onChange={(e) => setSoyad(e.target.value)}
                    placeholder="Soyad"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-text-primary mb-1">Telefon *</label>
                  <input
                    type="tel"
                    required
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-text-primary mb-1">E-posta</label>
                  <input
                    type="email"
                    value={eposta}
                    onChange={(e) => setEposta(e.target.value)}
                    placeholder="ornek@yildizkuafor.com"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-primary mb-1">Uzmanlık / Unvan *</label>
                <input
                  type="text"
                  required
                  value={unvan}
                  onChange={(e) => setUnvan(e.target.value)}
                  placeholder="Örn: Kıdemli Renklendirme Uzmanı"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-text-primary mb-1">Yetki Rolü *</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as "Admin" | "Calisan")}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                  >
                    <option value="Calisan">✂️ Çalışan Kuaför</option>
                    <option value="Admin">👑 Salon Yöneticisi (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-text-primary mb-1">Komisyon Oranı (%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={komisyonOrani}
                    onChange={(e) => setKomisyonOrani(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingModalOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">
                  Personeli Kaydet ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
