import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Müşteri Kaydı",
  description: "Yıldız Bayan Kuaförü ayrıcalıklı müşteri kulübüne katılın ve sadakat puanları kazanın.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function KayitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
