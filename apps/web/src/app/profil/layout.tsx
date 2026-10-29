import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müşteri Profilim & Randevu Geçmişim",
  description: "Randevu geçmişinizi, sadakat puanlarınızı ve kişisel profil ayarlarınızı yönetin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
