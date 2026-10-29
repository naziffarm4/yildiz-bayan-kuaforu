import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müşteri & Personel Girişi",
  description: "Yıldız Bayan Kuaförü hesabınıza SMS doğrulama kodu, e-posta veya Google ile giriş yapın.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GirisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
