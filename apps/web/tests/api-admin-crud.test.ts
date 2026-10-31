import { describe, it, expect, vi, beforeEach } from "vitest";
import { CustomerReviewSchema, GalleryCommentSchema, generateSafeUUID } from "@yildiz/types";
import type { RouteHandler } from "../src/lib/auth/api-guard";

const { mockAuthGetUser, mockProfileMaybeSingle, mockRpc, mockStorageUpload, mockStorageGetPublicUrl } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn().mockResolvedValue({
    data: { user: { id: "auth-user-123" } },
    error: null,
  }),
  mockProfileMaybeSingle: vi.fn().mockResolvedValue({
    data: { rol: "Calisan" },
    error: null,
  }),
  mockRpc: vi.fn().mockResolvedValue({
    data: 6,
    error: null,
  }),
  mockStorageUpload: vi.fn().mockResolvedValue({ error: { message: "Storage mock error" } }),
  mockStorageGetPublicUrl: vi.fn().mockReturnValue({
    data: {
      publicUrl:
        "https://mock.supabase.co/storage/v1/object/public/salon-media/gallery/test.png",
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockProfileMaybeSingle,
        })),
      })),
    })),
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  withStaffOrAdminAuth: (handler: RouteHandler) => handler,
  withAdminAuth: (handler: RouteHandler) => handler,
  withRole: (_roles: readonly string[], handler: RouteHandler) => handler,
  getRequestAuthContext: () => ({
    userId: "auth-user-123",
    role: "Admin",
    ipAddress: "127.0.0.1",
  }),
}));

interface MockQueryChain
  extends Promise<{
    data: Array<{ id: string; begeni_sayisi: number; durum: string }>;
    error: null;
  }> {
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
}

vi.mock("@/lib/supabase/admin", () => {
  const createChain = (): MockQueryChain => {
    const basePromise = Promise.resolve({
      data: [{ id: "mock-uuid", begeni_sayisi: 5, durum: "Tamamlandı" }],
      error: null,
    });
    const chain = Object.assign(basePromise, {
      order: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      lt: vi.fn(),
      range: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { begeni_sayisi: 5, durum: "Tamamlandı" },
        error: null,
      }),
      single: vi.fn().mockResolvedValue({
        data: { id: "mock-uuid", begeni_sayisi: 5, durum: "Tamamlandı" },
        error: null,
      }),
      select: vi.fn(),
    });
    chain.order.mockImplementation(createChain);
    chain.eq.mockImplementation(createChain);
    chain.gte.mockImplementation(createChain);
    chain.lte.mockImplementation(createChain);
    chain.lt.mockImplementation(createChain);
    chain.range.mockImplementation(createChain);
    chain.limit.mockImplementation(createChain);
    chain.select.mockImplementation(createChain);
    return chain;
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
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockStorageUpload,
          getPublicUrl: mockStorageGetPublicUrl,
        }),
      },
    }),
  };
});

import { GET as ReviewsGET, POST as ReviewsPOST, DELETE as ReviewsDELETE, PATCH as ReviewsPATCH } from "../src/app/api/admin/reviews/route";
import { GET as ServicesGET, POST as ServicesPOST, DELETE as ServicesDELETE, PATCH as ServicesPATCH } from "../src/app/api/admin/services/route";
import { GET as InventoryGET, POST as InventoryPOST, DELETE as InventoryDELETE, PATCH as InventoryPATCH } from "../src/app/api/admin/inventory/route";
import { GET as SuppliersGET, POST as SuppliersPOST, DELETE as SuppliersDELETE, PATCH as SuppliersPATCH } from "../src/app/api/admin/suppliers/route";
import { GET as AppointmentsGET, POST as AppointmentsPOST, PATCH as AppointmentsPATCH, DELETE as AppointmentsDELETE } from "../src/app/api/admin/appointments/route";
import { GET as GalleryGET, POST as GalleryPOST, DELETE as GalleryDELETE, PATCH as GalleryPATCH } from "../src/app/api/admin/gallery/route";
import { GET as AdminGalleryCommentsGET, PATCH as AdminGalleryCommentsPATCH, DELETE as AdminGalleryCommentsDELETE } from "../src/app/api/admin/gallery/comments/route";
import { POST as GalleryLikePOST } from "../src/app/api/gallery/like/route";
import { GET as GalleryCommentsGET, POST as GalleryCommentsPOST } from "../src/app/api/gallery/comments/route";
import { POST as PublicReviewPOST } from "../src/app/api/reviews/route";
import { POST as AdminUploadPOST } from "../src/app/api/admin/upload/route";
import { resetRateLimiter } from "../src/lib/rate-limit";

describe("Admin Tam CRUD API Rotaları ve Google Metinsiz Yorum Testleri", () => {
  beforeEach(() => {
    resetRateLimiter();
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-123" } },
      error: null,
    });
  });
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

    it("POST negatif fiyat veya negatif süre değerini 400 ile reddeder (G-09)", async () => {
      const req = new Request("http://localhost/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: "Negatif Hizmet",
          kategori: "Saç Tasarımı",
          tahminiSureDakika: 45,
          fiyat: -100,
        }),
      });
      const res = await ServicesPOST(req);
      expect(res.status).toBe(400);
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
    it("GET randevuları ve pagination meta bilgisini getirir (P-03)", async () => {
      const res = await AppointmentsGET(
        new Request("http://localhost/api/admin/appointments?limit=50&offset=10")
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.pagination).toEqual({
        limit: 50,
        offset: 10,
        count: expect.any(Number),
      });
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

    it("PATCH geçersiz durum enum değerini 400 ile reddeder (G-09)", async () => {
      const req = new Request("http://localhost/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-app-id", durum: "GecersizDurum" }),
      });

      const res = await AppointmentsPATCH(req);
      expect(res.status).toBe(400);
    });

    it("DELETE id eksikse 400 döner", async () => {
      const req = new Request("http://localhost/api/admin/appointments");
      const res = await AppointmentsDELETE(req);
      expect(res.status).toBe(400);
    });

    it("POST geçerli verilerle yeni admin/manuel randevu oluşturur (Y2, K-2)", async () => {
      const req = new Request("http://localhost/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_ad_soyad: "Seda Yıldız",
          musteri_telefon: "0532 444 55 66",
          hizmet_idleri: ["srv-1"],
          calisan_idleri: ["staff-1"],
          tarih_saat: "2026-11-15T14:00:00+03:00",
          toplam_sure_dakika: 45,
          durum: "Onaylandı",
          kaynak: "Telefon",
        }),
      });

      const res = await AppointmentsPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("POST zorunlu alanlar eksikse 400 döner (Y2, K-2)", async () => {
      const req = new Request("http://localhost/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_ad_soyad: "Seda Yıldız",
        }),
      });

      const res = await AppointmentsPOST(req);
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
          stilist: "Yıldız Bayan Kuaförü",
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
    beforeEach(() => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: "auth-user-123" } },
        error: null,
      });
      mockRpc.mockClear();
      mockRpc.mockResolvedValue({
        data: 6,
        error: null,
      });
    });

    it("POST oturumsuz kullanıcıya 401 döner (S9 - Şartname Madde 18)", async () => {
      mockAuthGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          action: "like",
        }),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(401);
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("POST eksik galleryId ile 400 döner", async () => {
      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(400);
    });

    it("POST geçersiz action parametresini Zod ile 400 olarak reddeder (S9)", async () => {
      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          action: "invalid-action",
        }),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(400);
    });

    it("POST like aksiyonu ile atomik toggle_gallery_like RPC çağırır ve yeni sayıyı döner (YN-1, YN-4)", async () => {
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
      expect(json.count).toBe(6);
      expect(json.begeniSayisi).toBe(6);
      expect(mockRpc).toHaveBeenCalledWith("toggle_gallery_like", {
        p_gallery_id: "test-gallery-id",
        p_action: "like",
      });
    });

    it("POST unlike aksiyonunu ve id alanını kabul ederek RPC'ye iletir", async () => {
      mockRpc.mockResolvedValueOnce({ data: 4, error: null });
      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "test-gallery-id",
          action: "unlike",
        }),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(4);
      expect(mockRpc).toHaveBeenCalledWith("toggle_gallery_like", {
        p_gallery_id: "test-gallery-id",
        p_action: "unlike",
      });
    });

    it("POST RPC hata döndürdüğünde 500 döner", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC failure" },
      });

      const req = new Request("http://localhost/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          action: "like",
        }),
      });

      const res = await GalleryLikePOST(req);
      expect(res.status).toBe(500);
    });
  });

  describe("Admin Media Upload API (/api/admin/upload - S7)", () => {
    it("whitelist dışındaki folder parametresini (path traversal dahil) 400 ile reddeder", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" })
      );
      formData.append("folder", "../../etc");

      const req = new Request("http://localhost/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const res = await AdminUploadPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("klasör");
    });

    it("dosya uzantısını istemci dosya adından değil doğrulanmış MIME_TO_EXT haritasından türetir", async () => {
      mockStorageUpload.mockResolvedValueOnce({ error: null });
      const validPngHeader = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      const formData = new FormData();
      formData.append(
        "file",
        new File([validPngHeader], "shell.php", { type: "image/png" })
      );
      formData.append("folder", "gallery");

      const req = new Request("http://localhost/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const res = await AdminUploadPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.fileName.endsWith(".png")).toBe(true);
      expect(json.fileName.includes(".php")).toBe(false);
    });

    it("üretim ortamında (NODE_ENV=production) Supabase Storage başarısız olduğunda yerel diske düşmez ve 500 döner", async () => {
      const envRecord = process.env as Record<string, string | undefined>;
      const origEnv = envRecord.NODE_ENV;
      envRecord.NODE_ENV = "production";
      mockStorageUpload.mockResolvedValueOnce({ error: { message: "Bucket error" } });

      try {
        const validWebpHeader = new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ]);
        const formData = new FormData();
        formData.append(
          "file",
          new File([validWebpHeader], "test.webp", { type: "image/webp" })
        );
        formData.append("folder", "services");

        const req = new Request("http://localhost/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const res = await AdminUploadPOST(req);
        expect(res.status).toBe(500);
      } finally {
        envRecord.NODE_ENV = origEnv;
      }
    });

    it("12 bayttan kısa dosyayı magic byte kontrolünde reddeder (D-9)", async () => {
      const shortBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const formData = new FormData();
      formData.append(
        "file",
        new File([shortBytes], "tiny.png", { type: "image/png" })
      );
      formData.append("folder", "gallery");

      const req = new Request("http://localhost/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const res = await AdminUploadPOST(req);
      expect(res.status).toBe(400);
    });

    it("magic byte imzası beyan edilen MIME türüyle uyuşmayan dosyayı 400 ile reddeder (G-10)", async () => {
      const fakePngBytes = new Uint8Array(16).fill(0x41); // 'AAAA...' — geçerli PNG imzası değil
      const formData = new FormData();
      formData.append(
        "file",
        new File([fakePngBytes], "spoofed.png", { type: "image/png" })
      );
      formData.append("folder", "gallery");

      const req = new Request("http://localhost/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const res = await AdminUploadPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Dosya içeriği");
    });

    it("createSignedUploadUrl isteğinde fileSize eksik veya 5MB üzerindeyse 400 döner (Bölüm 2.4)", async () => {
      const noSizeReq = new Request("http://localhost/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSignedUploadUrl",
          folder: "gallery",
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
        }),
      });
      const noSizeRes = await AdminUploadPOST(noSizeReq);
      expect(noSizeRes.status).toBe(400);

      const overSizeReq = new Request("http://localhost/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSignedUploadUrl",
          folder: "gallery",
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
          fileSize: 6 * 1024 * 1024,
        }),
      });
      const overSizeRes = await AdminUploadPOST(overSizeReq);
      expect(overSizeRes.status).toBe(400);
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

    it("POST oturumsuz kullanıcıya 401 döner (G-05 / Şartname Madde 18)", async () => {
      mockAuthGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const req = new Request("http://localhost/api/gallery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId: "test-gallery-id",
          musteriAdi: "Deniz Yılmaz",
          yorum: "Harika!",
        }),
      });

      const res = await GalleryCommentsPOST(req);
      expect(res.status).toBe(401);
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

    it("PATCH geçerli UUID ve aktif alanı ile yorumu onaylar (YN-3)", async () => {
      const req = new Request("http://localhost/api/admin/gallery/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          aktif: true,
        }),
      });
      const res = await AdminGalleryCommentsPATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it("PATCH geçersiz UUID veya eksik aktif alanı ile 400 döner (YN-3)", async () => {
      const req = new Request("http://localhost/api/admin/gallery/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "invalid-uuid",
        }),
      });
      const res = await AdminGalleryCommentsPATCH(req);
      expect(res.status).toBe(400);
    });

    it("PATCH gerçek withAdminAuth altında oturumsuz (401) ve Calisan (403) erişimini reddeder (YN-3)", async () => {
      const { withAdminAuth: realWithAdminAuth } = await vi.importActual<
        typeof import("../src/lib/auth/api-guard")
      >("../src/lib/auth/api-guard");

      const guardedPatch = realWithAdminAuth(AdminGalleryCommentsPATCH);

      mockAuthGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const unauthReq = new Request("http://localhost/api/admin/gallery/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          aktif: true,
        }),
      });
      const unauthRes = await guardedPatch(unauthReq);
      expect(unauthRes.status).toBe(401);

      mockAuthGetUser.mockResolvedValueOnce({
        data: { user: { id: "staff-1" } },
        error: null,
      });

      const forbiddenReq = new Request("http://localhost/api/admin/gallery/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          aktif: true,
        }),
      });
      const forbiddenRes = await guardedPatch(forbiddenReq);
      expect(forbiddenRes.status).toBe(403);
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

    it("POST 2 yıldızlı değerlendirmede de review gating yapmadan 'google' funnel döner (O-5)", async () => {
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
      expect(json.funnel).toBe("google");
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

    it("POST hız sınırını (rate limit) aşan isteklerde 429 döner (G-05)", async () => {
      for (let i = 0; i < 10; i += 1) {
        await PublicReviewPOST(
          new Request("http://localhost/api/reviews", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "203.0.113.55",
            },
            body: JSON.stringify({
              musteri_adi: "Selin Doğan",
              puan: 5,
              yorum: "Test",
            }),
          })
        );
      }

      const blockedRes = await PublicReviewPOST(
        new Request("http://localhost/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "203.0.113.55",
          },
          body: JSON.stringify({
            musteri_adi: "Selin Doğan",
            puan: 5,
            yorum: "Spam",
          }),
        })
      );

      expect(blockedRes.status).toBe(429);
    });
  });
});
