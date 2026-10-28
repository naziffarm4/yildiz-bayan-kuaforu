import React from "react";

export default function ServicesLoading() {
  return (
    <div
      role="status"
      aria-label="Hizmetler sayfası yükleniyor"
      className="min-h-screen flex flex-col bg-bg-primary text-text-primary animate-pulse"
    >
      {/* Header Skeleton */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
        <div className="max-w-4xl mx-auto space-y-3 flex flex-col items-center">
          <div className="w-36 h-5 rounded-full bg-border-main" />
          <div className="w-3/4 max-w-lg h-9 rounded-lg bg-border-main" />
          <div className="w-1/2 max-w-md h-3.5 rounded bg-border-main/70" />
        </div>
      </section>

      {/* Kategori Filtre Butonları Skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap gap-2.5 justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-28 h-9 rounded-full bg-border-main" />
          ))}
        </div>
      </div>

      {/* Hizmet Kartları Grid Skeleton */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-bg-primary border border-border-main space-y-4 shadow-xs">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="w-36 h-5 rounded bg-border-main" />
                  <div className="w-20 h-3 rounded bg-border-main/70" />
                </div>
                <div className="w-16 h-6 rounded-full bg-border-main" />
              </div>
              <div className="space-y-2 pt-2 border-t border-border-main/60">
                <div className="w-full h-3 rounded bg-border-main/70" />
                <div className="w-4/5 h-3 rounded bg-border-main/60" />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border-main/60">
                <div className="w-20 h-6 rounded bg-border-main" />
                <div className="w-24 h-8 rounded-lg bg-border-main" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
