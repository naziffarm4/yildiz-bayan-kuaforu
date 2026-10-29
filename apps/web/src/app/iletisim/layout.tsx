import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim, Adres & Çalışma Saatleri",
  description:
    "Yıldız Bayan Kuaförü Kadıköy Bağdat Caddesi adres bilgileri, yol tarifi, telefon, WhatsApp randevu hattı ve çalışma saatleri.",
  alternates: {
    canonical: "/iletisim",
  },
  openGraph: {
    title: "İletişim, Adres & Çalışma Saatleri | Yıldız Bayan Kuaförü",
    description:
      "Salonumuza ulaşım, Google Haritalar yol tarifi, iletişim kanalları ve çalışma saatlerimiz.",
    url: "/iletisim",
  },
};

export default function IletisimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
