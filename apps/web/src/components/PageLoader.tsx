"use client";

import React from "react";
import Image from "next/image";

export interface PageLoaderProps {
  variant?: "fullscreen" | "modal";
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  variant = "fullscreen",
  message,
}) => {
  if (variant === "modal") {
    return (
      <div
        role="status"
        aria-label="Yükleniyor"
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/25 p-4 transition-all duration-300"
      >
        <div className="bg-bg-primary/95 rounded-2xl p-6 sm:p-7 border border-border-main shadow-2xl flex flex-col items-center justify-center space-y-4 max-w-xs w-full">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-bg-primary p-1 border border-border-main shadow-xs animate-pulse">
              <Image
                src="/yildiz-logo.png"
                alt="Yıldız Bayan Kuaförü"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <span className="font-serif text-base tracking-widest text-dark font-bold block leading-none">
              YILDIZ
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-primary font-semibold block">
              Haute Coiffure
            </span>
            {message && (
              <p className="text-xs text-text-secondary mt-1 font-sans">{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary transition-opacity duration-500"
    >
      {/* İnce zarif arka plan ışıltısı */}
      <div className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center space-y-4">
        {/* Dönen & Parıldayan Halka ve Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />

          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-bg-primary p-1.5 border border-border-main shadow-xs animate-pulse">
            <Image
              src="/yildiz-logo.png"
              alt="Yıldız Bayan Kuaförü"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
        </div>

        {/* Tipografi */}
        <div className="text-center space-y-1">
          <span className="font-serif text-xl tracking-widest text-dark font-bold block leading-none">
            YILDIZ
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold block">
            Haute Coiffure
          </span>
          {message && (
            <p className="text-xs text-text-secondary mt-2 max-w-xs text-center font-sans">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
