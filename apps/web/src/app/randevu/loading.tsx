import React from "react";

export default function BookingLoading() {
  return (
    <div
      role="status"
      aria-label="Randevu sihirbazı yükleniyor"
      className="min-h-screen flex flex-col bg-bg-primary text-text-primary animate-pulse"
    >
      {/* Header Skeleton */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
        <div className="max-w-3xl mx-auto space-y-3 flex flex-col items-center">
          <div className="w-32 h-5 rounded-full bg-border-main" />
          <div className="w-2/3 max-w-md h-8 rounded-lg bg-border-main" />
          <div className="w-1/2 max-w-sm h-3.5 rounded bg-border-main/70" />
        </div>
      </section>

      {/* Randevu Adımları İlerleme Çubuğu Skeleton */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-8">
        <div className="flex justify-between items-center px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-border-main" />
              <div className="w-16 h-2.5 rounded bg-border-main/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Randevu Kartı Skeleton */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        <div className="p-6 sm:p-8 rounded-2xl bg-bg-primary border border-border-main shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="w-40 h-6 rounded bg-border-main" />
            <div className="w-64 h-3.5 rounded bg-border-main/60" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border-main bg-bg-secondary space-y-2">
                <div className="w-28 h-4 rounded bg-border-main" />
                <div className="w-16 h-3 rounded bg-border-main/60" />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border-main flex justify-between">
            <div className="w-24 h-10 rounded-lg bg-border-main" />
            <div className="w-32 h-10 rounded-lg bg-border-main" />
          </div>
        </div>
      </main>
    </div>
  );
}
