import React from "react";

export default function GalleryLoading() {
  return (
    <div
      role="status"
      aria-label="Galeri sayfası yükleniyor"
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-24 h-8 rounded-full bg-border-main" />
          ))}
        </div>
      </div>

      {/* Galeri Grid Skeleton */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-border-main border border-border-main shadow-xs overflow-hidden relative"
            >
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent space-y-1">
                <div className="w-2/3 h-3 rounded bg-white/60" />
                <div className="w-1/3 h-2 rounded bg-white/40" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
