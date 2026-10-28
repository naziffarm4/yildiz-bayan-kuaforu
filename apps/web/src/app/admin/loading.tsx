import React from "react";

export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Yönetim Paneli Yükleniyor"
      className="min-h-screen bg-bg-primary text-text-primary p-4 sm:p-8 space-y-6 animate-pulse"
    >
      {/* Üst Bar Skeleton */}
      <div className="h-16 rounded-xl border border-border-main bg-bg-primary p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-border-main" />
          <div className="space-y-1.5">
            <div className="w-28 h-3.5 rounded bg-border-main" />
            <div className="w-16 h-2 rounded bg-border-main/70" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-8 rounded-md bg-border-main" />
          <div className="w-20 h-8 rounded-md bg-border-main" />
        </div>
      </div>

      {/* 4'lü KPI Kartı Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-border-main bg-bg-primary space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3 rounded bg-border-main" />
              <div className="w-6 h-6 rounded-full bg-border-main" />
            </div>
            <div className="w-32 h-6 rounded bg-border-main" />
            <div className="w-40 h-2.5 rounded bg-border-main/60" />
          </div>
        ))}
      </div>

      {/* Tablo / İçerik Alanı Skeleton */}
      <div className="rounded-xl border border-border-main bg-bg-primary p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border-main pb-4">
          <div className="w-48 h-4 rounded bg-border-main" />
          <div className="w-24 h-3 rounded bg-border-main" />
        </div>

        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-bg-secondary border border-border-main/60 flex items-center justify-between px-4"
            >
              <div className="w-36 h-3 rounded bg-border-main" />
              <div className="w-20 h-3 rounded bg-border-main/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
