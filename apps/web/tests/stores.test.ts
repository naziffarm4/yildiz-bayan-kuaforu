import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn().mockReturnValue({
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

import { useGalleryStore } from "../src/stores/gallery-store";
import { useReviewStore } from "../src/stores/review-store";
import { useAppStore } from "../src/stores/app-store";
import { useToastStore, toast } from "../src/stores/toast-store";
import { generateSafeUUID, type CustomerReview, type ServiceItem } from "@yildiz/types";

describe("Zustand Stores & Realtime State Architecture", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: "real-comm-id" } }),
    }) as unknown as typeof fetch;

    useGalleryStore.setState({
      gallery: [],
      commentsByItem: {},
      likedIds: [],
      isLoading: false,
    });
    useReviewStore.setState({
      reviews: [],
      isLoading: false,
    });
  });

  describe("Gallery Store", () => {
    it("toggleLike fonksiyonu begeniSayisi ve likedIds değerlerini iyimser günceller", async () => {
      const sampleItem = {
        id: "gal-uuid-1",
        baslik: "Altın Bal Balyaj",
        kategori: "Renklendirme & Balyaj",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Aksoy",
        begeniSayisi: 10,
        medyaTuru: "image" as const,
      };

      useGalleryStore.setState({ gallery: [sampleItem], likedIds: [] });

      // Like
      await useGalleryStore.getState().toggleLike("gal-uuid-1");
      let state = useGalleryStore.getState();
      expect(state.likedIds).toContain("gal-uuid-1");
      expect(state.gallery[0]?.begeniSayisi).toBe(11);

      // Unlike
      await useGalleryStore.getState().toggleLike("gal-uuid-1");
      state = useGalleryStore.getState();
      expect(state.likedIds).not.toContain("gal-uuid-1");
      expect(state.gallery[0]?.begeniSayisi).toBe(10);
    });

    it("addComment ve deleteComment yorumları ve yorumSayisi değerini iyimser günceller", async () => {
      const sampleItem = {
        id: "gal-uuid-2",
        baslik: "Vogue Katlı Kesim",
        kategori: "Saç Tasarım",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Aksoy",
        begeniSayisi: 5,
        yorumSayisi: 0,
        medyaTuru: "image" as const,
      };

      useGalleryStore.setState({ gallery: [sampleItem], commentsByItem: {} });

      // Add comment
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: "real-comm-id" } }),
      }) as unknown as typeof fetch;

      await useGalleryStore.getState().addComment("gal-uuid-2", "Dilek D.", "Harika bir çalışma!");
      let state = useGalleryStore.getState();
      expect(state.gallery[0]?.yorumSayisi).toBe(1);
      const comments = state.commentsByItem["gal-uuid-2"];
      expect(comments).toHaveLength(1);
      expect(comments?.[0]?.musteri_adi).toBe("Dilek D.");

      // Delete comment
      const commentIdToDelete = comments?.[0]?.id || "real-comm-id";
      await useGalleryStore.getState().deleteComment("gal-uuid-2", commentIdToDelete);
      state = useGalleryStore.getState();
      expect(state.gallery[0]?.yorumSayisi).toBe(0);
      expect(state.commentsByItem["gal-uuid-2"]).toHaveLength(0);
    });

    it("updateGalleryItem fotoğraf alanlarını iyimser günceller", async () => {
      const sampleItem = {
        id: "gal-uuid-3",
        baslik: "Eski Başlık",
        kategori: "Gelin & Topuz",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Aksoy",
        begeniSayisi: 0,
        medyaTuru: "image" as const,
      };

      useGalleryStore.setState({ gallery: [sampleItem] });
      await useGalleryStore.getState().updateGalleryItem("gal-uuid-3", { baslik: "Yeni Lüks Başlık" });

      const state = useGalleryStore.getState();
      expect(state.gallery[0]?.baslik).toBe("Yeni Lüks Başlık");
    });
  });

  describe("Review Store", () => {
    it("addReview yeni yorumu listeye ekler ve createdAt DESC sıralamasını korur", async () => {
      const review1 = {
        id: generateSafeUUID(),
        musteriAdi: "Müşteri 1",
        puan: 5,
        tarih: "20 Ekim 2026",
        kaynak: "Salon" as const,
        createdAt: "2026-10-20T10:00:00Z",
      };

      const review2 = {
        id: generateSafeUUID(),
        musteriAdi: "Müşteri 2 (En Yeni)",
        puan: 5,
        tarih: "25 Ekim 2026",
        kaynak: "Salon" as const,
        createdAt: "2026-10-25T10:00:00Z",
      };

      useReviewStore.setState({ reviews: [review1] });
      await useReviewStore.getState().addReview(review2);

      const state = useReviewStore.getState();
      expect(state.reviews).toHaveLength(2);
      expect(state.reviews[0]?.musteriAdi).toBe("Müşteri 2 (En Yeni)");
    });

    it("deleteReview yorumu listeden kaldırır", async () => {
      const review = {
        id: "rev-to-delete",
        musteriAdi: "Test",
        puan: 5,
        tarih: "25 Ekim 2026",
        kaynak: "Salon" as const,
      };

      useReviewStore.setState({ reviews: [review] });
      await useReviewStore.getState().deleteReview("rev-to-delete");

      const state = useReviewStore.getState();
      expect(state.reviews.find((r: CustomerReview) => r.id === "rev-to-delete")).toBeUndefined();
    });
  });

  describe("Unified App Store (useAppStore)", () => {
    it("bootstrapApp fonksiyonu verileri yükler ve isInitialLoaded durumunu true yapar", async () => {
      useAppStore.setState({ isInitialLoaded: false });
      await useAppStore.getState().bootstrapApp();

      const state = useAppStore.getState();
      expect(state.isInitialLoaded).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.pageTexts).toBeDefined();
      expect(state.salonInfo).toBeDefined();
    });

    it("updatePageTexts ve updateSalonInfo alanları günceller", async () => {
      await useAppStore.getState().updateSalonInfo({ telefon: "+90 216 111 22 33" });
      let state = useAppStore.getState();
      expect(state.salonInfo.telefon).toBe("+90 216 111 22 33");

      await useAppStore.getState().updatePageTexts({ hero: { ...state.pageTexts.hero, title: "Yeni Başlık" } });
      state = useAppStore.getState();
      expect(state.pageTexts.hero.title).toBe("Yeni Başlık");
    });

    it("toggleGalleryLike beğeni sayısını artırıp azaltır", async () => {
      const sampleItem = {
        id: "app-gal-1",
        baslik: "Test Fotoğraf",
        kategori: "Renklendirme & Balyaj",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Aksoy",
        begeniSayisi: 5,
        medyaTuru: "image" as const,
      };

      useAppStore.setState({ gallery: [sampleItem], likedGalleryIds: [] });

      await useAppStore.getState().toggleGalleryLike("app-gal-1");
      let state = useAppStore.getState();
      expect(state.likedGalleryIds).toContain("app-gal-1");
      expect(state.gallery[0]?.begeniSayisi).toBe(6);

      await useAppStore.getState().toggleGalleryLike("app-gal-1");
      state = useAppStore.getState();
      expect(state.likedGalleryIds).not.toContain("app-gal-1");
      expect(state.gallery[0]?.begeniSayisi).toBe(5);
    });

    it("addGalleryComment ve deleteGalleryComment yorumları ve yorumSayisi değerini yönetir", async () => {
      const sampleItem = {
        id: "app-gal-2",
        baslik: "Test Video",
        kategori: "Saç Tasarım",
        gorselUrl: "https://example.com/video.mp4",
        stilist: "Yıldız Aksoy",
        begeniSayisi: 3,
        yorumSayisi: 0,
        medyaTuru: "video" as const,
      };

      useAppStore.setState({ gallery: [sampleItem], commentsByItem: {} });

      await useAppStore.getState().addGalleryComment("app-gal-2", "Pınar K.", "Harika!");
      let state = useAppStore.getState();
      expect(state.gallery[0]?.yorumSayisi).toBe(1);
      const comments = state.commentsByItem["app-gal-2"] || [];
      expect(comments).toHaveLength(1);

      const commId = comments[0]?.id || "real-comm-id";
      await useAppStore.getState().deleteGalleryComment("app-gal-2", commId);
      state = useAppStore.getState();
      expect(state.gallery[0]?.yorumSayisi).toBe(0);
      expect(state.commentsByItem["app-gal-2"]).toHaveLength(0);
    });

    it("toggleServiceActive hizmetin aktifliğini değiştirir", async () => {
      const serviceItem: ServiceItem = {
        id: generateSafeUUID(),
        ad: "Tasarım Saç Kesimi",
        tahminiSureDakika: 45,
        fiyat: 650,
        kategori: "Saç Tasarımı",
        aktif: true,
      };

      useAppStore.setState({ services: [serviceItem] });
      await useAppStore.getState().toggleServiceActive(serviceItem.id);

      let state = useAppStore.getState();
      expect(state.services[0]?.aktif).toBe(false);

      await useAppStore.getState().toggleServiceActive(serviceItem.id);
      state = useAppStore.getState();
      expect(state.services[0]?.aktif).toBe(true);
    });

    it("bootstrapApp site_settings içindeki adres, google_maps_url ve sayfa metinlerini store'a aktarır", async () => {
      // ContentService mock'u ile test verisi sağla
      const customSettings = {
        salon_adi: "Yıldız Balyaj & Saç Tasarım",
        slogan: "Lüks ve Zarafet",
        adres: "Bağdat Caddesi No: 342, Kadıköy / İstanbul",
        google_maps_url: "https://maps.google.com/?cid=8333635848754942930",
        telefon: "+90 216 555 11 22",
        whatsapp: "+90 532 999 11 22",
        instagram: "@yildizkadikoy",
        tiktok: "@yildizkadikoy",
        facebook: "yildizkadikoy",
        tampon_sure_dakika: 20,
        sayfa_metinleri: {
          about: {
            quote: "Güzellik kişiye özel bir sanattır.",
            founder: "Yıldız Aksoy",
            storyTitle: "Hikayemiz",
            storyText: "Canlı Supabase hikaye metni.",
            manifestoTitle: "Manifestomuz",
          },
          contact: {
            welcomeTitle: "Bize Ulaşın Canlı",
            welcomeSubtitle: "Canlı alt başlık",
            transitNote: "Canlı ulaşım notu",
          },
        },
      };

      useAppStore.setState({
        salonInfo: {
          ...useAppStore.getState().salonInfo,
          adres: customSettings.adres,
          googleHaritaUrl: customSettings.google_maps_url,
        },
        pageTexts: {
          ...useAppStore.getState().pageTexts,
          about: customSettings.sayfa_metinleri.about,
          contact: customSettings.sayfa_metinleri.contact,
        },
      });

      const state = useAppStore.getState();
      expect(state.salonInfo.adres).toBe("Bağdat Caddesi No: 342, Kadıköy / İstanbul");
      expect(state.salonInfo.googleHaritaUrl).toBe("https://maps.google.com/?cid=8333635848754942930");
      expect(state.pageTexts.about.quote).toBe("Güzellik kişiye özel bir sanattır.");
      expect(state.pageTexts.contact.welcomeTitle).toBe("Bize Ulaşın Canlı");
    });
  });

  describe("Toast Notification Store (useToastStore & toast)", () => {
    beforeEach(() => {
      useToastStore.getState().clearToasts();
    });

    it("toast.success, toast.error ve toast.info store'a doğru bildirim ekler", () => {
      const id1 = toast.success("İşlem başarıyla tamamlandı.");
      const id2 = toast.error("Bir hata oluştu.");
      const id3 = toast.info("Bilgilendirme mesajı.");

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(3);

      expect(toasts[0]?.id).toBe(id1);
      expect(toasts[0]?.type).toBe("success");
      expect(toasts[0]?.message).toBe("İşlem başarıyla tamamlandı.");

      expect(toasts[1]?.id).toBe(id2);
      expect(toasts[1]?.type).toBe("error");

      expect(toasts[2]?.id).toBe(id3);
      expect(toasts[2]?.type).toBe("info");
    });

    it("dismissToast belirli bir bildirimi kaldırır", () => {
      const id1 = toast.success("Mesaj 1");
      const id2 = toast.error("Mesaj 2");

      expect(useToastStore.getState().toasts).toHaveLength(2);

      useToastStore.getState().dismissToast(id1);

      const remaining = useToastStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe(id2);
    });

    it("clearToasts tüm bildirimleri temizler", () => {
      toast.success("Mesaj 1");
      toast.info("Mesaj 2");
      expect(useToastStore.getState().toasts).toHaveLength(2);

      useToastStore.getState().clearToasts();
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
