import React from "react";

export default function ProfileLoading() {
  return (
    <div
      role="status"
      aria-label="Profil sayfası yükleniyor"
      className="min-h-screen flex flex-col bg-bg-primary text-text-primary animate-pulse"
    >
      {/* Header Skeleton */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
        <div className="max-w-4xl mx-auto space-y-3 flex flex-col items-center">
          <div className="w-24 h-5 rounded-full bg-border-main" />
          <div className="w-64 h-8 rounded-lg bg-border-main" />
          <div className="w-48 h-3.5 rounded bg-border-main/70" />
        </div>
      </section>

      {/* Profil İçerik Izgarası Skeleton */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sol Kolon: Müşteri Kartı */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border-main shadow-xs space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-border-main" />
              <div className="w-36 h-5 rounded bg-border-main" />
              <div className="w-24 h-4 rounded-full bg-border-main/80" />
            </div>
            <div className="space-y-3 pt-4 border-t border-border-main/60">
              <div className="w-full h-3 rounded bg-border-main/60" />
              <div className="w-3/4 h-3 rounded bg-border-main/60" />
            </div>
          </div>

          {/* Sağ Kolon: Randevular ve Sadakat Kartı */}
          <div className="md:col-span-2 space-y-6">
            {/* Sadakat Puanı Kartı */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-bg-secondary to-bg-primary border border-border-main space-y-3">
              <div className="w-32 h-4 rounded bg-border-main" />
              <div className="w-20 h-8 rounded bg-border-main" />
              <div className="w-48 h-3 rounded bg-border-main/70" />
            </div>

            {/* Randevu Geçmişi Listesi */}
            <div className="p-6 rounded-2xl bg-bg-primary border border-border-main space-y-4">
              <div className="w-40 h-5 rounded bg-border-main" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-bg-secondary border border-border-main/60" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
