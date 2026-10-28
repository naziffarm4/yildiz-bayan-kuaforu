import React from "react";

export default function ContactLoading() {
  return (
    <div
      role="status"
      aria-label="İletişim sayfası yükleniyor"
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
        {/* Üst Başlık Skeleton */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
          <div className="max-w-4xl mx-auto space-y-3 flex flex-col items-center">
            <div className="w-36 h-5 rounded-full bg-border-main" />
            <div className="w-3/4 max-w-lg h-9 rounded-lg bg-border-main" />
            <div className="w-1/2 max-w-md h-3.5 rounded bg-border-main/70" />
          </div>
        </section>

        {/* Ana İçerik Izgarası Skeleton */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* SOL: İletişim Bilgileri Skeleton */}
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-bg-primary border border-border-main space-y-4">
                <div className="w-28 h-3 rounded bg-border-main" />
                <div className="w-44 h-6 rounded bg-border-main" />
                <div className="w-3/4 h-3.5 rounded bg-border-main/70" />
                <div className="pt-2 flex gap-3">
                  <div className="w-24 h-8 rounded bg-border-main" />
                  <div className="w-24 h-8 rounded bg-border-main" />
                </div>
              </div>
            </div>

            {/* SAĞ: Form Skeleton */}
            <div className="p-8 rounded-2xl bg-bg-primary border border-border-main space-y-5">
              <div className="w-36 h-5 rounded bg-border-main" />
              <div className="space-y-4">
                <div className="h-10 rounded-lg bg-bg-secondary border border-border-main" />
                <div className="h-10 rounded-lg bg-bg-secondary border border-border-main" />
                <div className="h-24 rounded-lg bg-bg-secondary border border-border-main" />
                <div className="w-full h-11 rounded-lg bg-border-main" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
