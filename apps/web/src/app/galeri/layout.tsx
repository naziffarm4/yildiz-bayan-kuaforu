import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri & Editorial Saç Tasarım Lookbook",
  description:
    "Yıldız Bayan Kuaförü uzman ekibinin gerçekleştirdiği balyaj, renklendirme, gelin saçı ve modern kesim çalışmalarından seçkiler.",
  alternates: {
    canonical: "/galeri",
  },
  openGraph: {
    title: "Galeri & Editorial Saç Tasarım Lookbook | Yıldız Bayan Kuaförü",
    description:
      "Salonumuzda gerçekleştirilen gerçek saç tasarım ve renklendirme dönüşümlerini inceleyin.",
    url: "/galeri",
  },
};

export default function GaleriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
