import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yönetim & Kasa Paneli | YILDIZ BAYAN KUAFÖRÜ",
  description: "Kuaför randevu takvimi, kasa POS, çalışan komisyonları ve stok yönetim paneli.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
