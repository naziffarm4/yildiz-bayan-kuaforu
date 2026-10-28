"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Çalışma zamanı hatası yakalandı:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary px-4 py-16">
      <div className="max-w-lg w-full text-center bg-bg-secondary border border-border-main rounded-2xl p-8 sm:p-12 shadow-sm">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 bg-bg-primary px-4 py-1.5 rounded-full mb-4">
          Sistem Uyarısı • YILDIZ BAYAN KUAFÖRÜ
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-dark tracking-tight mb-3">
          Beklenmeyen Bir Hata Oluştu
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8">
          İşleminiz sırasında geçici bir teknik aksaklık yaşandı. Lütfen sayfayı
          yeniden yüklemeyi deneyin veya ana sayfaya dönerek işleminize devam
          edin.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm bg-primary text-bg-primary hover:bg-primary-hover transition-colors"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm bg-bg-primary text-dark border border-border-main hover:border-gold transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </main>
  );
}
