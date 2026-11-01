import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda & Zarafet Hikayemiz",
  description:
    "Yıldız Bayan Kuaförü'nün Serdivan / Sakarya'daki lüks saç tasarım felsefesi, uzman stilist kadrosu ve güzellik vizyonu.",
  alternates: {
    canonical: "/hakkimizda",
  },
  openGraph: {
    title: "Hakkımızda & Zarafet Hikayemiz | Yıldız Bayan Kuaförü",
    description:
      "Serdivan / Sakarya'da kişiselleştirilmiş lüks saç tasarım deneyimi ve hikayemiz.",
    url: "/hakkimizda",
  },
};

export default function HakkimizdaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
