import React from "react";

export default function AboutLoading() {
  return (
    <div
      role="status"
      aria-label="Hakkımızda sayfası yükleniyor"
      className="min-h-screen flex flex-col bg-bg-primary text-text-primary animate-pulse"
    >
      {/* Navbar Skeleton Placeholder */}
      <div className="h-20 border-b border-border-main bg-bg-primary/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="w-32 h-6 rounded-md bg-border-main" />
        <div className="hidden sm:flex gap-6">
          <div className="w-16 h-4 rounded bg-border-main/60" />
          <div className="w-16 h-4 rounded bg-border-main/60" />
          <div className="w-16 h-4 rounded bg-border-main/60" />
        </div>
      </div>

      <main className="flex-1 pt-4">
        {/* Editorial Üst Manşet Skeleton */}
        <section className="py-20 sm:py-28 bg-bg-secondary border-b border-border-main">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 flex flex-col items-center">
            <div className="w-44 h-6 rounded-full bg-border-main" />
            <div className="w-3/4 max-w-xl h-10 sm:h-12 rounded-lg bg-border-main" />
            <div className="w-1/2 max-w-md h-4 rounded bg-border-main/70" />
          </div>
        </section>

        {/* Dergi Röportajı Mizanpajı Skeleton */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Sol Görsel Skeleton */}
            <div className="lg:col-span-5 relative">
              <div className="h-[480px] w-full rounded-2xl bg-border-main border border-border-main shadow-xl" />
              <div className="absolute -bottom-6 -right-6 bg-bg-primary p-6 rounded-2xl border border-border-main shadow-lg hidden sm:block w-64 space-y-2">
                <div className="w-24 h-3 rounded bg-border-main" />
                <div className="w-full h-2.5 rounded bg-border-main/60" />
                <div className="w-3/4 h-2.5 rounded bg-border-main/60" />
              </div>
            </div>

            {/* Sağ Metin Alanı Skeleton */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="w-32 h-4 rounded bg-border-main" />
                <div className="w-full h-8 rounded bg-border-main" />
                <div className="w-4/5 h-8 rounded bg-border-main" />
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="w-full h-3.5 rounded bg-border-main/70" />
                <div className="w-full h-3.5 rounded bg-border-main/70" />
                <div className="w-5/6 h-3.5 rounded bg-border-main/70" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
