import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Randevu Al & Randevu Sorgula",
  description:
    "Yıldız Bayan Kuaförü'nden sıra beklemeden online randevu oluşturun veya mevcut randevunuzun durumunu sorgulayın.",
  alternates: {
    canonical: "/randevu",
  },
  openGraph: {
    title: "Online Randevu Al | Yıldız Bayan Kuaförü",
    description:
      "İstediğiniz hizmet ve saat için saniyeler içinde online kuaför randevunuzu oluşturun.",
    url: "/randevu",
  },
};

export default function RandevuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
