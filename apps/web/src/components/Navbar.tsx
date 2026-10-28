"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@yildiz/ui";
import { formatFacebookUrl } from "@yildiz/types";
import { useAuth } from "../lib/auth-context";
import { useContent } from "../lib/content-context";

interface NavbarProps {
  onOpenBooking?: () => void;
  onOpenTracker?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onOpenTracker: _onOpenTracker }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { salonInfo } = useContent();

  const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/hizmetler", label: "Hizmetler" },
    { href: "/galeri", label: "Galeri & Lookbook" },
    { href: "/hakkimizda", label: "Hakkımızda" },
    { href: "/iletisim", label: "İletişim & Konum" },
  ];

  // Sayfa kaydırma dinleyicisi (Scroll > 40px olunca TopBar yukarıda kalıp kaybolur, Ana Menü fixed top-0 olur)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Menü açıkken arka plan kaydırmasını engelle
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleBookingClick = () => {
    setMobileMenuOpen(false);
    if (onOpenBooking) {
      onOpenBooking();
    }
  };

  return (
    <>
      {/* 1. KATMAN: BEAUTYZONE TOPBAR (bg-topbar - NORMAL AKIŞTA / SCROLL'DA YUKARIDA KALIP KAYBOLUR) */}
      <div className="relative w-full z-30 bg-topbar text-white text-xs shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 sm:h-10 flex items-center justify-between gap-4">
          {/* Sol: Telefon & Adres Bilgisi (Beyaz İkonlar ve Metin) */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
            {/* Telefon Linki */}
            <a
              href={`tel:${salonInfo.telefon.replace(/\s+/g, "")}`}
              className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors font-semibold"
              title={`Telefon: ${salonInfo.telefon}`}
            >
              <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="tracking-wide">{salonInfo.telefon}</span>
            </a>

            {/* Adres / Konum (Masaüstünde) */}
            <a
              href={salonInfo.googleHaritaUrl || "https://maps.google.com/?cid=8333635848754942930"}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-white hover:text-white/80 transition-colors font-medium truncate max-w-xs"
              title="Salon Konumu"
            >
              <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{salonInfo.adres}</span>
            </a>
          </div>

          {/* Sağ: 6 Sosyal Medya & İletişim İkonu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp İletişim Hattı"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-primary flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110"
              title="WhatsApp Doğrudan Randevu Hattı"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href={`https://instagram.com/${salonInfo.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Sayfamız"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-primary flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110"
              title={`Instagram: ${salonInfo.instagram}`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href={`https://tiktok.com/${salonInfo.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Sayfamız"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-dark flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110"
              title={`TikTok: ${salonInfo.tiktok}`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={formatFacebookUrl(salonInfo.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Sayfamız"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-blue-700 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110"
              title={`Facebook: ${salonInfo.facebook}`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z" />
              </svg>
            </a>

            {/* Google Haritalar / Yol Tarifi */}
            <a
              href={salonInfo.googleHaritaUrl || "https://maps.google.com/?cid=8333635848754942930"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google Haritalar Yol Tarifi"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-secondary flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110"
              title="Google Haritalar Yol Tarifi"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* 2. KATMAN: ANA MENÜ (SCROLL EDİLDİĞİNDE FIXED TOP-0 OLUR, TEPEDEYKEN NORMAL AKIŞTA DURUR) */}
      <header
        className={`w-full bg-bg-primary/95 backdrop-blur-md border-b border-border-main transition-all duration-300 ${
          isScrolled
            ? "fixed top-0 left-0 right-0 z-50 h-16 sm:h-[70px] shadow-md animate-fadeIn"
            : "relative z-40 h-18 sm:h-20 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          {/* Sol: Logo & Marka Tipografisi (Derin Mürdüm text-dark & Canlı Pembe text-primary) */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-primary/50 shadow-xs group-hover:scale-105 group-hover:border-primary transition-all bg-bg-secondary">
                <Image
                  src="/yildiz-logo.png"
                  alt="Yıldız Bayan Kuaförü Logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.16em] text-dark block leading-none">
                  YILDIZ
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.26em] uppercase text-primary font-bold mt-1 block">
                  Haute Coiffure
                </span>
              </div>
            </Link>
          </div>

          {/* Orta: Ana Menü Linkleri (Derin Mürdüm text-dark, Hover & Aktif text-primary ve Pembe Alt Çizgi) */}
          <nav
            className="hidden lg:flex items-center gap-7 xl:gap-9 text-xs font-bold uppercase tracking-wider text-dark"
            aria-label="Ana Menü"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-2.5 transition-colors hover:text-primary ${
                    isActive ? "text-primary font-extrabold" : "text-dark"
                  } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2.5px] after:bg-primary after:transition-all after:duration-300 ${
                    isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Sağ: Randevu Al Butonu + Profil + Hamburger Butonu */}
          <div className="shrink-0 flex items-center gap-2.5 sm:gap-3.5">
            {/* Kullanıcı Giriş / Profil Menüsü */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full border border-primary/40 hover:bg-bg-secondary transition-colors focus:outline-none"
                  title={`${user.ad} ${user.soyad} Hesabı`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white font-serif font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.ad[0]}
                  </div>
                  <span className="text-xs font-bold text-dark hidden sm:inline pr-1 max-w-[110px] truncate">
                    {user.ad}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-bg-primary rounded-xl border border-border-main shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-border-main/50">
                      <span className="font-bold text-dark block">
                        {user.ad} {user.soyad}
                      </span>
                      <span className="text-[11px] text-primary font-semibold block">
                        {user.rol === "Admin"
                          ? "👑 Yönetici"
                          : user.rol === "Calisan"
                          ? "✂️ Personel"
                          : `🌸 ${user.toplamPuan} Sadakat Puanı`}
                      </span>
                    </div>

                    <Link
                      href="/profil"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 hover:bg-bg-secondary text-dark font-medium"
                    >
                      👤 Profil &amp; Güvenlik
                    </Link>

                    <Link
                      href="/profil#randevular"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 hover:bg-bg-secondary text-dark font-medium"
                    >
                      📅 Randevularım
                    </Link>

                    {(user.rol === "Admin" || user.rol === "Calisan") && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-bg-secondary text-primary font-bold"
                      >
                        👑 Yönetim Paneli
                      </Link>
                    )}

                    <div className="pt-1 border-t border-border-main/50 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium"
                      >
                        🚪 Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={
                  pathname && pathname !== "/giris" && pathname !== "/kayit"
                    ? `/giris?redirect=${encodeURIComponent(pathname)}`
                    : "/giris"
                }
                className="text-xs font-bold px-3 py-2 rounded-lg border border-border-main bg-bg-primary text-dark hover:bg-bg-secondary transition-colors whitespace-nowrap shadow-2xs hidden sm:inline-block"
              >
                Giriş Yap
              </Link>
            )}

            {/* BEAUTYZONE İMZA "RANDEVU AL" BUTONU (bg-primary hover:bg-primary-hover) */}
            <div className="hidden sm:block">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBookingClick}
                className="h-9 sm:h-10 px-5 text-xs uppercase tracking-wider font-bold shadow-sm hover:shadow-md bg-primary hover:bg-primary-hover text-white border-0 transition-all duration-200"
              >
                <span>Randevu Al</span>
                <span className="ml-1.5" aria-hidden="true">→</span>
              </Button>
            </div>

            {/* BEAUTYZONE ÖZEL 3 ÇİZGİLİ ANİMASYONLU NAVICON (HAMBURGER BUTONU) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-bg-secondary border border-border-main flex flex-col items-center justify-center gap-1.5 p-2 text-dark hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors shadow-2xs"
              aria-label={mobileMenuOpen ? "Menüyü Kapat" : "Menüyü Aç"}
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`w-5 h-[2px] bg-dark rounded-full transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "rotate-45 translate-y-[8px] bg-primary" : ""
                }`}
              />
              <span
                className={`w-5 h-[2px] bg-dark rounded-full transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "opacity-0 scale-0" : ""
                }`}
              />
              <span
                className={`w-5 h-[2px] bg-dark rounded-full transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-[8px] bg-primary" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* İÇERİK ZIPLAMASINI (LAYOUT SHIFT) ÖNLEYEN PLACEHOLDER DIV */}
      {isScrolled && (
        <div className="h-16 sm:h-[70px] w-full shrink-0" aria-hidden="true" />
      )}

      {/* 3. BÖLÜM: MOBİL KAYAN ÇEKMECE PANELİ (BEAUTYZONE MO-LEFT SLIDE-IN DRAWER) */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 w-[300px] sm:w-[340px] bg-bg-primary z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden border-r border-border-main ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobil Gezinme Menüsü"
      >
        {/* Çekmece Üst Başlık & Kapatma Butonu */}
        <div className="p-5 border-b border-border-main flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/50 bg-bg-primary">
              <Image
                src="/yildiz-logo.png"
                alt="Yıldız Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <span className="font-serif text-base font-bold tracking-wider text-dark block leading-none">
                YILDIZ
              </span>
              <span className="text-[9px] tracking-widest uppercase text-primary font-bold">
                Haute Coiffure
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-bg-primary border border-border-main flex items-center justify-center text-dark hover:bg-bg-secondary transition-colors"
            aria-label="Menüyü Kapat"
          >
            ✕
          </button>
        </div>

        {/* Çekmece Orta Alan: Sayfa Bağlantıları */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "text-dark hover:bg-bg-secondary hover:text-primary"
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="text-xs text-dark/40">→</span>
                </Link>
              );
            })}
          </nav>

          {/* Hızlı Online Randevu Butonu */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleBookingClick}
              className="w-full text-xs uppercase tracking-wider font-bold shadow-md bg-primary hover:bg-primary-hover text-white border-0"
            >
              📅 Online Randevu Al
            </Button>
          </div>

          {/* Profil / Giriş Linki */}
          <div className="pt-3 border-t border-border-main">
            {isAuthenticated && user ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-bg-secondary border border-border-main">
                  <span className="font-bold text-dark block">
                    {user.ad} {user.soyad}
                  </span>
                  <span className="text-[11px] text-primary font-semibold block mt-0.5">
                    {user.rol === "Admin" ? "👑 Yönetici Masası" : "🌸 Salon Misafiri"}
                  </span>
                </div>
                <Link
                  href="/profil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-dark font-medium hover:text-primary"
                >
                  👤 Profilim &amp; Randevularım
                </Link>
                {(user.rol === "Admin" || user.rol === "Calisan") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-primary font-bold"
                  >
                    👑 Yönetim Masası
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="block text-red-600 font-semibold py-1 hover:underline"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <Link
                href={
                  pathname && pathname !== "/giris" && pathname !== "/kayit"
                    ? `/giris?redirect=${encodeURIComponent(pathname)}`
                    : "/giris"
                }
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary border border-border-main text-xs font-bold text-dark hover:bg-gray-100 transition-colors"
              >
                <span>🔑 Müşteri / Personel Girişi</span>
                <span>→</span>
              </Link>
            )}
          </div>

          {/* İletişim & WhatsApp Hızlı Bağlantıları */}
          <div className="space-y-2.5 pt-2">
            <a
              href={`tel:${salonInfo.telefon.replace(/\s+/g, "")}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-main text-xs font-semibold text-dark hover:bg-gray-100 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-bg-primary flex items-center justify-center text-primary shrink-0 font-bold">
                📞
              </span>
              <span>{salonInfo.telefon}</span>
            </a>

            <a
              href={`https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-bg-primary flex items-center justify-center text-emerald-700 shrink-0">
                💬
              </span>
              <span>WhatsApp Doğrudan Randevu</span>
            </a>
          </div>
        </div>

        {/* Çekmece Alt Alan: 6 Sosyal Medya İkonu */}
        <div className="p-4 border-t border-border-main bg-bg-secondary text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-dark/70 block mb-2.5">
            Bizi Takip Edin
          </span>
          <div className="flex items-center justify-center gap-2.5">
            <a
              href={`https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs"
              aria-label="WhatsApp"
            >
              💬
            </a>
            <a
              href={`https://instagram.com/${salonInfo.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs"
              aria-label="Instagram"
            >
              📷
            </a>
            <a
              href={`https://tiktok.com/${salonInfo.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 text-dark flex items-center justify-center text-xs"
              aria-label="TikTok"
            >
              🎵
            </a>
            <a
              href={formatFacebookUrl(salonInfo.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs"
              aria-label="Facebook"
            >
              📘
            </a>
            <a
              href={salonInfo.googleHaritaUrl || "https://maps.google.com/?cid=8333635848754942930"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-xs"
              aria-label="Harita"
            >
              📍
            </a>
          </div>
        </div>
      </aside>

      {/* 4. BÖLÜM: MOBİL HIZLI AKSİYON BARI (BEAUTYZONE MOBILE STICKY BOTTOM BAR) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur-md border-t border-border-main px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Hızlı Arama Butonu */}
        <a
          href={`tel:${salonInfo.telefon.replace(/\s+/g, "")}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-bg-secondary border border-border-main text-dark text-[11px] font-bold tracking-wide hover:bg-gray-100 transition-colors"
          title="Hemen Ara"
        >
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>Hemen Ara</span>
        </a>

        {/* WhatsApp Doğrudan Randevu Butonu */}
        <a
          href={`https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold tracking-wide hover:bg-emerald-100 transition-colors"
          title="WhatsApp"
        >
          <svg className="w-4 h-4 fill-current text-emerald-600" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        {/* Ana Randevu Al Butonu */}
        <button
          type="button"
          onClick={handleBookingClick}
          className="flex-1.2 inline-flex items-center justify-center gap-1 h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition-transform"
        >
          <span>Randevu Al</span>
          <span>→</span>
        </button>
      </div>
    </>
  );
};
