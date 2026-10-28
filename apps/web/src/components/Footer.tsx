"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatFacebookUrl } from "@yildiz/types";
import { useContent } from "../lib/content-context";

export const Footer: React.FC = () => {
  const { salonInfo } = useContent();

  return (
    <footer className="bg-bg-secondary border-t border-border-main pt-16 pb-12 text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border/80">
          {/* 1. Sütun: Logo & Slogan */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border bg-bg-primary">
                <Image
                  src="/yildiz-logo.png"
                  alt="Yıldız Bayan Kuaförü"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-widest block leading-none">
                  YILDIZ
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-accent-gold font-semibold">
                  Haute Coiffure
                </span>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-serif italic">
              &ldquo;{salonInfo.slogan}&rdquo;
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Kadıköy Bağdat Caddesi’nde lüks butik kuaför ve editorial saç tasarım salonu.
            </p>
          </div>

          {/* 2. Sütun: Sayfa Bağlantıları */}
          <div>
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.15em] text-text-primary mb-4">
              Keşfet
            </h4>
            <ul className="space-y-2.5 text-xs text-text-secondary font-medium">
              <li>
                <Link href="/" className="hover:text-text-primary transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/hizmetler" className="hover:text-text-primary transition-colors">
                  Hizmetler &amp; Bakım
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="hover:text-text-primary transition-colors">
                  Galeri &amp; Lookbook
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-text-primary transition-colors">
                  Hikayemiz &amp; Vizyon
                </Link>
              </li>
              <li>
                <Link href="/randevu" className="hover:text-accent-gold transition-colors font-semibold">
                  Online Randevu Masası
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Sütun: Çalışma Saatleri & Konum */}
          <div>
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.15em] text-text-primary mb-4">
              Salon Saatleri &amp; Adres
            </h4>
            <a
              href="https://maps.google.com/?cid=8333635848754942930"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-secondary mb-3 leading-relaxed block hover:text-accent-gold transition-colors group"
              title="Google Haritalar'da Yol Tarifi Al"
            >
              📍 {salonInfo.adres} <span className="text-[10px] text-accent-gold underline font-semibold ml-1 group-hover:text-accent-gold-hover">(Yol Tarifi Al)</span>
            </a>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex justify-between">
                <span>Hafta İçi:</span>
                <span className="font-semibold text-text-primary">{salonInfo.calismaSaatleri.haftaIci}</span>
              </li>
              <li className="flex justify-between">
                <span>Cumartesi:</span>
                <span className="font-semibold text-text-primary">{salonInfo.calismaSaatleri.cumartesi}</span>
              </li>
              <li className="flex justify-between">
                <span>Pazar:</span>
                <span className="font-semibold text-text-primary">{salonInfo.calismaSaatleri.pazar}</span>
              </li>
            </ul>
          </div>

          {/* 4. Sütun: Sosyal Medya & İletişim (İkon + İsim Listesi) */}
          <div>
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.15em] text-text-primary mb-4">
              Sosyal Medya &amp; İletişim
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={`https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-emerald-800 hover:text-emerald-950 font-semibold transition-colors"
                >
                  <span className="text-sm">💬</span>
                  <span>WhatsApp (Doğrudan randevu hattı)</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${salonInfo.telefon.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2.5 text-text-primary hover:text-accent-gold font-semibold transition-colors"
                >
                  <span className="text-sm">📞</span>
                  <span>Telefon ({salonInfo.telefon})</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${salonInfo.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-text-primary hover:text-accent-gold font-medium transition-colors"
                >
                  <span className="text-sm">📸</span>
                  <span>Instagram ({salonInfo.instagram})</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://tiktok.com/${salonInfo.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-text-primary hover:text-accent-gold font-medium transition-colors"
                >
                  <span className="text-sm">🎵</span>
                  <span>TikTok ({salonInfo.tiktok})</span>
                </a>
              </li>
              <li>
                <a
                  href={formatFacebookUrl(salonInfo.facebook)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-text-primary hover:text-accent-gold font-medium transition-colors"
                >
                  <span className="text-sm">👥</span>
                  <span>Facebook ({salonInfo.facebook})</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?cid=8333635848754942930"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-text-primary hover:text-red-600 font-medium transition-colors"
                >
                  <span className="text-sm">📍</span>
                  <span>Google Haritalar (Yol Tarifi)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-text-secondary gap-4">
          <p>© {new Date().getFullYear()} YILDIZ BAYAN KUAFÖRÜ. Tüm Hakları Saklıdır.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>KVKK Aydınlatma Metni</span>
            <span>•</span>
            <span>Gizlilik Politikası</span>
            <span>•</span>
            <Link href="/admin" className="text-accent-gold font-semibold hover:underline">
              Yönetim Paneli Girişi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
