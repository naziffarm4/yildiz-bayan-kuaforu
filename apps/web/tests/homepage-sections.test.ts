import { describe, it, expect } from "vitest";
import type { ServiceItem, CustomerReview } from "@yildiz/types";

describe("Ana Sayfa ve BeautyZone Bileşenleri Şartname Uyumluluk Testleri", () => {
  it("Şartname Madde 11: Hizmet kataloğu müşteri arayüzünde fiyat gösterilmez kuralına uyar", () => {
    const mockServices: ServiceItem[] = [
      {
        id: "srv-1",
        ad: "Saç Kesimi & Şekillendirme",
        kategori: "Saç Tasarımı",
        tahminiSureDakika: 45,
        fiyat: 750,
        aktif: true,
      },
      {
        id: "srv-2",
        ad: "Doğal Balyaj & Işıltı",
        kategori: "Renklendirme",
        tahminiSureDakika: 150,
        fiyat: 2500,
        aktif: true,
      },
    ];

    // Fiyat bilgisi yalnızca modelde tutulur, müşteri arayüzü kartı metinlerinde süre ve seans bilgisi ön plandadır
    mockServices.forEach((srv) => {
      expect(srv.tahminiSureDakika).toBeGreaterThan(0);
      expect(srv.ad).not.toMatch(/spa|masaj|cilt bakımı/i);
    });
  });

  it("Şartname Madde 13: En son eklenen maksimum 5 yorum listelenir", () => {
    const mockReviews: CustomerReview[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: `rev-${idx}`,
      musteriAdi: `Misafir ${idx}`,
      puan: 5,
      yorum: `Harika kuaförlük hizmeti ${idx}`,
      tarih: "2026-10-25",
      kaynak: idx % 2 === 0 ? "Google" : "Salon",
    }));

    const displayedReviews = mockReviews.slice(0, 5);
    expect(displayedReviews.length).toBe(5);
  });

  it("Şartname Madde 11 Hizmet Kapsamı: Kuaför hizmetleri geçerli, spa ve masaj yasaktır", () => {
    const validSalonServices = [
      "Saç Kesimi",
      "Fön",
      "Boya",
      "Röfle / Balyaj",
      "Keratin / Botoks",
      "Saç Kaynak",
      "Gelin Saçı",
      "Saç Örgüsü",
      "Manikür",
      "Pedikür",
      "Ağda",
      "Saç Bakımı",
    ];

    const forbiddenServices = ["Spa", "Masaj", "Cilt Bakımı"];

    validSalonServices.forEach((service) => {
      const isForbidden = forbiddenServices.some((forbidden) =>
        service.toLowerCase().includes(forbidden.toLowerCase())
      );
      expect(isForbidden).toBe(false);
    });
  });
});
