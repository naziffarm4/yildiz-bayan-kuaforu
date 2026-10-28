import React from "react";
import Image from "next/image";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-md"
    >
      <div className="relative flex flex-col items-center space-y-6">
        {/* Dönen Zarif Halka & Logo */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border border-dashed border-secondary/40 animate-[spin_4s_linear_infinite_reverse]" />

          {/* Merkezde Yıldız Logosu */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden border border-border-main bg-bg-secondary shadow-sm flex items-center justify-center p-1.5 animate-pulse">
            <Image
              src="/yildiz-logo.png"
              alt="Yıldız Bayan Kuaförü"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Tipografi & Minimalist Gösterge */}
        <div className="text-center space-y-1.5">
          <span className="font-serif text-lg font-bold tracking-[0.3em] uppercase text-dark block leading-none">
            YILDIZ
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-primary font-medium block">
            Haute Coiffure
          </span>
          <div className="pt-2 flex items-center justify-center gap-1.5 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
