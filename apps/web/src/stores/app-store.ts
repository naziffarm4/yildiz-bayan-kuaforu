import { create, type SetState, type GetState } from "./zustand";
import type {
  GalleryItem,
  CustomerReview,
  ServiceItem,
  PageTexts,
  SalonInfo,
  BookingRules,
  SpecialDay,
  AppointmentItem,
  AppointmentStatus,
  AppointmentSource,
} from "@yildiz/types";
import {
  SALON_INFO,
  DEFAULT_PAGE_TEXTS,
  DEFAULT_BOOKING_RULES,
  DEFAULT_SPECIAL_DAYS,
} from "@/lib/site-defaults";
import { createClient } from "@/lib/supabase/client";
import { ContentService } from "@/services/content.service";
import { ServiceService } from "@/services/service.service";
import { useAuthStore } from "./auth-store";

export interface GalleryCommentRow {
  id: string;
  gallery_item_id?: string;
  musteri_adi: string;
  yorum: string;
  aktif?: boolean;
  olusturulma_tarihi: string;
}

export type AppSyncMessage =
  | { type: "PAGE_TEXTS_UPDATED"; pageTexts: PageTexts }
  | { type: "SALON_INFO_UPDATED"; salonInfo: SalonInfo }
  | { type: "GALLERY_LIKE_UPDATED"; galleryId: string; delta: number; begeniSayisi?: number }
  | { type: "GALLERY_COMMENT_ADDED"; galleryId: string; comment: GalleryCommentRow }
  | { type: "GALLERY_COMMENT_DELETED"; galleryId: string; commentId: string }
  | { type: "GALLERY_ITEM_UPDATED"; id: string; updates: Partial<GalleryItem> }
  | { type: "GALLERY_ITEM_ADDED"; item: GalleryItem }
  | { type: "GALLERY_ITEM_DELETED"; id: string }
  | { type: "REVIEW_ADDED"; review: CustomerReview }
  | { type: "REVIEW_UPDATED"; review: CustomerReview; aktif?: boolean }
  | { type: "REVIEW_DELETED"; id: string }
  | { type: "SERVICE_UPDATED"; serviceId: string; updates: Partial<ServiceItem> }
  | { type: "SERVICE_ADDED"; service: ServiceItem }
  | {
      type: "APPOINTMENT_CHANGED";
      eventType: "INSERT" | "UPDATE" | "DELETE";
      appointment?: AppointmentItem;
      id?: string;
    };

export interface AppState {
  isInitialLoaded: boolean;
  isRefreshing: boolean;
  pageTexts: PageTexts;
  salonInfo: SalonInfo;
  bookingRules: BookingRules;
  specialDays: SpecialDay[];
  gallery: GalleryItem[];
  commentsByItem: Record<string, GalleryCommentRow[]>;
  reviews: CustomerReview[];
  services: ServiceItem[];
  appointments: AppointmentItem[];
  likedGalleryIds: string[];

  // Bootstrap & Refresh
  bootstrapApp: (forceRefresh?: boolean) => Promise<void>;
  initAppRealtimeSync: () => () => void;

  // Actions
  updatePageTexts: (patch: Partial<PageTexts> | ((prev: PageTexts) => PageTexts)) => Promise<void>;
  updateSalonInfo: (patch: Partial<SalonInfo>) => Promise<void>;
  updateBookingRules: (patch: Partial<BookingRules>) => void;
  addSpecialDay: (day: Omit<SpecialDay, "id">) => void;
  deleteSpecialDay: (id: string) => void;

  // Gallery Actions
  fetchGalleryComments: (galleryId: string) => Promise<void>;
  toggleGalleryLike: (galleryId: string) => Promise<void>;
  addGalleryComment: (galleryId: string, author: string, commentText: string) => Promise<boolean>;
  deleteGalleryComment: (galleryId: string, commentId: string) => Promise<boolean>;
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  addGalleryItem: (item: GalleryItem) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;

  // Review Actions
  addCustomerReview: (review: CustomerReview) => Promise<void>;
  updateCustomerReview: (id: string, updates: Partial<CustomerReview> & { aktif?: boolean }) => Promise<void>;
  deleteCustomerReview: (id: string) => Promise<void>;

  // Service Actions
  toggleServiceActive: (serviceId: string) => Promise<void>;
  addService: (service: ServiceItem) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
}

const BROADCAST_CHANNEL_NAME = "yildiz-app-sync";
const LEGACY_ADMIN_NAME = ["Yıldız", ["Ak", "soy"].join("")].join(" ");
const DEFAULT_SALON_BRAND = "Yıldız Bayan Kuaförü";

async function fetchAdminFullName(
  client: ReturnType<typeof createClient>,
): Promise<string | null> {
  const authUser = useAuthStore.getState().user;
  if (authUser && authUser.rol === "Admin") {
    const fullName = `${authUser.ad} ${authUser.soyad}`.trim();
    if (fullName && fullName !== LEGACY_ADMIN_NAME) {
      return fullName;
    }
  }

  try {
    const query = client.from("profiles").select("ad, soyad").eq("rol", "Admin");
    const res =
      typeof (query as { limit?: unknown }).limit === "function"
        ? await query.limit(1).maybeSingle()
        : { data: null, error: null };
    if (!res.error && res.data) {
      const fullName = `${res.data.ad || ""} ${res.data.soyad || ""}`.trim();
      if (fullName && fullName !== LEGACY_ADMIN_NAME) {
        return fullName;
      }
    }
  } catch {
    // Fallback to default brand name
  }
  return null;
}

function normalizeStylistName(
  stilist: string | null | undefined,
  adminFullName: string | null,
): string {
  const fallback = adminFullName || DEFAULT_SALON_BRAND;
  const trimmed = (stilist || "").trim();
  if (!trimmed || trimmed === LEGACY_ADMIN_NAME) {
    return fallback;
  }
  return trimmed;
}

function normalizePageTextsWithAdmin(
  texts: PageTexts,
  adminFullName: string | null,
): PageTexts {
  const effectiveAdmin = adminFullName || DEFAULT_SALON_BRAND;
  const replaceLegacy = (val: string | undefined, fallback: string): string => {
    if (!val || !val.trim()) return fallback;
    return val.split(LEGACY_ADMIN_NAME).join(effectiveAdmin);
  };

  const currentArtistName = texts.artist?.adSoyad?.trim();
  const resolvedArtistName =
    !currentArtistName ||
    currentArtistName === LEGACY_ADMIN_NAME ||
    (adminFullName && currentArtistName === DEFAULT_SALON_BRAND)
      ? effectiveAdmin
      : replaceLegacy(currentArtistName, effectiveAdmin);

  const currentFounder = texts.about?.founder?.trim();
  const resolvedFounder =
    !currentFounder ||
    currentFounder.includes(LEGACY_ADMIN_NAME) ||
    (adminFullName &&
      (currentFounder === DEFAULT_SALON_BRAND ||
        currentFounder === `${DEFAULT_SALON_BRAND} — Kurucu & Master Stilist`))
      ? `${effectiveAdmin} — Kurucu & Master Stilist`
      : currentFounder;

  return {
    ...texts,
    heroMedia: {
      ...texts.heroMedia,
      altBaslik: replaceLegacy(
        texts.heroMedia?.altBaslik,
        DEFAULT_PAGE_TEXTS.heroMedia.altBaslik,
      ),
    },
    artist: {
      ...texts.artist,
      adSoyad: resolvedArtistName,
      alintiSoz: replaceLegacy(
        texts.artist?.alintiSoz,
        DEFAULT_PAGE_TEXTS.artist.alintiSoz,
      ),
      butonMetni: replaceLegacy(
        texts.artist?.butonMetni,
        DEFAULT_PAGE_TEXTS.artist.butonMetni,
      ),
    },
    about: {
      ...texts.about,
      founder: resolvedFounder,
    },
  };
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
}

function getStoredLikes(): string[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem("yildiz_gallery_likes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLikes(ids: string[]) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem("yildiz_gallery_likes", JSON.stringify(ids));
  } catch (err: unknown) {
    console.warn("Yerel beğeni verisi kaydedilemedi:", err);
  }
}

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `http://localhost:3000${path}`;
}

function sortGalleryByOrder(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

function sortTopReviews(items: CustomerReview[]): CustomerReview[] {
  return [...items]
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);
}

function mapReviewFromPayload(row: Record<string, unknown>): CustomerReview {
  const rowId = typeof row.id === "string" ? row.id : "";
  const createdAtStr =
    typeof row.olusturulma_tarihi === "string" ? row.olusturulma_tarihi : undefined;

  return {
    id: rowId,
    musteriAdi: typeof row.musteri_adi === "string" ? row.musteri_adi : "",
    puan: Number(row.puan) || 5,
    yorum: typeof row.yorum === "string" ? row.yorum : undefined,
    tarih: createdAtStr
      ? new Date(createdAtStr).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("tr-TR"),
    kaynak: row.google_review_url
      ? "Google"
      : row.kaynak === "Hizmet Sonrası"
      ? "Hizmet Sonrası"
      : "Salon",
    hizmetTuru: typeof row.hizmet_turu === "string" ? row.hizmet_turu : undefined,
    googleReviewUrl:
      typeof row.google_review_url === "string" ? row.google_review_url : undefined,
    createdAt: createdAtStr,
    randevuId: typeof row.randevu_id === "string" ? row.randevu_id : undefined,
  };
}

function mapAppointmentFromPayload(row: Record<string, unknown>): AppointmentItem | null {
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;

  return {
    id,
    musteriId: typeof row.musteri_id === "string" ? row.musteri_id : null,
    musteriAdSoyad: typeof row.musteri_ad_soyad === "string" ? row.musteri_ad_soyad : "",
    musteriTelefon: typeof row.musteri_telefon === "string" ? row.musteri_telefon : "",
    hizmetIdleri: Array.isArray(row.hizmet_idleri)
      ? row.hizmet_idleri.filter((v): v is string => typeof v === "string")
      : [],
    calisanIdleri: Array.isArray(row.calisan_idleri)
      ? row.calisan_idleri.filter((v): v is string => typeof v === "string")
      : [],
    tarihSaat:
      typeof row.tarih_saat === "string" ? row.tarih_saat : new Date().toISOString(),
    toplamSureDakika: Number(row.toplam_sure_dakika) || 30,
    durum:
      typeof row.durum === "string" ? (row.durum as AppointmentStatus) : "Beklemede",
    kaynak:
      typeof row.kaynak === "string" ? (row.kaynak as AppointmentSource) : "Web",
    not: typeof row.notlar === "string" ? row.notlar : undefined,
    onaylayanKullaniciId:
      typeof row.onaylayan_id === "string" ? row.onaylayan_id : undefined,
    olusturulmaTarihi:
      typeof row.olusturulma_tarihi === "string"
        ? row.olusturulma_tarihi
        : new Date().toISOString(),
  };
}

export const useAppStore = create<AppState>((set: SetState<AppState>, get: GetState<AppState>) => ({
  isInitialLoaded: false,
  isRefreshing: false,
  pageTexts: DEFAULT_PAGE_TEXTS,
  salonInfo: SALON_INFO,
  bookingRules: DEFAULT_BOOKING_RULES,
  specialDays: DEFAULT_SPECIAL_DAYS,
  gallery: [],
  commentsByItem: {},
  reviews: [],
  services: [],
  appointments: [],
  likedGalleryIds: getStoredLikes(),

  bootstrapApp: async (forceRefresh = false) => {
    const state = get();
    if (state.isInitialLoaded && !forceRefresh) {
      set({ isRefreshing: true });
    } else {
      set({ isRefreshing: true });
    }

    try {
      const client = createClient();
      const contentService = new ContentService(client);
      const serviceService = new ServiceService(client);

      const [settingsRow, galleryRows, reviewRows, activeServices, adminFullName] =
        await Promise.all([
          contentService.getSiteSettings().catch(() => null),
          contentService.getGalleryItems().catch(() => []),
          contentService.getActiveReviews().catch(() => []),
          serviceService.getActiveServices().catch(() => []),
          fetchAdminFullName(client),
        ]);

      const partialUpdates: Partial<AppState> = {
        isInitialLoaded: true,
        isRefreshing: false,
      };

      let mergedPageTexts: PageTexts = state.pageTexts;

      // 1. Ayarlar & CMS Metinleri
      if (settingsRow) {
        partialUpdates.salonInfo = {
          ...state.salonInfo,
          ad: settingsRow.salon_adi || state.salonInfo.ad,
          slogan: settingsRow.slogan || state.salonInfo.slogan,
          adres: settingsRow.adres || state.salonInfo.adres,
          googleHaritaUrl: settingsRow.google_maps_url || state.salonInfo.googleHaritaUrl,
          telefon: settingsRow.telefon || state.salonInfo.telefon,
          whatsapp: settingsRow.whatsapp || state.salonInfo.whatsapp,
          instagram: settingsRow.instagram || state.salonInfo.instagram,
          tiktok: settingsRow.tiktok || state.salonInfo.tiktok,
          facebook: settingsRow.facebook || state.salonInfo.facebook,
          calismaSaatleri:
            typeof settingsRow.calisma_saatleri === "object" && settingsRow.calisma_saatleri !== null
              ? (settingsRow.calisma_saatleri as unknown as SalonInfo["calismaSaatleri"])
              : state.salonInfo.calismaSaatleri,
          varsayilanTamponSureDakika:
            settingsRow.tampon_sure_dakika ?? state.salonInfo.varsayilanTamponSureDakika,
        };

        const rawSayfa = settingsRow.sayfa_metinleri as Partial<PageTexts> | undefined;
        if (rawSayfa && typeof rawSayfa === "object") {
          mergedPageTexts = {
            ...state.pageTexts,
            ...rawSayfa,
            hero: {
              ...state.pageTexts.hero,
              ...(rawSayfa.hero || {}),
              title: settingsRow.hero_baslik || rawSayfa.hero?.title || state.pageTexts.hero.title,
              description:
                settingsRow.hero_aciklama || rawSayfa.hero?.description || state.pageTexts.hero.description,
            },
            about: {
              ...state.pageTexts.about,
              ...(rawSayfa.about || {}),
              storyText:
                settingsRow.hakkimizda_hikaye ||
                rawSayfa.about?.storyText ||
                state.pageTexts.about.storyText,
            },
            contact: {
              ...state.pageTexts.contact,
              ...(rawSayfa.contact || {}),
            },
          };
        }
      }

      partialUpdates.pageTexts = normalizePageTextsWithAdmin(mergedPageTexts, adminFullName);

      // 2. Galeri
      if (galleryRows && galleryRows.length > 0) {
        partialUpdates.gallery = sortGalleryByOrder(
          galleryRows.map((item) => ({
            id: item.id,
            baslik: item.baslik,
            kategori: item.kategori,
            gorselUrl: item.url,
            stilist: normalizeStylistName(item.stilist, adminFullName),
            begeniSayisi: Number(item.begeni_sayisi ?? 0),
            yorumSayisi: Number(item.gallery_comments?.[0]?.count ?? 0),
            medyaTuru: (item.medya_turu as "image" | "video") || "image",
            kapakUrl: item.kapak_url ?? undefined,
            aciklama: item.aciklama ?? undefined,
            sira: item.sira ?? 0,
          })),
        );
      } else if (state.gallery.length > 0) {
        partialUpdates.gallery = state.gallery.map((item) => ({
          ...item,
          stilist: normalizeStylistName(item.stilist, adminFullName),
        }));
      }

      // 3. Müşteri Yorumları (en güncel 5)
      if (reviewRows && reviewRows.length > 0) {
        const mappedReviews: CustomerReview[] = reviewRows.map((rev) => ({
          id: rev.id,
          musteriAdi: rev.musteri_adi,
          puan: rev.puan,
          yorum: rev.yorum ?? undefined,
          tarih: rev.olusturulma_tarihi
            ? new Date(rev.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : new Date().toLocaleDateString("tr-TR"),
          kaynak: rev.google_review_url
            ? "Google"
            : rev.kaynak === "Hizmet Sonrası"
            ? "Hizmet Sonrası"
            : "Salon",
          hizmetTuru: rev.hizmet_turu,
          googleReviewUrl: rev.google_review_url ?? undefined,
          createdAt: rev.olusturulma_tarihi,
          randevuId: rev.randevu_id ?? undefined,
        }));

        partialUpdates.reviews = sortTopReviews(mappedReviews);
      }

      // 4. Hizmetler
      if (activeServices && activeServices.length > 0) {
        partialUpdates.services = activeServices.map((r) => ({
          id: r.id,
          ad: r.ad,
          kategori: r.kategori,
          tahminiSureDakika: r.tahmini_sure_dakika,
          fiyat: Number(r.fiyat),
          aktif: r.aktif,
          aciklama: r.aciklama ?? undefined,
          gorselUrl: r.gorsel_url ?? undefined,
          detay: r.detay ?? undefined,
          sira: r.sira ?? 0,
        }));
      }

      set(partialUpdates);
    } catch (err) {
      console.warn("Bootstrap Supabase bağlantı uyarısı (fallback devrede):", err);
      set({ isInitialLoaded: true, isRefreshing: false });
    }
  },

  updatePageTexts: async (patch) => {
    const current = get().pageTexts;
    const updated = typeof patch === "function" ? patch(current) : { ...current, ...patch };

    set({ pageTexts: updated });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "PAGE_TEXTS_UPDATED", pageTexts: updated } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageTexts: updated }),
      });
    } catch (err) {
      console.error("updatePageTexts API hatası:", err);
    }
  },

  updateSalonInfo: async (patch) => {
    const updated = { ...get().salonInfo, ...patch };
    set({ salonInfo: updated });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "SALON_INFO_UPDATED", salonInfo: updated } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonInfo: updated }),
      });
    } catch (err) {
      console.error("updateSalonInfo API hatası:", err);
    }
  },

  updateBookingRules: (patch) => {
    set((state) => ({ bookingRules: { ...state.bookingRules, ...patch } }));
  },

  addSpecialDay: (day) => {
    const newDay: SpecialDay = {
      id: `sd-${Date.now()}`,
      ...day,
    };
    set((state) => ({ specialDays: [...state.specialDays, newDay] }));
  },

  deleteSpecialDay: (id) => {
    set((state) => ({ specialDays: state.specialDays.filter((d) => d.id !== id) }));
  },

  fetchGalleryComments: async (galleryId) => {
    try {
      const res = await fetch(getApiUrl(`/api/gallery/comments?galleryId=${encodeURIComponent(galleryId)}`));
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          set((state) => ({
            commentsByItem: {
              ...state.commentsByItem,
              [galleryId]: json.data,
            },
          }));
        }
      }
    } catch (err) {
      console.error("fetchGalleryComments hatası:", err);
    }
  },

  toggleGalleryLike: async (galleryId) => {
    const { likedGalleryIds, gallery } = get();
    const isLiked = likedGalleryIds.includes(galleryId);
    const action = isLiked ? "unlike" : "like";
    const delta = isLiked ? -1 : 1;

    const newLikedIds = isLiked
      ? likedGalleryIds.filter((id) => id !== galleryId)
      : [...likedGalleryIds, galleryId];

    saveStoredLikes(newLikedIds);

    const currentItem = gallery.find((i) => i.id === galleryId);
    const newCount = currentItem ? Math.max(0, currentItem.begeniSayisi + delta) : 0;

    set({
      likedGalleryIds: newLikedIds,
      gallery: gallery.map((item) =>
        item.id === galleryId ? { ...item, begeniSayisi: newCount } : item,
      ),
    });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "GALLERY_LIKE_UPDATED",
        galleryId,
        delta,
        begeniSayisi: newCount,
      } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl("/api/gallery/like"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryId, action }),
      });
    } catch (err) {
      console.error("toggleGalleryLike hatası:", err);
    }
  },

  addGalleryComment: async (galleryId, author, commentText) => {
    const tempId = `temp-${Date.now()}`;
    const newComment: GalleryCommentRow = {
      id: tempId,
      gallery_item_id: galleryId,
      musteri_adi: author,
      yorum: commentText,
      olusturulma_tarihi: new Date().toISOString(),
    };

    set((state) => {
      const existing = state.commentsByItem[galleryId] || [];
      return {
        commentsByItem: {
          ...state.commentsByItem,
          [galleryId]: [...existing, newComment],
        },
        gallery: state.gallery.map((item) =>
          item.id === galleryId ? { ...item, yorumSayisi: (item.yorumSayisi ?? 0) + 1 } : item,
        ),
      };
    });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "GALLERY_COMMENT_ADDED",
        galleryId,
        comment: newComment,
      } as AppSyncMessage);
      channel.close();
    }

    try {
      const res = await fetch(getApiUrl("/api/gallery/comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryId, musteriAdi: author, yorum: commentText }),
      });

      if (!res.ok) throw new Error("Yorum eklenemedi");
      const json = await res.json();

      if (json.data?.id) {
        set((state) => {
          const list = state.commentsByItem[galleryId] || [];
          return {
            commentsByItem: {
              ...state.commentsByItem,
              [galleryId]: list.map((c) => (c.id === tempId ? { ...c, id: json.data.id } : c)),
            },
          };
        });
      }
      return true;
    } catch (err) {
      console.error("addGalleryComment hatası:", err);
      return false;
    }
  },

  deleteGalleryComment: async (galleryId, commentId) => {
    set((state) => {
      const list = state.commentsByItem[galleryId] || [];
      return {
        commentsByItem: {
          ...state.commentsByItem,
          [galleryId]: list.filter((c) => c.id !== commentId),
        },
        gallery: state.gallery.map((item) =>
          item.id === galleryId ? { ...item, yorumSayisi: Math.max(0, (item.yorumSayisi ?? 0) - 1) } : item,
        ),
      };
    });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "GALLERY_COMMENT_DELETED",
        galleryId,
        commentId,
      } as AppSyncMessage);
      channel.close();
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/gallery/comments?id=${encodeURIComponent(commentId)}`), {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("deleteGalleryComment hatası:", err);
      return false;
    }
  },

  updateGalleryItem: async (id, updates) => {
    set((state) => ({
      gallery: sortGalleryByOrder(
        state.gallery.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      ),
    }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "GALLERY_ITEM_UPDATED", id, updates } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl("/api/admin/gallery"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          url: updates.gorselUrl,
          baslik: updates.baslik,
          kategori: updates.kategori,
          sira: updates.sira,
          medya_turu: updates.medyaTuru,
          kapak_url: updates.kapakUrl,
          aciklama: updates.aciklama,
          stilist: updates.stilist,
        }),
      });
    } catch (err) {
      console.error("updateGalleryItem hatası:", err);
    }
  },

  addGalleryItem: async (item) => {
    set((state) => ({
      gallery: sortGalleryByOrder([item, ...state.gallery.filter((g) => g.id !== item.id)]),
    }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "GALLERY_ITEM_ADDED", item } as AppSyncMessage);
      channel.close();
    }
  },

  deleteGalleryItem: async (id) => {
    set((state) => ({ gallery: state.gallery.filter((i) => i.id !== id) }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "GALLERY_ITEM_DELETED", id } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl(`/api/admin/gallery?id=${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
    } catch (err) {
      console.error("deleteGalleryItem hatası:", err);
    }
  },

  addCustomerReview: async (review) => {
    set((state) => {
      const filtered = state.reviews.filter((r) => r.id !== review.id);
      return { reviews: sortTopReviews([review, ...filtered]) };
    });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "REVIEW_ADDED", review } as AppSyncMessage);
      channel.close();
    }
  },

  updateCustomerReview: async (id, updates) => {
    const isAktif = updates.aktif ?? true;

    set((state) => {
      if (!isAktif) {
        return { reviews: state.reviews.filter((r) => r.id !== id) };
      }

      const existing = state.reviews.find((r) => r.id === id);
      const merged: CustomerReview = existing
        ? { ...existing, ...updates }
        : {
            id,
            musteriAdi: updates.musteriAdi || "Misafir",
            puan: updates.puan ?? 5,
            yorum: updates.yorum,
            tarih: updates.tarih || new Date().toLocaleDateString("tr-TR"),
            kaynak: updates.kaynak || "Salon",
            hizmetTuru: updates.hizmetTuru,
            googleReviewUrl: updates.googleReviewUrl,
            createdAt: updates.createdAt || new Date().toISOString(),
            randevuId: updates.randevuId,
          };

      return {
        reviews: sortTopReviews([merged, ...state.reviews.filter((r) => r.id !== id)]),
      };
    });

    const updatedReview = get().reviews.find((r) => r.id === id);
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "REVIEW_UPDATED",
        review:
          updatedReview ?? {
            id,
            musteriAdi: updates.musteriAdi || "Misafir",
            puan: updates.puan ?? 5,
            tarih: updates.tarih || new Date().toLocaleDateString("tr-TR"),
            kaynak: updates.kaynak || "Salon",
          },
        aktif: isAktif,
      } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl("/api/admin/reviews"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (err) {
      console.error("updateCustomerReview hatası:", err);
    }
  },

  deleteCustomerReview: async (id) => {
    set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "REVIEW_DELETED", id } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl(`/api/admin/reviews?id=${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
    } catch (err) {
      console.error("deleteCustomerReview hatası:", err);
    }
  },

  toggleServiceActive: async (serviceId) => {
    const target = get().services.find((s) => s.id === serviceId);
    const newActive = target ? !target.aktif : false;

    set((state) => ({
      services: state.services.map((s) =>
        s.id === serviceId ? { ...s, aktif: newActive } : s,
      ),
    }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "SERVICE_UPDATED",
        serviceId,
        updates: { aktif: newActive },
      } as AppSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl("/api/admin/services"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serviceId, aktif: newActive }),
      });
    } catch (err) {
      console.error("toggleServiceActive hatası:", err);
    }
  },

  addService: async (service) => {
    set((state) => ({ services: [service, ...state.services] }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "SERVICE_ADDED", service } as AppSyncMessage);
      channel.close();
    }
  },

  deleteService: async (serviceId) => {
    set((state) => ({ services: state.services.filter((s) => s.id !== serviceId) }));
    try {
      await fetch(getApiUrl(`/api/admin/services?id=${encodeURIComponent(serviceId)}`), {
        method: "DELETE",
      });
    } catch (err) {
      console.error("deleteService hatası:", err);
    }
  },

  initAppRealtimeSync: () => {
    if (typeof window === "undefined") return () => {};

    // 1. BroadcastChannel (Aynı tarayıcıdaki tüm sekmeler: Web & Admin 0ms)
    const broadcastChannel = getBroadcastChannel();
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const msg = event.data as AppSyncMessage;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case "PAGE_TEXTS_UPDATED":
            set({ pageTexts: msg.pageTexts });
            break;
          case "SALON_INFO_UPDATED":
            set({ salonInfo: msg.salonInfo });
            break;
          case "GALLERY_LIKE_UPDATED":
            set((state) => ({
              gallery: state.gallery.map((i) =>
                i.id === msg.galleryId
                  ? {
                      ...i,
                      begeniSayisi:
                        typeof msg.begeniSayisi === "number"
                          ? msg.begeniSayisi
                          : Math.max(0, i.begeniSayisi + msg.delta),
                    }
                  : i,
              ),
            }));
            break;
          case "GALLERY_COMMENT_ADDED":
            set((state) => {
              const list = state.commentsByItem[msg.galleryId] || [];
              const exists = list.some((c) => c.id === msg.comment.id);
              return {
                commentsByItem: {
                  ...state.commentsByItem,
                  [msg.galleryId]: exists ? list : [...list, msg.comment],
                },
                gallery: state.gallery.map((i) =>
                  i.id === msg.galleryId ? { ...i, yorumSayisi: (i.yorumSayisi ?? 0) + 1 } : i,
                ),
              };
            });
            break;
          case "GALLERY_COMMENT_DELETED":
            set((state) => {
              const list = state.commentsByItem[msg.galleryId] || [];
              return {
                commentsByItem: {
                  ...state.commentsByItem,
                  [msg.galleryId]: list.filter((c) => c.id !== msg.commentId),
                },
                gallery: state.gallery.map((i) =>
                  i.id === msg.galleryId
                    ? { ...i, yorumSayisi: Math.max(0, (i.yorumSayisi ?? 0) - 1) }
                    : i,
                ),
              };
            });
            break;
          case "GALLERY_ITEM_UPDATED":
            set((state) => ({
              gallery: sortGalleryByOrder(
                state.gallery.map((i) => (i.id === msg.id ? { ...i, ...msg.updates } : i)),
              ),
            }));
            break;
          case "GALLERY_ITEM_ADDED":
            set((state) => ({
              gallery: sortGalleryByOrder([
                msg.item,
                ...state.gallery.filter((g) => g.id !== msg.item.id),
              ]),
            }));
            break;
          case "GALLERY_ITEM_DELETED":
            set((state) => ({ gallery: state.gallery.filter((i) => i.id !== msg.id) }));
            break;
          case "REVIEW_ADDED":
            set((state) => ({
              reviews: sortTopReviews([
                msg.review,
                ...state.reviews.filter((r) => r.id !== msg.review.id),
              ]),
            }));
            break;
          case "REVIEW_UPDATED":
            set((state) => {
              if (msg.aktif === false) {
                return { reviews: state.reviews.filter((r) => r.id !== msg.review.id) };
              }
              return {
                reviews: sortTopReviews([
                  msg.review,
                  ...state.reviews.filter((r) => r.id !== msg.review.id),
                ]),
              };
            });
            break;
          case "REVIEW_DELETED":
            set((state) => ({ reviews: state.reviews.filter((r) => r.id !== msg.id) }));
            break;
          case "SERVICE_UPDATED":
            set((state) => ({
              services: state.services.map((s) =>
                s.id === msg.serviceId ? { ...s, ...msg.updates } : s,
              ),
            }));
            break;
          case "SERVICE_ADDED":
            set((state) => ({
              services: [msg.service, ...state.services.filter((s) => s.id !== msg.service.id)],
            }));
            break;
          case "APPOINTMENT_CHANGED":
            if (msg.eventType === "DELETE" && msg.id) {
              set((state) => ({
                appointments: state.appointments.filter((a) => a.id !== msg.id),
              }));
            } else if (msg.appointment) {
              const incoming = msg.appointment;
              set((state) => {
                const exists = state.appointments.some((a) => a.id === incoming.id);
                return {
                  appointments: exists
                    ? state.appointments.map((a) => (a.id === incoming.id ? incoming : a))
                    : [incoming, ...state.appointments],
                };
              });
            }
            window.dispatchEvent(new CustomEvent("yildiz:appointments-changed", { detail: msg }));
            break;
        }
      };
    }

    // 2. Supabase Realtime WebSocket kanalı
    let supabaseClient: ReturnType<typeof createClient> | null = null;
    let realtimeChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    try {
      supabaseClient = createClient();
      realtimeChannel = supabaseClient
        .channel("yildiz-unified-app-realtime")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "site_settings" },
          (payload: { new?: Record<string, unknown> }) => {
            const updated = payload.new;
            if (!updated?.id) return;

            set((state) => {
              const nextSalonInfo: SalonInfo = {
                ...state.salonInfo,
                ad: typeof updated.salon_adi === "string" && updated.salon_adi ? updated.salon_adi : state.salonInfo.ad,
                slogan: typeof updated.slogan === "string" && updated.slogan ? updated.slogan : state.salonInfo.slogan,
                adres: typeof updated.adres === "string" && updated.adres ? updated.adres : state.salonInfo.adres,
                googleHaritaUrl:
                  typeof updated.google_maps_url === "string" && updated.google_maps_url
                    ? updated.google_maps_url
                    : state.salonInfo.googleHaritaUrl,
                telefon: typeof updated.telefon === "string" && updated.telefon ? updated.telefon : state.salonInfo.telefon,
                whatsapp: typeof updated.whatsapp === "string" && updated.whatsapp ? updated.whatsapp : state.salonInfo.whatsapp,
                instagram: typeof updated.instagram === "string" && updated.instagram ? updated.instagram : state.salonInfo.instagram,
                tiktok: typeof updated.tiktok === "string" && updated.tiktok ? updated.tiktok : state.salonInfo.tiktok,
                facebook: typeof updated.facebook === "string" && updated.facebook ? updated.facebook : state.salonInfo.facebook,
                calismaSaatleri:
                  typeof updated.calisma_saatleri === "object" && updated.calisma_saatleri !== null
                    ? (updated.calisma_saatleri as unknown as SalonInfo["calismaSaatleri"])
                    : state.salonInfo.calismaSaatleri,
                varsayilanTamponSureDakika:
                  typeof updated.tampon_sure_dakika === "number"
                    ? updated.tampon_sure_dakika
                    : state.salonInfo.varsayilanTamponSureDakika,
              };

              let nextPageTexts: PageTexts = state.pageTexts;
              const rawSayfa = updated.sayfa_metinleri as Partial<PageTexts> | undefined;
              if (rawSayfa && typeof rawSayfa === "object") {
                nextPageTexts = {
                  ...state.pageTexts,
                  ...rawSayfa,
                  hero: {
                    ...state.pageTexts.hero,
                    ...(rawSayfa.hero || {}),
                    title:
                      (typeof updated.hero_baslik === "string" && updated.hero_baslik) ||
                      rawSayfa.hero?.title ||
                      state.pageTexts.hero.title,
                    description:
                      (typeof updated.hero_aciklama === "string" && updated.hero_aciklama) ||
                      rawSayfa.hero?.description ||
                      state.pageTexts.hero.description,
                  },
                  about: {
                    ...state.pageTexts.about,
                    ...(rawSayfa.about || {}),
                    storyText:
                      (typeof updated.hakkimizda_hikaye === "string" && updated.hakkimizda_hikaye) ||
                      rawSayfa.about?.storyText ||
                      state.pageTexts.about.storyText,
                  },
                  contact: {
                    ...state.pageTexts.contact,
                    ...(rawSayfa.contact || {}),
                  },
                };
              }

              return {
                salonInfo: nextSalonInfo,
                pageTexts: nextPageTexts,
              };
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "services" },
          (payload: {
            eventType?: string;
            new?: Record<string, unknown>;
            old?: Record<string, unknown>;
          }) => {
            if (payload.eventType === "DELETE") {
              const deletedId = typeof payload.old?.id === "string" ? payload.old.id : "";
              if (!deletedId) return;
              set((state) => ({
                services: state.services.filter((s) => s.id !== deletedId),
              }));
              return;
            }

            const row = payload.new ?? {};
            const rowId = typeof row.id === "string" ? row.id : "";
            if (!rowId) return;

            if (payload.eventType === "INSERT") {
              if (row.aktif === false) return;
              const newService: ServiceItem = {
                id: rowId,
                ad: typeof row.ad === "string" ? row.ad : "",
                kategori: typeof row.kategori === "string" ? row.kategori : "",
                tahminiSureDakika: Number(row.tahmini_sure_dakika) || 30,
                fiyat: Number(row.fiyat) || 0,
                aktif: row.aktif !== undefined ? Boolean(row.aktif) : true,
                aciklama: typeof row.aciklama === "string" ? row.aciklama : undefined,
                gorselUrl: typeof row.gorsel_url === "string" ? row.gorsel_url : undefined,
                detay: typeof row.detay === "string" ? row.detay : undefined,
                sira: typeof row.sira === "number" ? row.sira : 0,
              };
              set((state) => ({
                services: [newService, ...state.services.filter((s) => s.id !== rowId)],
              }));
              return;
            }

            // UPDATE
            set((state) => ({
              services: state.services.map((s) =>
                s.id === rowId
                  ? {
                      ...s,
                      ad: typeof row.ad === "string" ? row.ad : s.ad,
                      kategori: typeof row.kategori === "string" ? row.kategori : s.kategori,
                      tahminiSureDakika: Number(row.tahmini_sure_dakika ?? s.tahminiSureDakika),
                      fiyat: Number(row.fiyat ?? s.fiyat),
                      aktif: Boolean(row.aktif ?? s.aktif),
                      aciklama: typeof row.aciklama === "string" ? row.aciklama : s.aciklama,
                      gorselUrl: typeof row.gorsel_url === "string" ? row.gorsel_url : s.gorselUrl,
                      sira: Number(row.sira ?? s.sira),
                    }
                  : s,
              ),
            }));
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "gallery_items" },
          (payload: {
            eventType?: string;
            new?: Record<string, unknown>;
            old?: Record<string, unknown>;
          }) => {
            if (payload.eventType === "DELETE") {
              const deletedId = typeof payload.old?.id === "string" ? payload.old.id : "";
              if (!deletedId) return;
              set((state) => ({
                gallery: state.gallery.filter((item) => item.id !== deletedId),
              }));
              return;
            }

            const row = payload.new;
            const rowId = typeof row?.id === "string" ? row.id : "";
            if (!row || !rowId) return;

            if (payload.eventType === "INSERT") {
              const newItem: GalleryItem = {
                id: rowId,
                baslik: typeof row.baslik === "string" ? row.baslik : "",
                kategori: typeof row.kategori === "string" ? row.kategori : "",
                gorselUrl: typeof row.url === "string" ? row.url : "",
                stilist: typeof row.stilist === "string" ? row.stilist : "Yıldız Salon Ekibi",
                begeniSayisi: Number(row.begeni_sayisi ?? 0),
                yorumSayisi: 0,
                medyaTuru: (row.medya_turu as "image" | "video") || "image",
                kapakUrl: typeof row.kapak_url === "string" ? row.kapak_url : undefined,
                aciklama: typeof row.aciklama === "string" ? row.aciklama : undefined,
                sira: typeof row.sira === "number" ? row.sira : 0,
              };

              set((state) => ({
                gallery: sortGalleryByOrder([
                  newItem,
                  ...state.gallery.filter((item) => item.id !== rowId),
                ]),
              }));
              return;
            }

            // UPDATE
            set((state) => ({
              gallery: sortGalleryByOrder(
                state.gallery.map((item) =>
                  item.id === rowId
                    ? {
                        ...item,
                        baslik: typeof row.baslik === "string" ? row.baslik : item.baslik,
                        kategori: typeof row.kategori === "string" ? row.kategori : item.kategori,
                        gorselUrl: typeof row.url === "string" ? row.url : item.gorselUrl,
                        stilist: typeof row.stilist === "string" ? row.stilist : item.stilist,
                        begeniSayisi: Number(row.begeni_sayisi ?? item.begeniSayisi),
                        medyaTuru: (row.medya_turu as "image" | "video") || item.medyaTuru,
                        kapakUrl: typeof row.kapak_url === "string" ? row.kapak_url : item.kapakUrl,
                        aciklama: typeof row.aciklama === "string" ? row.aciklama : item.aciklama,
                        sira: typeof row.sira === "number" ? row.sira : item.sira,
                      }
                    : item,
                ),
              ),
            }));
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "gallery_comments" },
          (payload: { new?: Record<string, unknown> }) => {
            const newComment = payload.new;
            const galleryItemId =
              typeof newComment?.gallery_item_id === "string" ? newComment.gallery_item_id : "";
            const commentId = typeof newComment?.id === "string" ? newComment.id : "";
            if (!galleryItemId || !commentId) return;

            const commentRow: GalleryCommentRow = {
              id: commentId,
              gallery_item_id: galleryItemId,
              musteri_adi: typeof newComment?.musteri_adi === "string" ? newComment.musteri_adi : "",
              yorum: typeof newComment?.yorum === "string" ? newComment.yorum : "",
              aktif: typeof newComment?.aktif === "boolean" ? newComment.aktif : undefined,
              olusturulma_tarihi:
                typeof newComment?.olusturulma_tarihi === "string"
                  ? newComment.olusturulma_tarihi
                  : new Date().toISOString(),
            };

            set((state) => {
              const list = state.commentsByItem[galleryItemId] || [];
              const exists = list.some((c) => c.id === commentId);
              return {
                commentsByItem: {
                  ...state.commentsByItem,
                  [galleryItemId]: exists ? list : [...list, commentRow],
                },
                gallery: state.gallery.map((item) =>
                  item.id === galleryItemId
                    ? { ...item, yorumSayisi: (item.yorumSayisi ?? 0) + 1 }
                    : item,
                ),
              };
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "gallery_comments" },
          (payload: { old?: Record<string, unknown> }) => {
            const oldId = typeof payload.old?.id === "string" ? payload.old.id : undefined;
            const targetItemId =
              typeof payload.old?.gallery_item_id === "string"
                ? payload.old.gallery_item_id
                : undefined;

            set((state) => {
              const updatedComments: Record<string, GalleryCommentRow[]> = {};
              for (const [gid, list] of Object.entries(state.commentsByItem)) {
                updatedComments[gid] = (list as GalleryCommentRow[]).filter((c) => c.id !== oldId);
              }

              return {
                commentsByItem: updatedComments,
                gallery: state.gallery.map((item) =>
                  targetItemId && item.id === targetItemId
                    ? { ...item, yorumSayisi: Math.max(0, (item.yorumSayisi ?? 0) - 1) }
                    : item,
                ),
              };
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "customer_reviews" },
          (payload: {
            eventType?: string;
            new?: Record<string, unknown>;
            old?: Record<string, unknown>;
          }) => {
            if (payload.eventType === "DELETE") {
              const deletedId = typeof payload.old?.id === "string" ? payload.old.id : "";
              if (!deletedId) return;
              set((state) => ({
                reviews: state.reviews.filter((r) => r.id !== deletedId),
              }));
              return;
            }

            const row = payload.new;
            const rowId = typeof row?.id === "string" ? row.id : "";
            if (!row || !rowId) return;

            if (!row.aktif) {
              set((state) => ({
                reviews: state.reviews.filter((r) => r.id !== rowId),
              }));
              return;
            }

            const reviewItem = mapReviewFromPayload(row);
            set((state) => ({
              reviews: sortTopReviews([
                reviewItem,
                ...state.reviews.filter((r) => r.id !== rowId),
              ]),
            }));
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments" },
          (payload: {
            eventType?: string;
            new?: Record<string, unknown>;
            old?: Record<string, unknown>;
          }) => {
            if (payload.eventType === "DELETE") {
              const deletedId = typeof payload.old?.id === "string" ? payload.old.id : "";
              if (deletedId) {
                set((state) => ({
                  appointments: state.appointments.filter((a) => a.id !== deletedId),
                }));
              }
            } else if (payload.new) {
              const mapped = mapAppointmentFromPayload(payload.new);
              if (mapped) {
                set((state) => {
                  const exists = state.appointments.some((a) => a.id === mapped.id);
                  return {
                    appointments: exists
                      ? state.appointments.map((a) => (a.id === mapped.id ? mapped : a))
                      : [mapped, ...state.appointments],
                  };
                });
              }
            }

            if (useAuthStore.getState().user !== null) {
              void useAuthStore.getState().fetchUserAppointments();
            }
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("yildiz:appointments-changed", { detail: payload }),
              );
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime başlatma uyarısı:", err);
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (supabaseClient && realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
      }
    };
  },
}));
