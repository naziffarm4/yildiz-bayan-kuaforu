import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hizmet Değerlendirme",
  description: "Yıldız Bayan Kuaförü deneyiminizi değerlendirin ve görüşlerinizi bizimle paylaşın.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DegerlendirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
