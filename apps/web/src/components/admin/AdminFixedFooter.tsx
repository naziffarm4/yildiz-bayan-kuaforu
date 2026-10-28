"use client";

import React from "react";
import type { AdminTab } from "./AdminTopbar";

interface AdminFixedFooterProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingCount: number;
  criticalStockCount: number;
}

export const AdminFixedFooter: React.FC<AdminFixedFooterProps> = ({
  currentTab,
  onTabChange,
  pendingCount,
  criticalStockCount,
}) => {
  // Tam 4 İkon: Özet, Randevular, Kasa POS, Stok
  const tabs: {
    id: AdminTab;
    label: string;
    badge?: number;
    badgeColor?: "amber" | "red";
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Özet",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3v-8zm7-10h4v18h-4V3zm7 6h4v12h-4V9z" />
        </svg>
      ),
    },
    {
      id: "appointments",
      label: "Randevular",
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
      label: "Kasa POS",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: "stock",
      label: "Stok",
      badge: criticalStockCount,
      badgeColor: "red",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      aria-label="Yönetim Paneli Sabit Hızlı Erişim"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur-md border-t border-border shadow-lg"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-around gap-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all ${
                isActive
                  ? "bg-text-primary text-white shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] sm:text-xs mt-1 font-medium">{tab.label}</span>

              {/* Bildirim Rozetleri */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`absolute -top-1 right-2 sm:right-6 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    tab.badgeColor === "red"
                      ? "bg-red-600 text-white"
                      : isActive
                        ? "bg-accent-gold text-white"
                        : "bg-amber-500 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
