"use client";

import React, { useState, useEffect } from "react";
import type {
  SalonInfo,
  PageTexts,
  BookingRules,
  SpecialDay,
} from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";

export interface SiteSettingsManagerProps {
  salonInfo: SalonInfo;
  onUpdateSalonInfo: (info: Partial<SalonInfo>) => void;
  pageTexts: PageTexts;
  onUpdatePageTexts: (texts: Partial<PageTexts>) => void;
  bookingRules: BookingRules;
  onUpdateBookingRules: (rules: Partial<BookingRules>) => void;
  specialDays: SpecialDay[];
  onAddSpecialDay: (day: Omit<SpecialDay, "id">) => void;
  onDeleteSpecialDay: (id: string) => void;
}

type SettingsTab = "general" | "pages" | "hours" | "rules";

export const SiteSettingsManager: React.FC<SiteSettingsManagerProps> = ({
  salonInfo,
  onUpdateSalonInfo,
  pageTexts,
  onUpdatePageTexts,
  bookingRules,
  onUpdateBookingRules,
  specialDays,
  onAddSpecialDay,
  onDeleteSpecialDay,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Local Form Copies
  const [generalForm, setGeneralForm] = useState<SalonInfo>({ ...salonInfo });
  const [pageTextsForm, setPageTextsForm] = useState<PageTexts>({
    hero: { ...pageTexts.hero },
    heroMedia: {
      gorselUrl: pageTexts.heroMedia?.gorselUrl || "",
      rozet: pageTexts.heroMedia?.rozet || "",
      baslik: pageTexts.heroMedia?.baslik || "",
      altBaslik: pageTexts.heroMedia?.altBaslik || "",
    },
    heroFeatures:
      pageTexts.heroFeatures && pageTexts.heroFeatures.length > 0
        ? pageTexts.heroFeatures.map((f) => ({ ...f }))
        : [
            { baslik: "", aciklama: "" },
            { baslik: "", aciklama: "" },
            { baslik: "", aciklama: "" },
          ],
    homeCTA: {
      rozet: pageTexts.homeCTA?.rozet || "",
      baslik: pageTexts.homeCTA?.baslik || "",
      aciklama: pageTexts.homeCTA?.aciklama || "",
      butonMetni: pageTexts.homeCTA?.butonMetni || "",
    },
    artist: {
      ustRozet: pageTexts.artist?.ustRozet || "",
      anaBaslik: pageTexts.artist?.anaBaslik || "",
      altBaslik: pageTexts.artist?.altBaslik || "",
      etiket: pageTexts.artist?.etiket || "",
      adSoyad: pageTexts.artist?.adSoyad || "",
      unvan: pageTexts.artist?.unvan || "",
      gorselUrl: pageTexts.artist?.gorselUrl || "",
      gorselRozet: pageTexts.artist?.gorselRozet || "",
      alintiSoz: pageTexts.artist?.alintiSoz || "",
      biyografi: pageTexts.artist?.biyografi || "",
      vipOzellikler:
        pageTexts.artist?.vipOzellikler && pageTexts.artist.vipOzellikler.length > 0
          ? pageTexts.artist.vipOzellikler.map((v) => ({ ...v }))
          : [
              { baslik: "", aciklama: "" },
              { baslik: "", aciklama: "" },
              { baslik: "", aciklama: "" },
            ],
      butonMetni: pageTexts.artist?.butonMetni || "",
    },
    servicesSection: {
      rozet: pageTexts.servicesSection?.rozet || "",
      baslik: pageTexts.servicesSection?.baslik || "",
      aciklama: pageTexts.servicesSection?.aciklama || "",
    },
    reviewsSection: {
      rozet: pageTexts.reviewsSection?.rozet || "",
      baslik: pageTexts.reviewsSection?.baslik || "",
      aciklama: pageTexts.reviewsSection?.aciklama || "",
    },
    trackerSection: {
      rozet: pageTexts.trackerSection?.rozet || "",
      baslik: pageTexts.trackerSection?.baslik || "",
      aciklama: pageTexts.trackerSection?.aciklama || "",
      butonMetni: pageTexts.trackerSection?.butonMetni || "",
    },
    about: { ...pageTexts.about },
    contact: { ...pageTexts.contact },
  });
  const [rulesForm, setRulesForm] = useState<BookingRules>({ ...bookingRules });

  useEffect(() => {
    setPageTextsForm({
      hero: { ...pageTexts.hero },
      heroMedia: {
        gorselUrl: pageTexts.heroMedia?.gorselUrl || "",
        rozet: pageTexts.heroMedia?.rozet || "",
        baslik: pageTexts.heroMedia?.baslik || "",
        altBaslik: pageTexts.heroMedia?.altBaslik || "",
      },
      heroFeatures:
        pageTexts.heroFeatures && pageTexts.heroFeatures.length > 0
          ? pageTexts.heroFeatures.map((f) => ({ ...f }))
          : [
              { baslik: "", aciklama: "" },
              { baslik: "", aciklama: "" },
              { baslik: "", aciklama: "" },
            ],
      homeCTA: {
        rozet: pageTexts.homeCTA?.rozet || "",
        baslik: pageTexts.homeCTA?.baslik || "",
        aciklama: pageTexts.homeCTA?.aciklama || "",
        butonMetni: pageTexts.homeCTA?.butonMetni || "",
      },
      artist: {
        ustRozet: pageTexts.artist?.ustRozet || "",
        anaBaslik: pageTexts.artist?.anaBaslik || "",
        altBaslik: pageTexts.artist?.altBaslik || "",
        etiket: pageTexts.artist?.etiket || "",
        adSoyad: pageTexts.artist?.adSoyad || "",
        unvan: pageTexts.artist?.unvan || "",
        gorselUrl: pageTexts.artist?.gorselUrl || "",
        gorselRozet: pageTexts.artist?.gorselRozet || "",
        alintiSoz: pageTexts.artist?.alintiSoz || "",
        biyografi: pageTexts.artist?.biyografi || "",
        vipOzellikler:
          pageTexts.artist?.vipOzellikler && pageTexts.artist.vipOzellikler.length > 0
            ? pageTexts.artist.vipOzellikler.map((v) => ({ ...v }))
            : [
                { baslik: "", aciklama: "" },
                { baslik: "", aciklama: "" },
                { baslik: "", aciklama: "" },
              ],
        butonMetni: pageTexts.artist?.butonMetni || "",
      },
      servicesSection: {
        rozet: pageTexts.servicesSection?.rozet || "",
        baslik: pageTexts.servicesSection?.baslik || "",
        aciklama: pageTexts.servicesSection?.aciklama || "",
      },
      reviewsSection: {
        rozet: pageTexts.reviewsSection?.rozet || "",
        baslik: pageTexts.reviewsSection?.baslik || "",
        aciklama: pageTexts.reviewsSection?.aciklama || "",
      },
      trackerSection: {
        rozet: pageTexts.trackerSection?.rozet || "",
        baslik: pageTexts.trackerSection?.baslik || "",
        aciklama: pageTexts.trackerSection?.aciklama || "",
        butonMetni: pageTexts.trackerSection?.butonMetni || "",
      },
      about: { ...pageTexts.about },
      contact: { ...pageTexts.contact },
    });
  }, [pageTexts]);

  // Özel Gün Ekleme State'i
  const [specialDate, setSpecialDate] = useState("");
  const [specialDesc, setSpecialDesc] = useState("");
  const [specialClosed, setSpecialClosed] = useState(true);
  const [specialHours, setSpecialHours] = useState("10:00 - 17:00");

  const notifySaved = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3500);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSalonInfo(generalForm);
    notifySaved("Salon ve iletişim bilgileri başarıyla güncellendi.");
  };

  const handleSavePageTexts = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePageTexts(pageTextsForm);
    notifySaved("Sayfa metinleri ve CMS içerikleri anında güncellendi.");
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBookingRules(rulesForm);
    notifySaved("Randevu ve işletme kuralları kaydedildi.");
  };

  const handleAddSpecialDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialDate.trim() || !specialDesc.trim()) return;

    onAddSpecialDay({
      tarih: specialDate.trim(),
      aciklama: specialDesc.trim(),
      kapali: specialClosed,
      ozelSaatler: specialClosed ? undefined : specialHours.trim(),
    });

    setSpecialDate("");
    setSpecialDesc("");
    setSpecialClosed(true);
    notifySaved("Özel tatil / mesai günü takvime eklendi.");
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-gold block">
            İçerik Yönetim Sistemi (CMS)
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
            Site &amp; Sayfa Metinleri Yöneticisi
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Salon iletişim bilgileri, sosyal medya hesapları, sayfa metinleri ve randevu kurallarını canlı yönetin.
          </p>
        </div>

        {savedMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-xs font-bold animate-fadeIn flex items-center gap-1.5 shadow-2xs">
            <span>✓</span>
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      {/* Sekme Butonları */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: "general" as const, label: "🏢 Genel Bilgiler & Sosyal Medya" },
          { id: "pages" as const, label: "✍️ Sayfa Metinleri (CMS)" },
          { id: "hours" as const, label: "⏰ Çalışma Saatleri & Özel Günler" },
          { id: "rules" as const, label: "⚙️ Randevu & İş Kuralları" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-text-primary text-white shadow-xs font-bold"
                  : "bg-white border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEKME 1: GENEL BİLGİLER & SOSYAL MEDYA */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-text-primary border-b border-border pb-2">
              Salon Temel İletişim Bilgileri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Salon Ticari Ünvanı *
                </label>
                <input
                  type="text"
                  required
                  value={generalForm.ad}
                  onChange={(e) => setGeneralForm({ ...generalForm, ad: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Slogan / Manifesto Başlığı
                </label>
                <input
                  type="text"
                  value={generalForm.slogan}
                  onChange={(e) => setGeneralForm({ ...generalForm, slogan: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Telefon Numarası *
                </label>
                <input
                  type="text"
                  required
                  value={generalForm.telefon}
                  onChange={(e) => setGeneralForm({ ...generalForm, telefon: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  WhatsApp Doğrudan Randevu Hattı *
                </label>
                <input
                  type="text"
                  required
                  value={generalForm.whatsapp}
                  onChange={(e) => setGeneralForm({ ...generalForm, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={generalForm.eposta}
                  onChange={(e) => setGeneralForm({ ...generalForm, eposta: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Google Haritalar Yol Tarifi Linki
                </label>
                <input
                  type="url"
                  value={generalForm.googleHaritaUrl}
                  onChange={(e) => setGeneralForm({ ...generalForm, googleHaritaUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Açık Adres (Kartlar ve Fatura için)
              </label>
              <textarea
                rows={2}
                value={generalForm.adres}
                onChange={(e) => setGeneralForm({ ...generalForm, adres: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-text-primary border-b border-border pb-2">
              Sosyal Medya Kanalları
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Instagram Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={generalForm.instagram}
                  onChange={(e) => setGeneralForm({ ...generalForm, instagram: e.target.value })}
                  placeholder="@yildizbayankuaforu"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  TikTok Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={generalForm.tiktok}
                  onChange={(e) => setGeneralForm({ ...generalForm, tiktok: e.target.value })}
                  placeholder="@yildizkuafor"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Facebook Sayfa Adı
                </label>
                <input
                  type="text"
                  value={generalForm.facebook}
                  onChange={(e) => setGeneralForm({ ...generalForm, facebook: e.target.value })}
                  placeholder="Yıldız Bayan Kuaförü"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" className="font-bold px-8 shadow-sm">
              ✓ Genel Bilgileri Canlıya Aktar
            </Button>
          </div>
        </form>
      )}

      {/* SEKME 2: SAYFA METİNLERİ (CMS) */}
      {activeTab === "pages" && (
        <form onSubmit={handleSavePageTexts} className="space-y-6">
          {/* Ana Sayfa Hero & Vitrin CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-text-primary">
                1. Ana Sayfa (Hero &amp; Lookbook Başlıkları)
              </h3>
              <Badge variant="gold">Ana Sayfa</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Hero Rozet Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.badge}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, badge: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Hero Yan Rozet / Vurgu Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.altRozet || ""}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, altRozet: e.target.value },
                    })
                  }
                  placeholder="Randevulu Özel Hizmet"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Hero Ana Başlık (1. Satır)
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.title}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Vurgulu İtalik Kelime (Altın Rengi)
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.titleHighlight}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, titleHighlight: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Başlık Tamamlayıcı Kelime
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.titleEnd}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, titleEnd: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Hero Alt Paragraf Açıklaması
              </label>
              <textarea
                rows={3}
                value={pageTextsForm.hero.description}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    hero: { ...pageTextsForm.hero, description: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/70">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Lookbook Vitrin Üst Etiketi
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.lookbookBadge}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, lookbookBadge: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Lookbook Vitrin Ana Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.lookbookTitle}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, lookbookTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/70">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Hero Randevu Buton Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.butonRandevu || ""}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, butonRandevu: e.target.value },
                    })
                  }
                  placeholder="Online Randevu Oluştur"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Hero Galeri Buton Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.hero.butonGaleri || ""}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      hero: { ...pageTextsForm.hero, butonGaleri: e.target.value },
                    })
                  }
                  placeholder="Koleksiyonu Keşfet →"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Hero Sağ Medya & Görsel Etiketleri CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  2. Hero Sağ Medya &amp; Görsel Etiketleri
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Ana sayfanın sağındaki dikey lüks fotoğraf, fotoğraf altı karartması ve koleksiyon etiketleri
                </p>
              </div>
              <Badge variant="gold">Hero Görseli</Badge>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Görsel URL Adresi (Unsplash veya CDN)
              </label>
              <input
                type="url"
                value={pageTextsForm.heroMedia.gorselUrl}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    heroMedia: { ...pageTextsForm.heroMedia, gorselUrl: e.target.value },
                  })
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Koleksiyon Rozet Etiketi
                </label>
                <input
                  type="text"
                  value={pageTextsForm.heroMedia.rozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      heroMedia: { ...pageTextsForm.heroMedia, rozet: e.target.value },
                    })
                  }
                  placeholder="Haute Coiffure 2026"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Görsel Başlığı / Tasarım Adı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.heroMedia.baslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      heroMedia: { ...pageTextsForm.heroMedia, baslik: e.target.value },
                    })
                  }
                  placeholder="Zarif Dalgalar &amp; Sıcak Bal Yansımaları"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Alt Başlık / Koleksiyon Sahibi
                </label>
                <input
                  type="text"
                  value={pageTextsForm.heroMedia.altBaslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      heroMedia: { ...pageTextsForm.heroMedia, altBaslik: e.target.value },
                    })
                  }
                  placeholder="Yıldız Bayan Kuaförü Özel Koleksiyonu"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Hero 3'lü Seans Güvence Maddeleri CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  3. Hero 3&apos;lü Seans Güvence Maddeleri
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Hero sol sütun altındaki 3 maddelik tampon süre, stilist ve seans güvenceleri
                </p>
              </div>
              <Badge variant="gold">3&apos;lü Güvence</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => {
                const item = pageTextsForm.heroFeatures[idx] || { baslik: "", aciklama: "" };
                return (
                  <div key={idx} className="p-3.5 rounded-lg border border-border bg-bg-secondary space-y-3">
                    <span className="text-[11px] font-bold text-accent-gold uppercase tracking-wider block">
                      Madde {idx + 1}
                    </span>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary mb-1">
                        Madde Başlığı
                      </label>
                      <input
                        type="text"
                        value={item.baslik}
                        onChange={(e) => {
                          const updated = [...pageTextsForm.heroFeatures];
                          while (updated.length <= idx) {
                            updated.push({ baslik: "", aciklama: "" });
                          }
                          updated[idx] = { ...updated[idx]!, baslik: e.target.value };
                          setPageTextsForm({ ...pageTextsForm, heroFeatures: updated });
                        }}
                        placeholder={`0${idx + 1}. Başlık`}
                        className="w-full px-3 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary mb-1">
                        Madde Açıklaması
                      </label>
                      <textarea
                        rows={2}
                        value={item.aciklama}
                        onChange={(e) => {
                          const updated = [...pageTextsForm.heroFeatures];
                          while (updated.length <= idx) {
                            updated.push({ baslik: "", aciklama: "" });
                          }
                          updated[idx] = { ...updated[idx]!, aciklama: e.target.value };
                          setPageTextsForm({ ...pageTextsForm, heroFeatures: updated });
                        }}
                        placeholder="Kısa açıklama metni..."
                        className="w-full px-3 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Hizmetler Kataloğu Bölüm Metinleri CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  4. Hizmetler Kataloğu Bölüm Başlığı &amp; Açıklaması
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Ana sayfadaki filtreli hizmet kataloğunun üst manşet alanı
                </p>
              </div>
              <Badge variant="gold">Hizmetler</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Üst Rozet Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.servicesSection.rozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      servicesSection: { ...pageTextsForm.servicesSection, rozet: e.target.value },
                    })
                  }
                  placeholder="Özel Hizmet Kataloğu"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Ana Bölüm Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.servicesSection.baslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      servicesSection: { ...pageTextsForm.servicesSection, baslik: e.target.value },
                    })
                  }
                  placeholder="Ustalıkla Sunulan Hizmetlerimiz"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Katalog Alt Açıklaması
              </label>
              <textarea
                rows={2}
                value={pageTextsForm.servicesSection.aciklama}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    servicesSection: { ...pageTextsForm.servicesSection, aciklama: e.target.value },
                  })
                }
                placeholder="Tüm işlemlerimizde en kaliteli ürünler ve güncel saç tasarım teknikleri..."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          {/* Haute Coiffure Sanatçısı (Kurucu Kartı) CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  5. Haute Coiffure Sanatçısı (Kurucu Kartı) CMS
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Ana sayfadaki &quot;Usta Ellerden Kusursuz Dokunuş&quot; VIP stilist bölümü
                </p>
              </div>
              <Badge variant="gold">Sanatçı Kartı</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Üst Rozet
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.ustRozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, ustRozet: e.target.value },
                    })
                  }
                  placeholder="Kişiye Özel Butik VIP Hizmet"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Ana Bölüm Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.anaBaslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, anaBaslik: e.target.value },
                    })
                  }
                  placeholder="Usta Ellerden Kusursuz Dokunuş"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Bölüm Alt Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.altBaslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, altBaslik: e.target.value },
                    })
                  }
                  placeholder="Kalabalık salonların telaşından uzak..."
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Sanatçı Etiketi
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.etiket}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, etiket: e.target.value },
                    })
                  }
                  placeholder="Haute Coiffure Sanatçısı"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Sanatçı Adı Soyadı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.adSoyad}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, adSoyad: e.target.value },
                    })
                  }
                  placeholder="Yıldız Bayan Kuaförü"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Unvan &amp; Uzmanlık
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.unvan}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, unvan: e.target.value },
                    })
                  }
                  placeholder="Master Stilist • Renk & Kesim Tasarımcısı"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Portre Görsel URL (Unsplash veya CDN)
                </label>
                <input
                  type="url"
                  value={pageTextsForm.artist.gorselUrl}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, gorselUrl: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Görsel Üzeri Rozet
                </label>
                <input
                  type="text"
                  value={pageTextsForm.artist.gorselRozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      artist: { ...pageTextsForm.artist, gorselRozet: e.target.value },
                    })
                  }
                  placeholder="👑 Kurucu & Master Stilist"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Alıntı / Manifesto Sözü
              </label>
              <textarea
                rows={2}
                value={pageTextsForm.artist.alintiSoz}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    artist: { ...pageTextsForm.artist, alintiSoz: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Biyografi &amp; Saç Analizi Açıklaması
              </label>
              <textarea
                rows={3}
                value={pageTextsForm.artist.biyografi}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    artist: { ...pageTextsForm.artist, biyografi: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            {/* 3 VIP Özellik */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-text-primary">
                3 VIP Özellik Kutucuğu
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((idx) => {
                  const vip = pageTextsForm.artist.vipOzellikler[idx] || { baslik: "", aciklama: "" };
                  return (
                    <div key={idx} className="p-3.5 rounded-lg border border-border bg-bg-secondary space-y-2">
                      <span className="text-[11px] font-bold text-accent-gold uppercase tracking-wider block">
                        VIP Madde {idx + 1}
                      </span>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-primary mb-1">
                          Başlık
                        </label>
                        <input
                          type="text"
                          value={vip.baslik}
                          onChange={(e) => {
                            const updated = [...pageTextsForm.artist.vipOzellikler];
                            while (updated.length <= idx) {
                              updated.push({ baslik: "", aciklama: "" });
                            }
                            updated[idx] = { ...updated[idx]!, baslik: e.target.value };
                            setPageTextsForm({
                              ...pageTextsForm,
                              artist: { ...pageTextsForm.artist, vipOzellikler: updated },
                            });
                          }}
                          placeholder="Örn: 💎 Tek Misafir İlkesi"
                          className="w-full px-3 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-primary mb-1">
                          Açıklama
                        </label>
                        <input
                          type="text"
                          value={vip.aciklama}
                          onChange={(e) => {
                            const updated = [...pageTextsForm.artist.vipOzellikler];
                            while (updated.length <= idx) {
                              updated.push({ baslik: "", aciklama: "" });
                            }
                            updated[idx] = { ...updated[idx]!, aciklama: e.target.value };
                            setPageTextsForm({
                              ...pageTextsForm,
                              artist: { ...pageTextsForm.artist, vipOzellikler: updated },
                            });
                          }}
                          placeholder="Örn: Aynı anda tek odak..."
                          className="w-full px-3 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Aksiyon Buton Metni
              </label>
              <input
                type="text"
                value={pageTextsForm.artist.butonMetni}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    artist: { ...pageTextsForm.artist, butonMetni: e.target.value },
                  })
                }
                placeholder="Randevu Oluştur →"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          {/* Misafir Deneyimleri & Yorumlar Bölüm Metinleri CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  6. Misafir Yorumları Bölüm Başlığı &amp; Açıklaması
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Ana sayfadaki misafir deneyim kartlarının üst manşeti
                </p>
              </div>
              <Badge variant="gold">Yorumlar</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Üst Rozet Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.reviewsSection.rozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      reviewsSection: { ...pageTextsForm.reviewsSection, rozet: e.target.value },
                    })
                  }
                  placeholder="Misafir Deneyimleri"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Ana Bölüm Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.reviewsSection.baslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      reviewsSection: { ...pageTextsForm.reviewsSection, baslik: e.target.value },
                    })
                  }
                  placeholder="Değerli Misafirlerimizin Yorumları"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Yorumlar Alt Açıklaması
              </label>
              <textarea
                rows={2}
                value={pageTextsForm.reviewsSection.aciklama}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    reviewsSection: { ...pageTextsForm.reviewsSection, aciklama: e.target.value },
                  })
                }
                placeholder="Salonumuzda ağırladığımız misafirlerimizin samimi değerlendirmeleri..."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          {/* Randevu Takip & Sorgulama Bölüm Metinleri CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  7. Randevu Takip &amp; Sorgulama Bölüm Metinleri
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Ana sayfadaki telefon numarası ile sorgulama kutusunun metinleri
                </p>
              </div>
              <Badge variant="gold">Randevu Takip</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Üst Rozet Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.trackerSection.rozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      trackerSection: { ...pageTextsForm.trackerSection, rozet: e.target.value },
                    })
                  }
                  placeholder="Randevu Takip & Sorgulama"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Ana Bölüm Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.trackerSection.baslik}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      trackerSection: { ...pageTextsForm.trackerSection, baslik: e.target.value },
                    })
                  }
                  placeholder="Randevunuzun Durumunu Öğrenin"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Sorgula Buton Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.trackerSection.butonMetni}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      trackerSection: { ...pageTextsForm.trackerSection, butonMetni: e.target.value },
                    })
                  }
                  placeholder="Sorgula"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Sorgulama Alt Açıklaması
              </label>
              <textarea
                rows={2}
                value={pageTextsForm.trackerSection.aciklama}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    trackerSection: { ...pageTextsForm.trackerSection, aciklama: e.target.value },
                  })
                }
                placeholder="Telefon numaranızı girerek onay durumunu..."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          {/* Ana Sayfa Alt Randevu Çağrısı (CTA) CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  8. Ana Sayfa Alt Randevu Çağrısı (CTA Bloğu)
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Sayfanın en altındaki büyük manşetli online randevu davet alanı
                </p>
              </div>
              <Badge variant="gold">Alt CTA</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Üst Vurgu Rozeti
                </label>
                <input
                  type="text"
                  value={pageTextsForm.homeCTA.rozet}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      homeCTA: { ...pageTextsForm.homeCTA, rozet: e.target.value },
                    })
                  }
                  placeholder="Zaman Sizin İçin Akıyor"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Buton Metni
                </label>
                <input
                  type="text"
                  value={pageTextsForm.homeCTA.butonMetni}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      homeCTA: { ...pageTextsForm.homeCTA, butonMetni: e.target.value },
                    })
                  }
                  placeholder="Hemen Randevu Al"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Büyük Ana Başlık
              </label>
              <input
                type="text"
                value={pageTextsForm.homeCTA.baslik}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    homeCTA: { ...pageTextsForm.homeCTA, baslik: e.target.value },
                  })
                }
                placeholder="Kendinize Hak Ettiğiniz Zarafeti Armağan Edin"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Açıklama / Davet Metni
              </label>
              <textarea
                rows={3}
                value={pageTextsForm.homeCTA.aciklama}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    homeCTA: { ...pageTextsForm.homeCTA, aciklama: e.target.value },
                  })
                }
                placeholder="Randevu oluşturduğunuzda seçtiğiniz saat dilimi 30 dakika boyunca adınıza rezerve edilir..."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          {/* Hakkımızda Sayfası CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-text-primary">
                9. Hakkımızda Sayfası (Hikaye &amp; Kurucu Felsefesi)
              </h3>
              <Badge variant="gold">Hakkımızda</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Kurucu Özlü Sözü / Alıntı (Üst Manşet)
                </label>
                <input
                  type="text"
                  value={pageTextsForm.about.quote}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      about: { ...pageTextsForm.about, quote: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Kurucu İsim &amp; Ünvan
                </label>
                <input
                  type="text"
                  value={pageTextsForm.about.founder}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      about: { ...pageTextsForm.about, founder: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Hikaye Başlığı
              </label>
              <input
                type="text"
                value={pageTextsForm.about.storyTitle}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    about: { ...pageTextsForm.about, storyTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Salon Hikayesi &amp; Vizyon Metni
              </label>
              <textarea
                rows={4}
                value={pageTextsForm.about.storyText}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    about: { ...pageTextsForm.about, storyText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          {/* İletişim Sayfası CMS */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-text-primary">
                10. İletişim Sayfası Metinleri
              </h3>
              <Badge variant="gold">İletişim</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Karşılama Başlığı
                </label>
                <input
                  type="text"
                  value={pageTextsForm.contact.welcomeTitle}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      contact: { ...pageTextsForm.contact, welcomeTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Karşılama Alt Açıklaması
                </label>
                <input
                  type="text"
                  value={pageTextsForm.contact.welcomeSubtitle}
                  onChange={(e) =>
                    setPageTextsForm({
                      ...pageTextsForm,
                      contact: { ...pageTextsForm.contact, welcomeSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Vale, Otopark &amp; Ulaşım Notu
              </label>
              <textarea
                rows={2}
                value={pageTextsForm.contact.transitNote}
                onChange={(e) =>
                  setPageTextsForm({
                    ...pageTextsForm,
                    contact: { ...pageTextsForm.contact, transitNote: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" className="font-bold px-8 shadow-sm">
              ✓ Sayfa Metinlerini Canlıya Aktar
            </Button>
          </div>
        </form>
      )}

      {/* SEKME 3: ÇALIŞMA SAATLERİ & ÖZEL GÜNLER */}
      {activeTab === "hours" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveGeneral}>
            <Card className="p-6 bg-white border-border shadow-xs space-y-4">
              <h3 className="font-serif text-base font-bold text-text-primary border-b border-border pb-2">
                Haftalık Standart Çalışma Saatleri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Hafta İçi (Pzt - Cuma)
                  </label>
                  <input
                    type="text"
                    required
                    value={generalForm.calismaSaatleri.haftaIci}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        calismaSaatleri: {
                          ...generalForm.calismaSaatleri,
                          haftaIci: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Cumartesi
                  </label>
                  <input
                    type="text"
                    required
                    value={generalForm.calismaSaatleri.cumartesi}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        calismaSaatleri: {
                          ...generalForm.calismaSaatleri,
                          cumartesi: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Pazar Günü
                  </label>
                  <input
                    type="text"
                    required
                    value={generalForm.calismaSaatleri.pazar}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        calismaSaatleri: {
                          ...generalForm.calismaSaatleri,
                          pazar: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" className="font-bold">
                  ✓ Saatleri Kaydet
                </Button>
              </div>
            </Card>
          </form>

          {/* Özel Tatil ve Kapalı Günler */}
          <Card className="p-6 bg-white border-border shadow-xs space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-text-primary">
                Özel Günler &amp; Resmi Tatil Takvimi
              </h3>
              <span className="text-xs text-text-secondary">
                {specialDays.length} Özel Gün Tanımlı
              </span>
            </div>

            {/* Yeni Gün Ekleme Formu */}
            <form onSubmit={handleAddSpecialDay} className="p-4 rounded-xl bg-bg-secondary border border-border space-y-3">
              <span className="text-xs font-bold text-text-primary block">
                + Yeni Özel Gün / Tatil Ekle
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    required
                    value={specialDate}
                    onChange={(e) => setSpecialDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Tatil / Özel Durum Açıklaması *
                  </label>
                  <input
                    type="text"
                    required
                    value={specialDesc}
                    onChange={(e) => setSpecialDesc(e.target.value)}
                    placeholder="Örn: 29 Ekim Cumhuriyet Bayramı veya Bayram Özel Mesaisi"
                    className="w-full px-2.5 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Durum
                  </label>
                  <select
                    value={specialClosed ? "kapali" : "acik"}
                    onChange={(e) => setSpecialClosed(e.target.value === "kapali")}
                    className="w-full px-2.5 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary"
                  >
                    <option value="kapali">Tam Gün Kapalı</option>
                    <option value="acik">Özel Saatli Açık</option>
                  </select>
                </div>
              </div>

              {!specialClosed && (
                <div className="max-w-xs">
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Özel Çalışma Saatleri
                  </label>
                  <input
                    type="text"
                    value={specialHours}
                    onChange={(e) => setSpecialHours(e.target.value)}
                    placeholder="Örn: 10:00 - 16:00"
                    className="w-full px-2.5 py-1.5 border border-border rounded-md text-xs bg-white text-text-primary"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  + Takvime Ekle
                </Button>
              </div>
            </form>

            {/* Mevcut Özel Günler Listesi */}
            <div className="space-y-2 pt-2">
              {specialDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-white hover:bg-bg-secondary transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-text-primary bg-bg-secondary px-2 py-1 rounded">
                      {day.tarih}
                    </span>
                    <span className="font-semibold text-text-primary">{day.aciklama}</span>
                    <Badge variant={day.kapali ? "pink" : "gold"}>
                      {day.kapali ? "🚫 Tam Gün Kapalı" : `⏰ ${day.ozelSaatler ?? "Özel Saat"}`}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteSpecialDay(day.id)}
                    className="text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* SEKME 4: RANDEVU & İŞ KURALLARI */}
      {activeTab === "rules" && (
        <form onSubmit={handleSaveRules} className="space-y-6">
          <Card className="p-6 bg-white border-border shadow-xs space-y-5">
            <h3 className="font-serif text-base font-bold text-text-primary border-b border-border pb-2">
              Randevu Motoru &amp; Rezervasyon Kuralları
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
                <label className="block text-xs font-bold text-text-primary">
                  Varsayılan Tampon Süre (Dakika)
                </label>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  İşlem bittikten sonra istasyon temizliği ve yeni misafir hazırlığı için otomatik takvime eklenen ara dinlenme süresi.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={5}
                    value={rulesForm.tamponSureDakika}
                    onChange={(e) =>
                      setRulesForm({
                        ...rulesForm,
                        tamponSureDakika: Number(e.target.value),
                      })
                    }
                    className="w-28 px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary font-bold focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                  <span className="text-xs font-semibold text-text-primary">Dakika</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
                <label className="block text-xs font-bold text-text-primary">
                  Geçici Slot Blokaj Süresi (Dakika)
                </label>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Müşteri randevu adımlarını doldururken başkasının aynı koltuğu kapmasını engelleyen sepet kilitleme süresi.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    value={rulesForm.blokajSuresiDakika}
                    onChange={(e) =>
                      setRulesForm({
                        ...rulesForm,
                        blokajSuresiDakika: Number(e.target.value),
                      })
                    }
                    className="w-28 px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary font-bold focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                  <span className="text-xs font-semibold text-text-primary">Dakika</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-white">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    🎁 Sadakat Puanı Sistemi
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Her 10 TL harcamaya 1 puan; 100 puan = 50 TL indirim uygular.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rulesForm.sadakatPuaniAktif}
                  onChange={(e) =>
                    setRulesForm({
                      ...rulesForm,
                      sadakatPuaniAktif: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-accent-gold cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-white">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    🧾 E-Fatura / E-Arşiv Modülü
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Kasa ödemelerinde kurumsal e-arşiv fatura entegrasyonu.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rulesForm.eFaturaAktif}
                  onChange={(e) =>
                    setRulesForm({
                      ...rulesForm,
                      eFaturaAktif: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-accent-gold cursor-pointer"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" className="font-bold px-8 shadow-sm">
              ✓ Kuralları Kaydet
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
