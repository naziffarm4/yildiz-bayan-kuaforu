import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hizmetler & Lüks Saç Tasarım Kataloğu",
  description:
    "Saç kesimi, balyaj, röfle, keratin bakımı, gelin saçı, manikür ve pedikür dahil Yıldız Bayan Kuaförü uzman hizmet kataloğu.",
  alternates: {
    canonical: "/hizmetler",
  },
  openGraph: {
    title: "Hizmetler & Lüks Saç Tasarım Kataloğu | Yıldız Bayan Kuaförü",
    description:
      "Kadıköy Bağdat Caddesi'nde kişiye özel saç tasarım, renklendirme ve bakım hizmetlerimizi keşfedin.",
    url: "/hizmetler",
  },
};

export default function HizmetlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
