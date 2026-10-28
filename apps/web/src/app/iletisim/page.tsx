"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Button, Card, Badge } from "@yildiz/ui";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/stores/toast-store";
import { ContactMapSkeleton } from "@/components/contact/ContactMapEmbed";

const ContactMapEmbed = dynamic(
  () =>
    import("@/components/contact/ContactMapEmbed").then(
      (mod) => mod.ContactMapEmbed
    ),
  { ssr: false, loading: () => <ContactMapSkeleton /> }
);

export default function ContactPage() {
  const bootstrapApp = useAppStore((s) => s.bootstrapApp);
  const salonInfo = useAppStore((s) => s.salonInfo);
  const pageTexts = useAppStore((s) => s.pageTexts);
  const bookingRules = useAppStore((s) => s.bookingRules);
  const isInitialLoaded = useAppStore((s) => s.isInitialLoaded);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const contact = pageTexts.contact;
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    bootstrapApp();
  }, [bootstrapApp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Mesajınız alındı! Ekibimiz en kısa sürede size dönüş sağlayacaktır.");
  };

  if (!isInitialLoaded && isRefreshing) {
    return <PageLoader variant="modal" message="İletişim sayfası yükleniyor..." />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Üst Başlık */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
          <div className="max-w-4xl mx-auto space-y-3">
            <Badge variant="gold">İletişim &amp; Lokasyon</Badge>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-dark">
              {contact.welcomeTitle}
            </h1>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              {contact.welcomeSubtitle}
            </p>
          </div>
        </section>

        {/* Ana İçerik Izgarası */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* SOL: İletişim Bilgileri & Çalışma Saatleri */}
            <div className="space-y-6">
              <Card className="p-6 bg-bg-primary border-border-main shadow-xs space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                  Adres &amp; Ulaşım
                </span>
                <h3 className="font-serif text-xl font-bold text-dark">
                  {salonInfo.ad}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  📍 {salonInfo.adres}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={`tel:${salonInfo.telefon.replace(/\s+/g, "")}`}
                    className="flex-1 text-center py-2.5 px-4 rounded-md bg-bg-secondary border border-border-main hover:bg-border-main text-xs font-bold text-text-primary transition-colors"
                  >
                    📞 Telefon: {salonInfo.telefon}
                  </a>

                  <a
                    href={`https://wa.me/${salonInfo.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 px-4 rounded-md bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors"
                  >
                    💬 WhatsApp ile Yazın
                  </a>
                </div>
              </Card>

              {/* Çalışma Saatleri Kartı */}
              <Card className="p-6 bg-bg-primary border-border-main shadow-xs space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                  Çalışma Saatleri
                </span>
                <ul className="space-y-2.5 text-xs">
                  <li className="flex justify-between py-1 border-b border-border-main/60">
                    <span className="text-text-secondary">Hafta İçi (Pzt - Cuma):</span>
                    <span className="font-bold text-dark">{salonInfo.calismaSaatleri.haftaIci}</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-border-main/60">
                    <span className="text-text-secondary">Cumartesi:</span>
                    <span className="font-bold text-dark">{salonInfo.calismaSaatleri.cumartesi}</span>
                  </li>
                  <li className="flex justify-between py-1">
                    <span className="text-text-secondary">Pazar Günü:</span>
                    <span className="font-bold text-dark">{salonInfo.calismaSaatleri.pazar}</span>
                  </li>
                </ul>

                <div className="pt-3 border-t border-border-main flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Sosyal Medya:</span>
                  <div className="flex gap-3 text-xs font-semibold text-primary">
                    <a href={`https://instagram.com/${salonInfo.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Instagram {salonInfo.instagram}
                    </a>
                    <span>•</span>
                    <a href={`https://tiktok.com/${salonInfo.tiktok}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      TikTok {salonInfo.tiktok}
                    </a>
                  </div>
                </div>
              </Card>

              {/* Hızlı Randevu Çağrısı */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-bg-secondary to-secondary/10 border border-primary/30 flex items-center justify-between">
                <div>
                  <span className="font-serif font-bold text-sm text-dark block">
                    Beklemeden Koltuğunuza Geçin
                  </span>
                  <span className="text-xs text-text-secondary">
                    {bookingRules.blokajSuresiDakika} dakikalık geçici slot blokajı ile güvenle yerinizi ayırtın.
                  </span>
                </div>
                <Link href="/randevu">
                  <Button variant="primary" size="sm" className="shrink-0 text-xs shadow-xs">
                    Randevu Al →
                  </Button>
                </Link>
              </div>
            </div>

            {/* SAĞ: Hızlı Mesaj & Google Harita Önizleme */}
            <div className="space-y-6">
              {/* Harita Kartı (Dinamik Yükleme & Embed) */}
              <ContactMapEmbed
                adres={salonInfo.adres}
                googleHaritaUrl={salonInfo.googleHaritaUrl}
                transitNote={contact.transitNote}
              />

              {/* Mesaj / Danışma Formu */}
              <Card className="p-6 bg-white border-border shadow-xs">
                <h3 className="font-serif text-lg font-bold text-text-primary mb-2">
                  Bize Mesaj Gönderin
                </h3>
                <p className="text-xs text-text-secondary mb-4">
                  Saç rengi veya özel gün planlamalarınızla ilgili danışmak istediğiniz konuları iletebilirsiniz.
                </p>

                {sent ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <span className="text-emerald-800 font-bold text-sm block">
                      ✓ Mesajınız Alındı
                    </span>
                    <p className="text-xs text-emerald-700">
                      Ekibimiz en kısa sürede telefon veya WhatsApp üzerinden size dönüş sağlayacaktır.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">
                        Adınız &amp; Soyadınız *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">
                        Telefon Numaranız *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">
                        Mesajınız
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        placeholder="Danışmak istediğiniz hizmet veya soru"
                        className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
                      />
                    </div>

                    <Button type="submit" variant="primary" size="md" className="w-full text-xs">
                      Mesajı Gönder
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
