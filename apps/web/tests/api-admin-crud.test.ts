import { describe, it, expect, vi } from "vitest";
import { CustomerReviewSchema, generateSafeUUID } from "@yildiz/types";

vi.mock("@/lib/auth/api-guard", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withStaffOrAdminAuth: (handler: any) => handler,
}));

vi.mock("@/lib/supabase/admin", () => {
  const createChain = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = Promise.resolve({ data: [{ id: "mock-uuid", begeni_sayisi: 5 }], error: null });
    p.order = vi.fn().mockImplementation(createChain);
    p.eq = vi.fn().mockImplementation(createChain);
    p.maybeSingle = vi.fn().mockResolvedValue({ data: { id: "mock-uuid", begeni_sayisi: 5 }, error: null });
    p.single = vi.fn().mockResolvedValue({ data: { id: "mock-uuid", begeni_sayisi: 5 }, error: null });
    p.select = vi.fn().mockImplementation(createChain);
    return p;
  };

  return {
    getSupabaseAdmin: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockImplementation(createChain),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "mock-uuid", begeni_sayisi: 5 }, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "mock-uuid", begeni_sayisi: 6 }, error: null }),
            }),
          }),
        }),
      }),
    }),
  };
});

import { GET as ReviewsGET, POST as ReviewsPOST, DELETE as ReviewsDELETE, PATCH as ReviewsPATCH } from "../src/app/api/admin/reviews/route";
import { GET as ServicesGET, POST as ServicesPOST, DELETE as ServicesDELETE, PATCH as ServicesPATCH } from "../src/app/api/admin/services/route";
import { GET as InventoryGET, POST as InventoryPOST, DELETE as InventoryDELETE, PATCH as InventoryPATCH } from "../src/app/api/admin/inventory/route";
import { GET as SuppliersGET, POST as SuppliersPOST, DELETE as SuppliersDELETE, PATCH as SuppliersPATCH } from "../src/app/api/admin/suppliers/route";
import { GET as AppointmentsGET, PATCH as AppointmentsPATCH, DELETE as AppointmentsDELETE } from "../src/app/api/admin/appointments/route";
import { GET as GalleryGET, POST as GalleryPOST, DELETE as GalleryDELETE, PATCH as GalleryPATCH } from "../src/app/api/admin/gallery/route";
import { GET as AdminGalleryCommentsGET, DELETE as AdminGalleryCommentsDELETE } from "../src/app/api/admin/gallery/comments/route";
import { POST as GalleryLikePOST } from "../src/app/api/gallery/like/route";
import { GET as GalleryCommentsGET, POST as GalleryCommentsPOST } from "../src/app/api/gallery/comments/route";
import { POST as PublicReviewPOST } from "../src/app/api/reviews/route";
import { GalleryCommentSchema } from "@yildiz/types";

describe("Admin Tam CRUD API Rotaları ve Google Metinsiz Yorum Testleri", () => {
  describe("Google Metinsiz Puanlama (CustomerReviewSchema)", () => {
    it("yorum metni olmadan yalnızca yıldız puanı ile CustomerReview şeması geçerlidir", () => {
      const reviewWithoutText = {
        id: generateSafeUUID(),
        musteriAdi: "Melis Şen",
        puan: 5,
        tarih: "25 Ekim 2026",
        kaynak: "Google" as const,
        googleReviewUrl: "https://share.google/test12345",
      };

      expect(() => CustomerReviewSchema.parse(reviewWithoutText)).not.toThrow();
      const parsed = CustomerReviewSchema.parse(reviewWithoutText);
      expect(parsed.yorum).toBeUndefined();
      expect(parsed.puan).toBe(5);
    });

    it("yorum metni boş string veya undefined olduğunda sorunsuz kabul edilir", () => {
      const reviewWithEmptyText = {
        id: generateSafeUUID(),
        musteriAdi: "Gizem A.",
        puan: 5,
        yorum: "",
        tarih: "25 Ekim 2026",
        kaynak: "Google" as const,
      };

      expect(() => CustomerReviewSchema.parse(reviewWithEmptyText)).not.toThrow();
    });
  });

  describe("Reviews API (/api/admin/reviews)", () => {
    it("GET tüm yorumları başarılı getirir", async () => {
      const res = await ReviewsGET(new Request("http://localhost/api/admin/reviews"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("POST yeni yorumu (metinli veya metinsiz) ekler", async () => {
      const req = new Request("http://localhost/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_adi: "Test Müşteri",
          puan: 5,
          hizmet_turu: "Fön",
          google_review_url: "https://share.google/test",
        }),
      });

      const res = await ReviewsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("mock-uuid");
    });

    it("DELETE id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/reviews");
      const res = await ReviewsDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile silme işlemi yapar", async () => {
      const req = new Request("http://localhost/api/admin/reviews?id=test-review-id");
      const res = await ReviewsDELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("PATCH id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: false }),
      });
      const res = await ReviewsPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH id ile yorumu günceller", async () => {
      const req = new Request("http://localhost/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-review-id", aktif: true }),
      });
      const res = await ReviewsPATCH(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Services API (/api/admin/services)", () => {
    it("GET tüm hizmetleri getirir", async () => {
      const res = await ServicesGET(new Request("http://localhost/api/admin/services"));
      expect(res.status).toBe(200);
    });

    it("POST yeni hizmet ekler", async () => {
      const req = new Request("http://localhost/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: "Yeni Tasarım Saç Kesimi",
          kategori: "Saç Tasarımı",
          tahminiSureDakika: 50,
          fiyat: 750,
          aktif: true,
        }),
      });

      const res = await ServicesPOST(req);
      expect(res.status).toBe(200);
    });

    it("DELETE id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/services");
      const res = await ServicesDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile hizmeti siler", async () => {
      const req = new Request("http://localhost/api/admin/services?id=test-service-id");
      const res = await ServicesDELETE(req);
      expect(res.status).toBe(200);
    });

    it("PATCH id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: false }),
      });
      const res = await ServicesPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH geçerli id ile hizmeti günceller", async () => {
      const req = new Request("http://localhost/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-service-id", aktif: true, fiyat: 800 }),
      });
      const res = await ServicesPATCH(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Inventory API (/api/admin/inventory)", () => {
    it("GET tüm stokları getirir", async () => {
      const res = await InventoryGET(new Request("http://localhost/api/admin/inventory"));
      expect(res.status).toBe(200);
    });

    it("POST yeni ürün ekler", async () => {
      const req = new Request("http://localhost/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urunAdi: "Olaplex No. 2",
          kategori: "Bakım & Tedavi",
          miktar: 8,
          birim: "Şişe",
          kritikSeviye: 4,
        }),
      });

      const res = await InventoryPOST(req);
      expect(res.status).toBe(200);
    });

    it("DELETE id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/inventory");
      const res = await InventoryDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile ürünü siler", async () => {
      const req = new Request("http://localhost/api/admin/inventory?id=test-inv-id");
      const res = await InventoryDELETE(req);
      expect(res.status).toBe(200);
    });

    it("PATCH id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miktar: 15 }),
      });
      const res = await InventoryPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH geçerli id ile stok miktarını günceller", async () => {
      const req = new Request("http://localhost/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-inv-id", miktar: 20 }),
      });
      const res = await InventoryPATCH(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Suppliers API (/api/admin/suppliers)", () => {
    it("GET tüm tedarikçileri getirir", async () => {
      const res = await SuppliersGET(new Request("http://localhost/api/admin/suppliers"));
      expect(res.status).toBe(200);
    });

    it("POST yeni tedarikçi ekler", async () => {
      const req = new Request("http://localhost/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmaAdi: "Wella Kozmetik",
          yetkiliKisi: "Ahmet K.",
          telefon: "02165551122",
          kategoriler: ["Boya"],
        }),
      });

      const res = await SuppliersPOST(req);
      expect(res.status).toBe(200);
    });

    it("DELETE id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/suppliers");
      const res = await SuppliersDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile tedarikçiyi siler", async () => {
      const req = new Request("http://localhost/api/admin/suppliers?id=test-sup-id");
      const res = await SuppliersDELETE(req);
      expect(res.status).toBe(200);
    });

    it("PATCH id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaAdi: "Yeni Firma" }),
      });
      const res = await SuppliersPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH geçerli id ile tedarikçiyi günceller", async () => {
      const req = new Request("http://localhost/api/admin/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-sup-id", firmaAdi: "Güncel Kozmetik" }),
      });
      const res = await SuppliersPATCH(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Appointments API (/api/admin/appointments)", () => {
    it("GET randevuları getirir", async () => {
      const res = await AppointmentsGET(new Request("http://localhost/api/admin/appointments"));
      expect(res.status).toBe(200);
    });

    it("PATCH id eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: "Onaylandı" }),
      });

      const res = await AppointmentsPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH geçerli id ile randevu durumunu günceller", async () => {
      const req = new Request("http://localhost/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-app-id", durum: "Onaylandı" }),
      });

      const res = await AppointmentsPATCH(req);
      expect(res.status).toBe(200);
    });

    it("DELETE id eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/appointments");
      const res = await AppointmentsDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile randevuyu siler", async () => {
      const req = new Request("http://localhost/api/admin/appointments?id=test-app-id");
      const res = await AppointmentsDELETE(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Gallery API (/api/admin/gallery)", () => {
    it("GET tüm galeri öğelerini getirir", async () => {
      const res = await GalleryGET(new Request("http://localhost/api/admin/gallery"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("POST yeni fotoğraf veya video ekler", async () => {
      const req = new Request("http://localhost/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://images.unsplash.com/test-photo.jpg",
          baslik: "Altın Bal Balyaj & Dalgalar",
          kategori: "Renklendirme & Balyaj",
          sira: 1,
          medya_turu: "image",
          stilist: "Yıldız Aksoy",
          aciklama: "Doğal tonlama ve Olaplex bakımı",
        }),
      });

      const res = await GalleryPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("mock-uuid");
    });

    it("POST zorunlu alanlar (url/baslik/kategori) eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: "Eksik URL",
        }),
      });

      const res = await GalleryPOST(req);
      expect(res.status).toBe(400);
    });

    it("DELETE id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/gallery");
      const res = await GalleryDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile galeri öğesini siler", async () => {
      const req = new Request("http://localhost/api/admin/gallery?id=test-gallery-id");
      const res = await GalleryDELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("PATCH id parametresi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baslik: "Yeni Başlık" }),
      });
      const res = await GalleryPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH geçerli id ile galeri öğesini günceller", async () => {
      const req = new Request("http://localhost/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "test-gallery-id",
          baslik: "Güncellenmiş Balyaj Tasarımı",
          sira: 5,
        }),
      });
      const res = await GalleryPATCH(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Gallery Likes API (/api/gallery/like)", () => {
    it("POST eksik galleryId ile 400 döner", async () => {
      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(400);
    });

    it("POST like aksiyonu ile begeni sayısını artırır", async () => {
      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          action: "like",
        }),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.begeniSayisi).toBeGreaterThanOrEqual(0);
    });

    it("POST unlike aksiyonunu da kabul eder", async () => {
      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          action: "unlike",
        }),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("Gallery Comments API (/api/gallery/comments)", () => {
    it("GalleryCommentSchema doğru doğrular", () => {
      const sample = {
        id: generateSafeUUID(),
        galleryItemId: generateSafeUUID(),
        musteriAdi: "Selin Doğan",
        yorum: "Balyaj tonuna bayıldım!",
        tarih: "25 Ekim 2026",
        aktif: true,
      };

      expect(() => GalleryCommentSchema.parse(sample)).not.toThrow();
    });

    it("GET galleryId eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/gallery/comments");
      const res = await GalleryCommentsGET(req);
      expect(res.status).toBe(400);
    });

    it("GET geçerli galleryId ile yorumları getirir", async () => {
      const req = new Request("http://localhost/api/gallery/comments?galleryId=test-gallery-id");
      const res = await GalleryCommentsGET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("POST eksik parametrelerle 400 döner", async () => {
      const req = new Request("http://localhost/api/gallery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteriAdi: "Ayşe",
        }),
      });

      const res = await GalleryCommentsPOST(req);
      expect(res.status).toBe(400);
    });

    it("POST yeni yorumu kaydeder", async () => {
      const req = new Request("http://localhost/api/gallery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          musteriAdi: "Deniz Yılmaz",
          yorum: "Çok doğal bir geçiş olmuş, elinize sağlık.",
        }),
      });

      const res = await GalleryCommentsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("Admin Gallery Comments Moderation API (/api/admin/gallery/comments)", () => {
    it("GET tüm veya belirli galeri yorumlarını listeler", async () => {
      const req = new Request("http://localhost/api/admin/gallery/comments?galleryId=test-gallery-id");
      const res = await AdminGalleryCommentsGET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("DELETE id eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/gallery/comments");
      const res = await AdminGalleryCommentsDELETE(req);
      expect(res.status).toBe(400);
    });

    it("DELETE geçerli id ile yorumu siler", async () => {
      const req = new Request("http://localhost/api/admin/gallery/comments?id=test-comment-id");
      const res = await AdminGalleryCommentsDELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("Public Guest Review API (/api/reviews)", () => {
    it("POST 5 yıldızlı değerlendirmede 'google' funnel döner", async () => {
      const req = new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_adi: "Selin Doğan",
          puan: 5,
          yorum: "Harika bir fön ve balyaj deneyimi!",
          hizmet_turu: "Balyaj",
        }),
      });

      const res = await PublicReviewPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.funnel).toBe("google");
    });

    it("POST 2 yıldızlı değerlendirmede 'internal' funnel döner", async () => {
      const req = new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_adi: "Derya K.",
          puan: 2,
          yorum: "Bekleme süresi biraz uzundu.",
          hizmet_turu: "Kesim",
        }),
      });

      const res = await PublicReviewPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.funnel).toBe("internal");
    });

    it("POST musteri_adi eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puan: 5,
        }),
      });

      const res = await PublicReviewPOST(req);
      expect(res.status).toBe(400);
    });
  });
});
