import type { Metadata } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ContentProvider } from "@/lib/content-context";
import { AppBootstrapper } from "@/components/AppBootstrapper";
import { Toaster } from "@/components/Toaster";
import { NavigationProgressBar } from "@/components/NavigationProgressBar";

export const metadata: Metadata = {
  title: "Yıldız Bayan Kuaförü | Randevu ve Yönetim Sistemi",
  description: "Yıldız Bayan Kuaförü lüks ve kurumsal randevu yönetim platformu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
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
