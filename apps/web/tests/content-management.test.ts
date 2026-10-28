import { describe, it, expect } from "vitest";
import {
  SALON_INFO,
  DEFAULT_PAGE_TEXTS,
  MOCK_GALLERY,
  MOCK_REVIEWS,
  DEFAULT_BOOKING_RULES,
  DEFAULT_SPECIAL_DAYS,
} from "./fixtures/test-data";
import {
  SalonInfoSchema,
  PageTextsSchema,
  GalleryItemSchema,
  CustomerReviewSchema,
  BookingRulesSchema,
  SpecialDaySchema,
  generateSafeUUID,
} from "@yildiz/types";

describe("CMS & İçerik Yönetim Sistemi (Content Management System)", () => {
  describe("Zod Şemaları & Model Doğrulama", () => {
    it("SalonInfo şeması e-posta ve Google Harita bağlantılarını doğrular", () => {
      expect(() => SalonInfoSchema.parse(SALON_INFO)).not.toThrow();
      expect(SALON_INFO.eposta).toBe("randevu@yildizkuafor.com");
      expect(SALON_INFO.googleHaritaUrl).toContain("maps.google.com");
      expect(SALON_INFO.facebook).toBe("yildizbayankuaforu");
    });

    it("PageTexts şeması Hero, Hakkımızda ve İletişim CMS metinlerini eksiksiz doğrular", () => {
      expect(() => PageTextsSchema.parse(DEFAULT_PAGE_TEXTS)).not.toThrow();
      expect(DEFAULT_PAGE_TEXTS.hero.badge).toBeDefined();
      expect(DEFAULT_PAGE_TEXTS.hero.butonRandevu).toBe("Online Randevu Oluştur");
      expect(DEFAULT_PAGE_TEXTS.hero.butonGaleri).toBe("Koleksiyonu Keşfet →");
      expect(DEFAULT_PAGE_TEXTS.heroMedia.gorselUrl).toContain("http");
      expect(DEFAULT_PAGE_TEXTS.heroMedia.rozet).toBe("Haute Coiffure 2026");
      expect(DEFAULT_PAGE_TEXTS.heroFeatures).toHaveLength(3);
      expect(DEFAULT_PAGE_TEXTS.heroFeatures[0]?.baslik).toBe("01. Tampon Süreli Seans");
      expect(DEFAULT_PAGE_TEXTS.artist.adSoyad).toBe("Yıldız Bayan Kuaförü");
      expect(DEFAULT_PAGE_TEXTS.artist.etiket).toBe("Haute Coiffure Sanatçısı");
      expect(DEFAULT_PAGE_TEXTS.artist.vipOzellikler).toHaveLength(3);
      expect(DEFAULT_PAGE_TEXTS.servicesSection.baslik).toBe("Ustalıkla Sunulan Hizmetlerimiz");
      expect(DEFAULT_PAGE_TEXTS.reviewsSection.rozet).toBe("Misafir Deneyimleri");
      expect(DEFAULT_PAGE_TEXTS.reviewsSection.googleRating).toBe(4.9);
      expect(DEFAULT_PAGE_TEXTS.reviewsSection.googleReviewCount).toBe(14);
      expect(DEFAULT_PAGE_TEXTS.reviewsSection.googlePlaceId).toBe("ChIJR_wdvgizzBQR0tN_pKYFp3M");
      expect(DEFAULT_PAGE_TEXTS.trackerSection.butonMetni).toBe("Sorgula");
      expect(DEFAULT_PAGE_TEXTS.homeCTA.rozet).toBe("Zaman Sizin İçin Akıyor");
      expect(DEFAULT_PAGE_TEXTS.homeCTA.butonMetni).toBe("Hemen Randevu Al");
      expect(DEFAULT_PAGE_TEXTS.about.quote).toBeDefined();
      expect(DEFAULT_PAGE_TEXTS.contact.welcomeTitle).toBeDefined();
    });

    it("BookingRules şeması tampon süre ve blokaj süresini doğrular", () => {
      expect(() => BookingRulesSchema.parse(DEFAULT_BOOKING_RULES)).not.toThrow();
      expect(DEFAULT_BOOKING_RULES.tamponSureDakika).toBe(15);
      expect(DEFAULT_BOOKING_RULES.blokajSuresiDakika).toBe(30);
      expect(DEFAULT_BOOKING_RULES.sadakatPuaniAktif).toBe(true);
      expect(DEFAULT_BOOKING_RULES.eFaturaAktif).toBe(true);
    });

    it("SpecialDay şeması resmi tatil ve özel saatli günleri doğrular", () => {
      for (const day of DEFAULT_SPECIAL_DAYS) {
        expect(() => SpecialDaySchema.parse(day)).not.toThrow();
      }
    });

    it("CustomerReview şeması alınan hizmet türü (hizmetTuru) alanını destekler", () => {
      for (const rev of MOCK_REVIEWS) {
        expect(() => CustomerReviewSchema.parse(rev)).not.toThrow();
        expect(rev.hizmetTuru).toBeDefined();
      }
    });
  });

  describe("Galeri & Lookbook Mantıksal İşlemleri", () => {
    it("yeni bir fotoğraf eklendiğinde listenin başına eklenir ve ID atanır", () => {
      const initialGallery = [...MOCK_GALLERY];
      const newPhoto = {
        id: generateSafeUUID(),
        baslik: "Karamel Işıltılı Balyaj",
        kategori: "Renklendirme & Balyaj",
        gorselUrl: "https://images.unsplash.com/photo-example?w=800",
        stilist: "Elif Yıldırım",
        aciklama: "Doğal tonlama ve Olaplex bakımı",
        begeniSayisi: 0,
      };

      const updatedGallery = [newPhoto, ...initialGallery];
      expect(updatedGallery.length).toBe(initialGallery.length + 1);
      expect(updatedGallery[0]?.id).toBe(newPhoto.id);
      expect(() => GalleryItemSchema.parse(newPhoto)).not.toThrow();
    });

    it("fotoğraf silme işlemi ID bazında listeyi doğru filtreler", () => {
      const targetId = MOCK_GALLERY[0]!.id;
      const filtered = MOCK_GALLERY.filter((item) => item.id !== targetId);
      expect(filtered.length).toBe(MOCK_GALLERY.length - 1);
      expect(filtered.find((item) => item.id === targetId)).toBeUndefined();
    });

    it("kategoriye göre galeri filtreleme doğru çalışır", () => {
      const hairDesignItems = MOCK_GALLERY.filter((i) => i.kategori === "Saç Tasarım");
      const bridalItems = MOCK_GALLERY.filter((i) => i.kategori === "Gelin & Topuz");
      expect(hairDesignItems.length).toBeGreaterThan(0);
      expect(bridalItems.length).toBeGreaterThan(0);
      for (const item of hairDesignItems) {
        expect(item.kategori).toBe("Saç Tasarım");
      }
    });
  });

  describe("Müşteri Yorumları Mantıksal İşlemleri", () => {
    it("yeni yorum eklendiğinde vitrin listesine dahil olur", () => {
      const initialReviews = [...MOCK_REVIEWS];
      const newReview = {
        id: generateSafeUUID(),
        musteriAdi: "Canan Erdem",
        puan: 5,
        yorum: "Her şey kusursuzdu, teşekkürler.",
        kaynak: "Salon" as const,
        hizmetTuru: "Tasarım Saç Kesimi",
        tarih: "22 Ekim 2026",
      };

      const updated = [newReview, ...initialReviews];
      expect(updated.length).toBe(initialReviews.length + 1);
      expect(updated[0]?.musteriAdi).toBe("Canan Erdem");
      expect(() => CustomerReviewSchema.parse(newReview)).not.toThrow();
    });

    it("ortalama puan ve kaynak dağılımı doğru hesaplanır", () => {
      const totalScore = MOCK_REVIEWS.reduce((acc, curr) => acc + curr.puan, 0);
      const avg = totalScore / MOCK_REVIEWS.length;
      expect(avg).toBe(5);

      const googleCount = MOCK_REVIEWS.filter((r) => r.kaynak === "Google").length;
      const salonCount = MOCK_REVIEWS.filter((r) => r.kaynak === "Salon").length;
      expect(googleCount + salonCount).toBe(MOCK_REVIEWS.length);
    });

    it("3 doğrulanmış Google yorum linki eksiksiz bağlanmıştır ve şemaya uyar", () => {
      const verifiedGoogleReviews = MOCK_REVIEWS.filter(
        (r) => r.kaynak === "Google" && Boolean(r.googleReviewUrl),
      );
      expect(verifiedGoogleReviews.length).toBe(3);

      const expectedLinks = [
        "https://share.google/Ecq4YeYWcyOD1XNDn",
        "https://share.google/4sHXUzq8HV2fIVqoc",
        "https://share.google/mdjSlYWTmShVQbEMJ",
      ];

      for (const link of expectedLinks) {
        const found = verifiedGoogleReviews.some((r) => r.googleReviewUrl === link);
        expect(found).toBe(true);
      }

      for (const rev of verifiedGoogleReviews) {
        expect(() => CustomerReviewSchema.parse(rev)).not.toThrow();
        expect(rev.googleReviewUrl).toMatch(/^https:\/\//);
      }
    });

    it("yeni bir Google yorumu googleReviewUrl ile eklenebilir ve doğrulanır", () => {
      const newGoogleReview = {
        id: generateSafeUUID(),
        musteriAdi: "Zeynep Kaya",
        puan: 5,
        yorum: "Harika bir salon, kesinlikle tavsiye ederim.",
        kaynak: "Google" as const,
        hizmetTuru: "Renklendirme & Balyaj",
        tarih: "25 Ekim 2026",
        googleReviewUrl: "https://share.google/test12345",
      };

      expect(() => CustomerReviewSchema.parse(newGoogleReview)).not.toThrow();
      expect(newGoogleReview.googleReviewUrl).toBe("https://share.google/test12345");
    });

    it("ana sayfa için yorumlar createdAt DESC (en yeniden en eskiye) sıralanır ve ilk 5 kayıt korunur", () => {
      const mockReviewList = [
        { id: generateSafeUUID(), musteriAdi: "A", puan: 5, tarih: "10 Ekim 2026", kaynak: "Salon" as const, createdAt: "2026-10-10T12:00:00Z" },
        { id: generateSafeUUID(), musteriAdi: "B", puan: 5, tarih: "20 Ekim 2026", kaynak: "Salon" as const, createdAt: "2026-10-20T12:00:00Z" },
        { id: generateSafeUUID(), musteriAdi: "C", puan: 5, tarih: "15 Ekim 2026", kaynak: "Salon" as const, createdAt: "2026-10-15T12:00:00Z" },
        { id: generateSafeUUID(), musteriAdi: "D", puan: 5, tarih: "25 Ekim 2026", kaynak: "Salon" as const, createdAt: "2026-10-25T12:00:00Z" },
        { id: generateSafeUUID(), musteriAdi: "E", puan: 5, tarih: "05 Ekim 2026", kaynak: "Salon" as const, createdAt: "2026-10-05T12:00:00Z" },
        { id: generateSafeUUID(), musteriAdi: "F", puan: 5, tarih: "01 Ekim 2026", kaynak: "Salon" as const, createdAt: "2026-10-01T12:00:00Z" },
      ];

      const sorted = [...mockReviewList]
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 5);

      expect(sorted.length).toBe(5);
      expect(sorted[0]?.musteriAdi).toBe("D"); // En yeni (25 Ekim)
      expect(sorted[1]?.musteriAdi).toBe("B"); // 20 Ekim
      expect(sorted[2]?.musteriAdi).toBe("C"); // 15 Ekim
      expect(sorted[3]?.musteriAdi).toBe("A"); // 10 Ekim
      expect(sorted[4]?.musteriAdi).toBe("E"); // 05 Ekim
      expect(sorted.find((r) => r.musteriAdi === "F")).toBeUndefined(); // En eski 6. yorum vitrine girmez
    });
  });

  describe("Site ve CMS Ayarları Güncelleme Mantığı", () => {
    it("salon iletişim bilgileri kısmi (patch) olarak güncellenebilir", () => {
      const current = { ...SALON_INFO };
      const updatedPhone = "+90 216 999 88 77";
      const updated = { ...current, telefon: updatedPhone };

      expect(updated.telefon).toBe(updatedPhone);
      expect(updated.ad).toBe(current.ad);
      expect(() => SalonInfoSchema.parse(updated)).not.toThrow();
    });

    it("çalışma saatleri ve özel tatil günleri doğru yönetilir", () => {
      const currentSpecialDays = [...DEFAULT_SPECIAL_DAYS];
      const newHoliday = {
        id: generateSafeUUID(),
        tarih: "2026-11-10",
        aciklama: "Atatürk'ü Anma Günü Özel Programı",
        kapali: false,
        ozelSaatler: "11:00 - 18:00",
      };

      const updatedDays = [...currentSpecialDays, newHoliday];
      expect(updatedDays.length).toBe(currentSpecialDays.length + 1);
      expect(updatedDays[updatedDays.length - 1]?.ozelSaatler).toBe("11:00 - 18:00");
    });

    it("randevu kuralları (tampon & blokaj) sınır kontrollerine uyar", () => {
      const rules = {
        tamponSureDakika: 20,
        blokajSuresiDakika: 45,
        sadakatPuaniAktif: false,
        eFaturaAktif: true,
      };

      const parsed = BookingRulesSchema.parse(rules);
      expect(parsed.tamponSureDakika).toBe(20);
      expect(parsed.blokajSuresiDakika).toBe(45);
      expect(parsed.sadakatPuaniAktif).toBe(false);
    });

    it("Hero görseli, güvence maddeleri ve alt CTA blokları CMS üzerinden güncellenebilir", () => {
      const initial = { ...DEFAULT_PAGE_TEXTS };
      const updated: typeof DEFAULT_PAGE_TEXTS = {
        ...initial,
        heroMedia: {
          ...initial.heroMedia,
          gorselUrl: "https://images.unsplash.com/custom-photo",
          rozet: "Özel Koleksiyon 2027",
        },
        heroFeatures: [
          { baslik: "01. Özel Randevu", aciklama: "Kişiye özel zaman dilimi" },
          { baslik: "02. VIP Salon", aciklama: "İzole kişisel bakım alanı" },
          { baslik: "03. Ücretsiz İkram", aciklama: "Organik detoks çayları" },
        ],
        homeCTA: {
          ...initial.homeCTA,
          baslik: "Şimdi Randevunuzu Alın",
          butonMetni: "Hemen Rezervasyon Yap",
        },
      };

      expect(() => PageTextsSchema.parse(updated)).not.toThrow();
      expect(updated.heroMedia.gorselUrl).toBe("https://images.unsplash.com/custom-photo");
      expect(updated.heroFeatures[0]?.baslik).toBe("01. Özel Randevu");
      expect(updated.homeCTA.butonMetni).toBe("Hemen Rezervasyon Yap");
    });
  });
});
