import { create, type SetState, type GetState } from "./zustand";
import type {
  GalleryItem,
  CustomerReview,
  ServiceItem,
  PageTexts,
  SalonInfo,
  BookingRules,
  SpecialDay,
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
  | { type: "REVIEW_DELETED"; id: string }
  | { type: "SERVICE_UPDATED"; serviceId: string; updates: Partial<ServiceItem> }
  | { type: "SERVICE_ADDED"; service: ServiceItem };

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
  deleteCustomerReview: (id: string) => Promise<void>;

  // Service Actions
  toggleServiceActive: (serviceId: string) => Promise<void>;
  addService: (service: ServiceItem) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
}

const BROADCAST_CHANNEL_NAME = "yildiz-app-sync";

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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("yildiz_gallery_likes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLikes(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("yildiz_gallery_likes", JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `http://localhost:3000${path}`;
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
  likedGalleryIds: getStoredLikes(),

  bootstrapApp: async (forceRefresh = false) => {
    const state = get();
    if (state.isInitialLoaded && !forceRefresh) {
      // Zaten yüklü, arka planda hafif tazeleme
      set({ isRefreshing: true });
    } else {
      set({ isRefreshing: true });
    }

    try {
      const client = createClient();
      const contentService = new ContentService(client);
      const serviceService = new ServiceService(client);

      const [settingsRow, galleryRows, reviewRows, activeServices] = await Promise.all([
        contentService.getSiteSettings().catch(() => null),
        contentService.getGalleryItems().catch(() => []),
        contentService.getActiveReviews().catch(() => []),
        serviceService.getActiveServices().catch(() => []),
      ]);

      const partialUpdates: Partial<AppState> = {
        isInitialLoaded: true,
        isRefreshing: false,
      };

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
          partialUpdates.pageTexts = {
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

      // 2. Galeri
      if (galleryRows && galleryRows.length > 0) {
        partialUpdates.gallery = galleryRows.map((item) => ({
          id: item.id,
          baslik: item.baslik,
          kategori: item.kategori,
          gorselUrl: item.url,
          stilist: item.stilist || "Yıldız Salon Ekibi",
          begeniSayisi: Number(item.begeni_sayisi ?? 0),
          yorumSayisi: Number(item.gallery_comments?.[0]?.count ?? 0),
          medyaTuru: (item.medya_turu as "image" | "video") || "image",
          kapakUrl: item.kapak_url ?? undefined,
          aciklama: item.aciklama ?? undefined,
          sira: item.sira ?? 0,
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

        partialUpdates.reviews = mappedReviews
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 5);
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
      gallery: state.gallery.map((item) => (item.id === id ? { ...item, ...updates } : item)),
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
    set((state) => ({ gallery: [item, ...state.gallery] }));

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
      const updated = [review, ...filtered]
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 5);
      return { reviews: updated };
    });

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: "REVIEW_ADDED", review } as AppSyncMessage);
      channel.close();
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
              gallery: state.gallery.map((i) => (i.id === msg.id ? { ...i, ...msg.updates } : i)),
            }));
            break;
          case "GALLERY_ITEM_ADDED":
            set((state) => ({ gallery: [msg.item, ...state.gallery.filter((g) => g.id !== msg.item.id)] }));
            break;
          case "GALLERY_ITEM_DELETED":
            set((state) => ({ gallery: state.gallery.filter((i) => i.id !== msg.id) }));
            break;
          case "REVIEW_ADDED":
            set((state) => {
              const updated = [msg.review, ...state.reviews.filter((r) => r.id !== msg.review.id)];
              return {
                reviews: updated
                  .sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                  })
                  .slice(0, 5),
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const updated = payload.new;
            if (!updated?.id) return;
            get().bootstrapApp(true);
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "services" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload.eventType === "UPDATE") {
              const row = payload.new;
              set((state) => ({
                services: state.services.map((s) =>
                  s.id === row.id
                    ? {
                        ...s,
                        ad: row.ad ?? s.ad,
                        kategori: row.kategori ?? s.kategori,
                        tahminiSureDakika: Number(row.tahmini_sure_dakika ?? s.tahminiSureDakika),
                        fiyat: Number(row.fiyat ?? s.fiyat),
                        aktif: Boolean(row.aktif ?? s.aktif),
                        aciklama: row.aciklama ?? s.aciklama,
                        gorselUrl: row.gorsel_url ?? s.gorselUrl,
                        sira: Number(row.sira ?? s.sira),
                      }
                    : s,
                ),
              }));
            } else {
              get().bootstrapApp(true);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "gallery_items" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const updated = payload.new;
            if (!updated?.id) return;
            set((state) => ({
              gallery: state.gallery.map((item) =>
                item.id === updated.id
                  ? {
                      ...item,
                      baslik: updated.baslik ?? item.baslik,
                      kategori: updated.kategori ?? item.kategori,
                      gorselUrl: updated.url ?? item.gorselUrl,
                      stilist: updated.stilist ?? item.stilist,
                      begeniSayisi: Number(updated.begeni_sayisi ?? item.begeniSayisi),
                      medyaTuru: (updated.medya_turu as "image" | "video") || item.medyaTuru,
                      kapakUrl: updated.kapak_url ?? item.kapakUrl,
                      aciklama: updated.aciklama ?? item.aciklama,
                      sira: updated.sira ?? item.sira,
                    }
                  : item,
              ),
            }));
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "gallery_comments" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const newComment = payload.new;
            if (!newComment?.gallery_item_id) return;

            const commentRow: GalleryCommentRow = {
              id: newComment.id,
              gallery_item_id: newComment.gallery_item_id,
              musteri_adi: newComment.musteri_adi,
              yorum: newComment.yorum,
              aktif: newComment.aktif,
              olusturulma_tarihi: newComment.olusturulma_tarihi,
            };

            set((state) => {
              const list = state.commentsByItem[newComment.gallery_item_id] || [];
              const exists = list.some((c) => c.id === newComment.id);
              return {
                commentsByItem: {
                  ...state.commentsByItem,
                  [newComment.gallery_item_id]: exists ? list : [...list, commentRow],
                },
                gallery: state.gallery.map((item) =>
                  item.id === newComment.gallery_item_id
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const oldId = payload.old?.id;
            const targetItemId = payload.old?.gallery_item_id;

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
          { event: "INSERT", schema: "public", table: "customer_reviews" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const newRow = payload.new;
            if (!newRow?.id || !newRow.aktif) return;

            const newRevItem: CustomerReview = {
              id: newRow.id,
              musteriAdi: newRow.musteri_adi,
              puan: Number(newRow.puan) || 5,
              yorum: newRow.yorum ?? undefined,
              tarih: newRow.olusturulma_tarihi
                ? new Date(newRow.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : new Date().toLocaleDateString("tr-TR"),
              kaynak: newRow.google_review_url
                ? "Google"
                : newRow.kaynak === "Hizmet Sonrası"
                ? "Hizmet Sonrası"
                : "Salon",
              hizmetTuru: newRow.hizmet_turu,
              googleReviewUrl: newRow.google_review_url ?? undefined,
              createdAt: newRow.olusturulma_tarihi,
              randevuId: newRow.randevu_id ?? undefined,
            };

            set((state) => {
              const updated = [newRevItem, ...state.reviews.filter((r) => r.id !== newRow.id)];
              return {
                reviews: updated
                  .sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                  })
                  .slice(0, 5),
              };
            });
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
