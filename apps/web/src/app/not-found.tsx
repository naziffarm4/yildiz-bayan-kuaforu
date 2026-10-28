import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary px-4 py-16">
      <div className="max-w-lg w-full text-center bg-bg-secondary border border-border-main rounded-2xl p-8 sm:p-12 shadow-sm">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gold border border-gold/30 bg-bg-primary px-4 py-1.5 rounded-full mb-4">
          404 • YILDIZ BAYAN KUAFÖRÜ
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight mb-3">
          Sayfa Bulunamadı
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8">
          Aradığınız sayfa taşınmış, kaldırılmış veya geçici olarak kullanım dışı
          olabilir. Salonumuzun hizmetlerini inceleyebilir veya hemen online
          randevunuzu oluşturabilirsiniz.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm bg-bg-primary text-dark border border-border-main hover:border-gold transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/randevu"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm bg-primary text-bg-primary hover:bg-primary-hover transition-colors"
          >
            Online Randevu Al
          </Link>
        </div>
      </div>
    </main>
  );
}
