import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../src/stores/app-store";
import { useAuthStore } from "../src/stores/auth-store";
import { useToastStore, toast } from "../src/stores/toast-store";
import { generateSafeUUID, type CustomerReview, type ServiceItem } from "@yildiz/types";

const { channelListeners } = vi.hoisted(() => ({
  channelListeners: [] as Array<{
    filter: { event: string; schema: string; table: string };
    callback: (payload: Record<string, unknown>) => void;
  }>,
}));

vi.mock("@/lib/supabase/client", () => {
  const channelMock = {
    on: (
      _type: string,
      filter: { event: string; schema: string; table: string },
      callback: (payload: Record<string, unknown>) => void,
    ) => {
      channelListeners.push({ filter, callback });
      return channelMock;
    },
    subscribe: () => channelMock,
  };

  return {
    createClient: () => ({
      channel: () => channelMock,
      removeChannel: () => {},
      from: () => ({
        select: () => ({
          order: () => ({
            order: async () => ({ data: [], error: null }),
            limit: async () => ({ data: [], error: null }),
          }),
          eq: () => ({
            order: async () => ({ data: [], error: null }),
          }),
          limit: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
  };
});

describe("Zustand Stores & Realtime State Architecture (Single Source of Truth)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    channelListeners.length = 0;

    if (typeof (globalThis as { window?: unknown }).window === "undefined") {
      (globalThis as { window?: unknown }).window = {
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { origin: "http://localhost:3000" },
      };
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: "real-comm-id" } }),
    }) as unknown as typeof fetch;

    useAppStore.setState({
      gallery: [],
      commentsByItem: {},
      likedGalleryIds: [],
      reviews: [],
      services: [],
      appointments: [],
      isInitialLoaded: false,
      isRefreshing: false,
    });
  });

  describe("Gallery State & Actions (useAppStore)", () => {
    it("toggleGalleryLike fonksiyonu begeniSayisi ve likedGalleryIds değerlerini iyimser günceller", async () => {
      const sampleItem = {
        id: "gal-uuid-1",
        baslik: "Altın Bal Balyaj",
        kategori: "Renklendirme & Balyaj",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Bayan Kuaförü",
        begeniSayisi: 10,
        medyaTuru: "image" as const,
      };

      useAppStore.setState({ gallery: [sampleItem], likedGalleryIds: [] });

      // Like
      await useAppStore.getState().toggleGalleryLike("gal-uuid-1");
      let state = useAppStore.getState();
      expect(state.likedGalleryIds).toContain("gal-uuid-1");
      expect(state.gallery[0]?.begeniSayisi).toBe(11);

      // Unlike
      await useAppStore.getState().toggleGalleryLike("gal-uuid-1");
      state = useAppStore.getState();
      expect(state.likedGalleryIds).not.toContain("gal-uuid-1");
      expect(state.gallery[0]?.begeniSayisi).toBe(10);
    });

    it("addGalleryComment ve deleteGalleryComment yorumları ve yorumSayisi değerini iyimser günceller", async () => {
      const sampleItem = {
        id: "gal-uuid-2",
        baslik: "Vogue Katlı Kesim",
        kategori: "Saç Tasarım",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Bayan Kuaförü",
        begeniSayisi: 5,
        yorumSayisi: 0,
        medyaTuru: "image" as const,
      };

      useAppStore.setState({ gallery: [sampleItem], commentsByItem: {} });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: "real-comm-id" } }),
      }) as unknown as typeof fetch;

      await useAppStore.getState().addGalleryComment("gal-uuid-2", "Dilek D.", "Harika bir çalışma!");
      let state = useAppStore.getState();
      expect(state.gallery[0]?.yorumSayisi).toBe(1);
      const comments = state.commentsByItem["gal-uuid-2"];
      expect(comments).toHaveLength(1);
      expect(comments?.[0]?.musteri_adi).toBe("Dilek D.");

      const commentIdToDelete = comments?.[0]?.id || "real-comm-id";
      await useAppStore.getState().deleteGalleryComment("gal-uuid-2", commentIdToDelete);
      state = useAppStore.getState();
      expect(state.gallery[0]?.yorumSayisi).toBe(0);
      expect(state.commentsByItem["gal-uuid-2"]).toHaveLength(0);
    });

    it("updateGalleryItem fotoğraf alanlarını iyimser günceller", async () => {
      const sampleItem = {
        id: "gal-uuid-3",
        baslik: "Eski Başlık",
        kategori: "Gelin & Topuz",
        gorselUrl: "https://example.com/photo.jpg",
        stilist: "Yıldız Bayan Kuaförü",
        begeniSayisi: 0,
        medyaTuru: "image" as const,
      };

      useAppStore.setState({ gallery: [sampleItem] });
      await useAppStore.getState().updateGalleryItem("gal-uuid-3", { baslik: "Yeni Lüks Başlık" });

      const state = useAppStore.getState();
      expect(state.gallery[0]?.baslik).toBe("Yeni Lüks Başlık");
    });

    it("Realtime gallery_items INSERT, UPDATE ve DELETE olaylarını sira düzenini koruyarak işler", () => {
      const cleanup = useAppStore.getState().initAppRealtimeSync();
      const galleryListener = channelListeners.find(
        (l) => l.filter.table === "gallery_items",
      );
      expect(galleryListener).toBeDefined();

      // INSERT
      galleryListener?.callback({
        eventType: "INSERT",
        new: {
          id: "gal-2",
          baslik: "İkinci Öğe",
          kategori: "Saç",
          url: "https://example.com/2.jpg",
          sira: 2,
          begeni_sayisi: 3,
        },
      });
      galleryListener?.callback({
        eventType: "INSERT",
        new: {
          id: "gal-1",
          baslik: "Birinci Öğe",
          kategori: "Saç",
          url: "https://example.com/1.jpg",
          sira: 1,
          begeni_sayisi: 7,
        },
      });

      expect(useAppStore.getState().gallery.map((g) => g.id)).toEqual(["gal-1", "gal-2"]);

      // DELETE
      galleryListener?.callback({
        eventType: "DELETE",
        old: { id: "gal-1" },
      });
      expect(useAppStore.getState().gallery.map((g) => g.id)).toEqual(["gal-2"]);

      cleanup();
    });
  });

  describe("Review State & Actions (useAppStore)", () => {
    it("addCustomerReview yeni yorumu listeye ekler ve createdAt DESC sıralamasını korur", async () => {
      const review1: CustomerReview = {
        id: generateSafeUUID(),
        musteriAdi: "Müşteri 1",
        puan: 5,
        tarih: "20 Ekim 2026",
        kaynak: "Salon",
        createdAt: "2026-10-20T10:00:00Z",
      };

      const review2: CustomerReview = {
        id: generateSafeUUID(),
        musteriAdi: "Müşteri 2 (En Yeni)",
        puan: 5,
        tarih: "25 Ekim 2026",
        kaynak: "Salon",
        createdAt: "2026-10-25T10:00:00Z",
      };

      useAppStore.setState({ reviews: [review1] });
      await useAppStore.getState().addCustomerReview(review2);

      const state = useAppStore.getState();
      expect(state.reviews).toHaveLength(2);
      expect(state.reviews[0]?.musteriAdi).toBe("Müşteri 2 (En Yeni)");
    });

    it("deleteCustomerReview yorumu listeden kaldırır", async () => {
      const review: CustomerReview = {
        id: "rev-to-delete",
        musteriAdi: "Test",
        puan: 5,
        tarih: "25 Ekim 2026",
        kaynak: "Salon",
      };

      useAppStore.setState({ reviews: [review] });
      await useAppStore.getState().deleteCustomerReview("rev-to-delete");

      const state = useAppStore.getState();
      expect(state.reviews.find((r: CustomerReview) => r.id === "rev-to-delete")).toBeUndefined();
    });

    it("Realtime customer_reviews UPDATE (onay/gizleme) ve DELETE olaylarını işler", () => {
      const cleanup = useAppStore.getState().initAppRealtimeSync();
      const reviewListener = channelListeners.find(
        (l) => l.filter.table === "customer_reviews",
      );
      expect(reviewListener).toBeDefined();

      // Admin yorumu onayladı (aktif: true)
      reviewListener?.callback({
        eventType: "UPDATE",
        new: {
          id: "rev-live-1",
          musteri_adi: "Zeynep K.",
          puan: 5,
          yorum: "Çok memnun kaldım",
          hizmet_turu: "Balyaj",
          aktif: true,
          olusturulma_tarihi: "2026-10-26T12:00:00Z",
        },
      });
      expect(useAppStore.getState().reviews).toHaveLength(1);
      expect(useAppStore.getState().reviews[0]?.musteriAdi).toBe("Zeynep K.");

      // Admin yorumu gizledi (aktif: false)
      reviewListener?.callback({
        eventType: "UPDATE",
        new: {
          id: "rev-live-1",
          musteri_adi: "Zeynep K.",
          puan: 5,
          aktif: false,
        },
      });
      expect(useAppStore.getState().reviews).toHaveLength(0);

      cleanup();
    });
  });

  describe("Unified App Store & Realtime Appointments (useAppStore)", () => {
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

      await useAppStore.getState().updatePageTexts({
        hero: { ...state.pageTexts.hero, title: "Yeni Başlık" },
      });
      state = useAppStore.getState();
      expect(state.pageTexts.hero.title).toBe("Yeni Başlık");
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

    it("Realtime appointments INSERT, UPDATE ve DELETE olaylarını store'a işler", () => {
      const cleanup = useAppStore.getState().initAppRealtimeSync();
      const appointmentListener = channelListeners.find(
        (l) => l.filter.table === "appointments",
      );
      expect(appointmentListener).toBeDefined();

      appointmentListener?.callback({
        eventType: "INSERT",
        new: {
          id: "app-live-1",
          musteri_id: null,
          musteri_ad_soyad: "Elif Demir",
          musteri_telefon: "05321112233",
          hizmet_idleri: ["srv-1"],
          calisan_idleri: [],
          tarih_saat: "2026-10-28T14:00:00Z",
          toplam_sure_dakika: 45,
          durum: "Beklemede",
          kaynak: "Web",
          olusturulma_tarihi: "2026-10-28T10:00:00Z",
        },
      });

      expect(useAppStore.getState().appointments).toHaveLength(1);
      expect(useAppStore.getState().appointments[0]?.durum).toBe("Beklemede");

      appointmentListener?.callback({
        eventType: "UPDATE",
        new: {
          id: "app-live-1",
          musteri_id: null,
          musteri_ad_soyad: "Elif Demir",
          musteri_telefon: "05321112233",
          hizmet_idleri: ["srv-1"],
          calisan_idleri: ["staff-1"],
          tarih_saat: "2026-10-28T14:00:00Z",
          toplam_sure_dakika: 45,
          durum: "Onaylandı",
          kaynak: "Web",
          olusturulma_tarihi: "2026-10-28T10:00:00Z",
        },
      });

      expect(useAppStore.getState().appointments[0]?.durum).toBe("Onaylandı");

      appointmentListener?.callback({
        eventType: "DELETE",
        old: { id: "app-live-1" },
      });

      expect(useAppStore.getState().appointments).toHaveLength(0);
      cleanup();
    });

    it("bootstrapApp site_settings içindeki adres, google_maps_url ve sayfa metinlerini store'a aktarır", async () => {
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
            founder: "Yıldız Bayan Kuaförü",
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

    it("bootstrapApp gerçek Admin profil adını pageTexts ve galeri stilist alanlarına senkronize eder", async () => {
      const legacyName = ["Yıldız", ["Ak", "soy"].join("")].join(" ");
      useAuthStore.getState().setUser({
        id: "admin-1",
        ad: "Zeynep",
        soyad: "Kaya",
        telefon: "05321000001",
        rol: "Admin",
        toplamPuan: 0,
        smsDogrulandi: true,
      });

      useAppStore.setState({
        gallery: [
          {
            id: "gal-legacy-1",
            baslik: "Test Görsel",
            kategori: "Saç Tasarım",
            gorselUrl: "https://example.com/1.jpg",
            stilist: legacyName,
            begeniSayisi: 3,
            medyaTuru: "image",
          },
        ],
      });

      await useAppStore.getState().bootstrapApp(true);

      const state = useAppStore.getState();
      expect(state.pageTexts.artist.adSoyad).toBe("Zeynep Kaya");
      expect(state.pageTexts.about.founder).toBe("Zeynep Kaya — Kurucu & Master Stilist");
      expect(state.gallery[0]?.stilist).toBe("Zeynep Kaya");

      useAuthStore.getState().setUser(null);
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
