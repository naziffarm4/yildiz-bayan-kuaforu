import { describe, it, expect } from "vitest";
import {
  MOCK_SERVICES,
  MOCK_STAFF,
  MOCK_REVIEWS,
  MOCK_GALLERY,
  INITIAL_MOCK_APPOINTMENTS,
  SALON_INFO,
} from "./fixtures/test-data";
import {
  ServiceItemSchema,
  StaffProfileSchema,
  CustomerReviewSchema,
  GalleryItemSchema,
  SalonInfoSchema,
  AppointmentItemSchema,
  calculateAppointmentTotalDuration,
} from "@yildiz/types";

describe("Mock Veri ve Model Uyumluluğu", () => {
  it("tüm kuaför hizmetleri ServiceItem şemasına eksiksiz uyar", () => {
    expect(MOCK_SERVICES.length).toBeGreaterThan(5);
    for (const service of MOCK_SERVICES) {
      expect(() => ServiceItemSchema.parse(service)).not.toThrow();
      expect(service.tahminiSureDakika).toBeGreaterThan(0);
      expect(service.fiyat).toBeGreaterThan(0);
      if (service.gorselUrl) {
        expect(service.gorselUrl).toMatch(/^https:\/\//);
      }
    }
  });

  it("çalışan kadrosu StaffProfile şemasına uyar", () => {
    expect(MOCK_STAFF.length).toBeGreaterThanOrEqual(3);
    for (const member of MOCK_STAFF) {
      expect(() => StaffProfileSchema.parse(member)).not.toThrow();
    }
  });

  it("müşteri yorumları en az 5 adet olup CustomerReview şemasına uyar", () => {
    expect(MOCK_REVIEWS.length).toBeGreaterThanOrEqual(5);
    for (const review of MOCK_REVIEWS) {
      expect(() => CustomerReviewSchema.parse(review)).not.toThrow();
      expect(review.puan).toBe(5);
    }
  });

  it("galeri koleksiyonu GalleryItem şemasına uyar", () => {
    expect(MOCK_GALLERY.length).toBeGreaterThanOrEqual(6);
    for (const item of MOCK_GALLERY) {
      expect(() => GalleryItemSchema.parse(item)).not.toThrow();
      expect(item.gorselUrl).toMatch(/^https:\/\//);
      expect(item.begeniSayisi).toBeGreaterThan(0);
    }
  });

  it("örnek randevular AppointmentItem şemasına uyar", () => {
    for (const app of INITIAL_MOCK_APPOINTMENTS) {
      expect(() => AppointmentItemSchema.parse(app)).not.toThrow();
    }
  });

  it("hizmet süreleri ve tampon süre toplamını doğru hesaplar", () => {
    const s1 = MOCK_SERVICES[0]?.tahminiSureDakika ?? 45;
    const s2 = MOCK_SERVICES[1]?.tahminiSureDakika ?? 30;
    const total = calculateAppointmentTotalDuration([s1, s2], SALON_INFO.varsayilanTamponSureDakika);
    expect(total).toBe(s1 + s2 + 15);
  });

  it("salon bilgileri ve sosyal medya kanalları SalonInfo şemasına uyar", () => {
    expect(() => SalonInfoSchema.parse(SALON_INFO)).not.toThrow();
    expect(SALON_INFO.facebook).toBeDefined();
    expect(SALON_INFO.whatsapp).toBeDefined();
    expect(SALON_INFO.telefon).toBe("+90 216 555 00 00");
  });
});
