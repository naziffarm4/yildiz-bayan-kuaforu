import type { Metadata } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ContentProvider } from "@/lib/content-context";
import { AppBootstrapper } from "@/components/AppBootstrapper";
import { Toaster } from "@/components/Toaster";
import { NavigationProgressBar } from "@/components/NavigationProgressBar";
import { SALON_INFO } from "@/lib/site-defaults";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://yildizbayankuaforu.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Yıldız Bayan Kuaförü | Lüks Saç Tasarım & Online Randevu",
    template: "%s | Yıldız Bayan Kuaförü",
  },
  description:
    "Kadıköy Bağdat Caddesi'nde lüks saç tasarımı, balyaj, röfle, gelin saçı ve profesyonel kuaför hizmetleri. Sıra beklemeden online randevunuzu oluşturun.",
  keywords: [
    "Yıldız Bayan Kuaförü",
    "Kadıköy bayan kuaförü",
    "Bağdat Caddesi kuaför",
    "balyaj",
    "gelin saçı",
    "saç kesimi",
    "online kuaför randevu",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: SALON_INFO.ad,
    title: "Yıldız Bayan Kuaförü | Zarif Dokunuşlar, Kusursuz Güzellik",
    description:
      "Kadıköy Bağdat Caddesi'nde kişiselleştirilmiş lüks saç tasarımı ve online randevu platformu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yıldız Bayan Kuaförü | Lüks Saç Tasarım & Online Randevu",
    description:
      "Kadıköy Bağdat Caddesi'nde kişiselleştirilmiş lüks saç tasarımı ve online randevu platformu.",
  },
};

const salonJsonLd = {
  "@context": "https://schema.org",
  "@type": ["BeautySalon", "LocalBusiness"],
  name: SALON_INFO.ad,
  description: SALON_INFO.slogan,
  url: SITE_URL,
  telephone: SALON_INFO.telefon,
  email: SALON_INFO.eposta,
  address: {
    "@type": "PostalAddress",
    streetAddress: SALON_INFO.adres,
    addressLocality: "Kadıköy",
    addressRegion: "İstanbul",
    addressCountry: "TR",
  },
  hasMap: SALON_INFO.googleHaritaUrl,
  openingHours: ["Mo-Fr 09:00-20:00", "Sa 09:00-20:30", "Su 10:00-18:00"],
  priceRange: "₺₺₺",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(salonJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <AuthProvider>
          <ContentProvider>
            <AppBootstrapper>
              {children}
              <Toaster />
            </AppBootstrapper>
          </ContentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
