"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, Button } from "@yildiz/ui";

export type AdminTab =
  | "dashboard"
  | "appointments"
  | "pos"
  | "services"
  | "staff"
  | "stock"
  | "suppliers"
  | "gallery"
  | "reviews"
  | "settings";

interface AdminTopbarProps {
  userRole: "Admin" | "Calisan";
  onToggleRole: (newRole: "Admin" | "Calisan") => void;
  onOpenDrawer: () => void;
  activeStaffName: string;
  onOpenQuickPOS?: () => void;
  onOpenManualAppointment?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  userRole,
  onToggleRole,
  onOpenDrawer,
  activeStaffName,
  onOpenQuickPOS,
  onOpenManualAppointment,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-bg-primary/95 backdrop-blur-md border-b border-border h-16 px-4 sm:px-8 flex items-center justify-between transition-colors max-w-full">
      {/* SOL: Mobilde Hamburger + Logo / Masaüstünde Hızlı Aksiyon Butonları */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobilde Hamburger Menü Butonu (lg:hidden) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="p-1.5 sm:p-2 rounded-lg text-text-primary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-colors flex items-center gap-1.5 lg:hidden"
          aria-label="Yönetim Menüsünü Aç"
          title="Menüyü Aç"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs font-bold text-text-primary hidden sm:inline">Menü</span>
        </button>

        {/* Mobilde Logo & Başlık (lg:hidden - Masaüstünde sol sidebar'da mevcut) */}
        <Link
          href="/admin"
          className="flex items-center gap-2 group focus:outline-none shrink-0 border-l border-border pl-2 sm:pl-3 lg:hidden"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border bg-bg-secondary shadow-xs group-hover:scale-105 transition-transform">
            <Image
              src="/yildiz-logo.png"
              alt="Yıldız Bayan Kuaförü"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div>
            <span className="font-serif text-sm font-bold tracking-widest text-text-primary block leading-none">
              YILDIZ
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-accent-gold font-semibold block mt-0.5">
              Admin Masası
            </span>
          </div>
        </Link>

        {/* Masaüstü Hızlı Aksiyon Butonları (hidden lg:flex) */}
        <div className="hidden lg:flex items-center gap-2.5">
          {onOpenManualAppointment && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenManualAppointment}
              className="text-xs h-9 px-3 font-semibold text-text-primary border-border hover:bg-bg-secondary"
            >
              + Manuel Randevu
            </Button>
          )}
          {onOpenQuickPOS && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenQuickPOS}
              className="text-xs h-9 px-3.5 font-bold shadow-xs"
            >
              ⚡ Hızlı Kasa
            </Button>
          )}
        </div>
      </div>

      {/* SAĞ: AKTİF PERSONEL / ROL ROZETİ & WEB'E DÖN LİNKİ */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Aktif Personel & Mini Rol Rozeti */}
        <div className="flex items-center gap-2 border-r border-border pr-2 sm:pr-4">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-text-secondary block leading-none">Personel</span>
            <span className="font-serif font-bold text-xs sm:text-sm text-text-primary">
              {activeStaffName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleRole(userRole === "Admin" ? "Calisan" : "Admin")}
            className="focus:outline-none"
            title="Tıklayarak rol simülasyonunu değiştir (Admin / Çalışan)"
          >
            <Badge variant={userRole === "Admin" ? "gold" : "pink"} className="cursor-pointer text-[10px] sm:text-xs px-2 py-0.5">
              {userRole === "Admin" ? "👑 Admin" : "✂️ Çalışan"}
            </Badge>
          </button>
        </div>

        {/* Web Sitesine Dönüş Linki */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors border border-border bg-white shadow-2xs"
          title="Müşteri Web Sitesine Git"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Web&apos;e Dön</span>
          <span className="sm:hidden">Site</span>
        </Link>
      </div>
    </header>
  );
};
