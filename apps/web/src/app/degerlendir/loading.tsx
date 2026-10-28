import React from "react";

export default function ReviewLoading() {
  return (
    <div
      role="status"
      aria-label="Değerlendirme sayfası yükleniyor"
      className="min-h-screen flex flex-col bg-bg-primary text-text-primary animate-pulse"
    >
      {/* Header Skeleton */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
        <div className="max-w-2xl mx-auto space-y-3 flex flex-col items-center">
          <div className="w-28 h-5 rounded-full bg-border-main" />
          <div className="w-64 h-8 rounded-lg bg-border-main" />
          <div className="w-48 h-3.5 rounded bg-border-main/70" />
        </div>
      </section>

      {/* Değerlendirme Form Kartı Skeleton */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 flex-1">
        <div className="p-6 sm:p-8 rounded-2xl bg-bg-primary border border-border-main shadow-xs space-y-6">
          <div className="flex justify-center gap-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-9 h-9 rounded-full bg-border-main" />
            ))}
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="w-24 h-3.5 rounded bg-border-main" />
              <div className="h-10 rounded-lg bg-bg-secondary border border-border-main" />
            </div>
            <div className="space-y-1.5">
              <div className="w-24 h-3.5 rounded bg-border-main" />
              <div className="h-28 rounded-lg bg-bg-secondary border border-border-main" />
            </div>
          </div>

          <div className="pt-2">
            <div className="w-full h-11 rounded-lg bg-border-main" />
          </div>
        </div>
      </main>
    </div>
  );
}
