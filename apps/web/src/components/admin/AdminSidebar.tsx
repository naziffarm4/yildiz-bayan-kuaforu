"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@yildiz/ui";
import type { AdminTab } from "./AdminTopbar";

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingCount: number;
  criticalStockCount: number;
  userRole: "Admin" | "Calisan";
  onToggleRole: (role: "Admin" | "Calisan") => void;
  activeStaffName: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  criticalStockCount,
  userRole,
  onToggleRole,
  activeStaffName,
}) => {
  const menuItems: {
    id: AdminTab;
    label: string;
    badge?: number;
    badgeColor?: "amber" | "red";
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard / Özet",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3v-8zm7-10h4v18h-4V3zm7 6h4v12h-4V9z" />
        </svg>
      ),
    },
    {
      id: "appointments",
      label: "Randevu Takvimi",
      badge: pendingCount,
      badgeColor: "amber",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "pos",
      label: "Kasa & POS Sistemi",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: "services",
      label: "Hizmet & Fiyatlar",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242L10.5 10.5m1.5 1.5L9.121 9.121a3 3 0 10-4.242 4.242L7.5 16.5" />
        </svg>
      ),
    },
    {
      id: "stock",
      label: "Stok & Sarf Malzeme",
      badge: criticalStockCount,
      badgeColor: "red",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l8 4" />
        </svg>
      ),
    },
    {
      id: "suppliers",
      label: "Tedarikçiler",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
    },
    {
      id: "staff",
      label: "Personel & Hakediş",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "gallery",
      label: "Galeri & Lookbook",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "reviews",
      label: "Müşteri Yorumları",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Site & CMS Ayarları",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Yönetim Paneli Sol Sabit Menü"
      className="fixed top-0 left-0 bottom-0 w-64 z-40 hidden lg:flex flex-col border-r border-border bg-bg-primary select-none"
    >
      {/* Üst Logo ve Başlık */}
      <div className="h-16 px-6 border-b border-border flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-3 group focus:outline-none">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border bg-bg-secondary shadow-xs group-hover:scale-105 transition-transform">
            <Image
              src="/yildiz-logo.png"
              alt="Yıldız Bayan Kuaförü"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div>
            <span className="font-serif text-base font-bold tracking-widest text-text-primary block leading-none">
              YILDIZ KUAFÖR
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-accent-gold font-semibold block mt-1">
              Yönetim Masası
            </span>
          </div>
        </Link>
      </div>

      {/* Navigasyon Sekmeleri */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-text-primary text-white shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-accent-gold" : "text-text-secondary"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor === "red"
                      ? "bg-red-600 text-white"
                      : isActive
                        ? "bg-accent-gold text-white"
                        : "bg-amber-500 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* En Alt: Aktif Personel & Rol Durumu */}
      <div className="p-4 border-t border-border bg-bg-primary">
        <div className="p-3 rounded-xl bg-white border border-border shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-text-secondary block font-medium leading-none">
              Aktif Kullanıcı
            </span>
            <span className="font-serif font-bold text-xs text-text-primary block truncate mt-0.5">
              {activeStaffName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleRole(userRole === "Admin" ? "Calisan" : "Admin")}
            className="focus:outline-none shrink-0"
            title="Aktif görünüm rolünü değiştir"
          >
            <Badge
              variant={userRole === "Admin" ? "gold" : "pink"}
              className="cursor-pointer text-[10px] px-2 py-0.5"
            >
              {userRole === "Admin" ? "👑 Admin" : "✂️ Çalışan"}
            </Badge>
          </button>
        </div>
      </div>
    </aside>
  );
};
