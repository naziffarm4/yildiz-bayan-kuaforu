import { create, type SetState, type GetState } from "./zustand";
import type { GalleryItem } from "@yildiz/types";
import { createClient } from "@/lib/supabase/client";
import { ContentService } from "@/services/content.service";

export interface GalleryCommentRow {
  id: string;
  gallery_item_id?: string;
  musteri_adi: string;
  yorum: string;
  aktif?: boolean;
  olusturulma_tarihi: string;
}

export type GallerySyncMessage =
  | { type: "LIKE_UPDATED"; galleryId: string; delta: number; begeniSayisi?: number }
  | { type: "COMMENT_ADDED"; galleryId: string; comment: GalleryCommentRow }
  | { type: "COMMENT_DELETED"; galleryId: string; commentId: string }
  | { type: "ITEM_UPDATED"; id: string; updates: Partial<GalleryItem> }
  | { type: "ITEM_DELETED"; id: string };

export interface GalleryState {
  gallery: GalleryItem[];
  commentsByItem: Record<string, GalleryCommentRow[]>;
  isLoading: boolean;
  isSyncInitialized: boolean;
  likedIds: string[];

  // Actions
  fetchGallery: () => Promise<void>;
  fetchComments: (galleryId: string) => Promise<void>;
  toggleLike: (galleryId: string) => Promise<void>;
  addComment: (galleryId: string, author: string, commentText: string) => Promise<boolean>;
  deleteComment: (galleryId: string, commentId: string) => Promise<boolean>;
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  initSocketSync: () => () => void;
}

const BROADCAST_CHANNEL_NAME = "yildiz-gallery-sync";

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

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `http://localhost:3000${path}`;
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

export const useGalleryStore = create<GalleryState>((set: SetState<GalleryState>, get: GetState<GalleryState>) => ({
  gallery: [],
  commentsByItem: {},
  isLoading: false,
  isSyncInitialized: false,
  likedIds: getStoredLikes(),

  fetchGallery: async () => {
    set({ isLoading: true });
    try {
      const client = createClient();
      const contentService = new ContentService(client);
      const rows = await contentService.getGalleryItems();

      if (rows && rows.length > 0) {
        const mapped: GalleryItem[] = rows.map((item) => ({
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
        set({ gallery: mapped });
      }
    } catch (err) {
      console.error("Zustand fetchGallery hatası:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchComments: async (galleryId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/gallery/comments?galleryId=${encodeURIComponent(galleryId)}`));
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          set((state: GalleryState) => ({
            commentsByItem: {
              ...state.commentsByItem,
              [galleryId]: json.data,
            },
          }));
        }
      }
    } catch (err) {
      console.error("Zustand fetchComments hatası:", err);
    }
  },

  toggleLike: async (galleryId: string) => {
    const { likedIds, gallery } = get();
    const isLiked = likedIds.includes(galleryId);
    const action = isLiked ? "unlike" : "like";
    const delta = isLiked ? -1 : 1;

    const newLikedIds = isLiked
      ? likedIds.filter((id: string) => id !== galleryId)
      : [...likedIds, galleryId];

    saveStoredLikes(newLikedIds);

    // Optimistic Update
    const currentItem = gallery.find((i: GalleryItem) => i.id === galleryId);
    const newBegeniSayisi = currentItem
      ? Math.max(0, currentItem.begeniSayisi + delta)
      : 0;

    set({
      likedIds: newLikedIds,
      gallery: gallery.map((item: GalleryItem) =>
        item.id === galleryId
          ? { ...item, begeniSayisi: newBegeniSayisi }
          : item,
      ),
    });

    // Cross-tab broadcast
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "LIKE_UPDATED",
        galleryId,
        delta,
        begeniSayisi: newBegeniSayisi,
      } as GallerySyncMessage);
      channel.close();
    }

    // Call API
    try {
      await fetch(getApiUrl("/api/gallery/like"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryId, action }),
      });
    } catch (err) {
      console.error("Zustand toggleLike API hatası:", err);
    }
  },

  addComment: async (galleryId: string, author: string, commentText: string) => {
    const tempId = `temp-${Date.now()}`;
    const newComment: GalleryCommentRow = {
      id: tempId,
      gallery_item_id: galleryId,
      musteri_adi: author,
      yorum: commentText,
      olusturulma_tarihi: new Date().toISOString(),
    };

    // Optimistic Update
    set((state: GalleryState) => {
      const existing = state.commentsByItem[galleryId] || [];
      return {
        commentsByItem: {
          ...state.commentsByItem,
          [galleryId]: [...existing, newComment],
        },
        gallery: state.gallery.map((item: GalleryItem) =>
          item.id === galleryId
            ? { ...item, yorumSayisi: (item.yorumSayisi ?? 0) + 1 }
            : item,
        ),
      };
    });

    // Cross-tab broadcast
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "COMMENT_ADDED",
        galleryId,
        comment: newComment,
      } as GallerySyncMessage);
      channel.close();
    }

    // Call API
    try {
      const res = await fetch(getApiUrl("/api/gallery/comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId,
          musteriAdi: author,
          yorum: commentText,
        }),
      });

      if (!res.ok) {
        throw new Error("Yorum iletilemedi");
      }

      const json = await res.json();
      if (json.data?.id) {
        // Swap temp id with real id
        set((state: GalleryState) => {
          const list = state.commentsByItem[galleryId] || [];
          return {
            commentsByItem: {
              ...state.commentsByItem,
              [galleryId]: list.map((c: GalleryCommentRow) =>
                c.id === tempId ? { ...c, id: json.data.id } : c,
              ),
            },
          };
        });
      }
      return true;
    } catch (err) {
      console.error("Zustand addComment API hatası:", err);
      return false;
    }
  },

  deleteComment: async (galleryId: string, commentId: string) => {
    // Optimistic Update
    set((state: GalleryState) => {
      const list = state.commentsByItem[galleryId] || [];
      return {
        commentsByItem: {
          ...state.commentsByItem,
          [galleryId]: list.filter((c: GalleryCommentRow) => c.id !== commentId),
        },
        gallery: state.gallery.map((item: GalleryItem) =>
          item.id === galleryId
            ? { ...item, yorumSayisi: Math.max(0, (item.yorumSayisi ?? 0) - 1) }
            : item,
        ),
      };
    });

    // Cross-tab broadcast
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "COMMENT_DELETED",
        galleryId,
        commentId,
      } as GallerySyncMessage);
      channel.close();
    }

    // Call API
    try {
      const res = await fetch(
        getApiUrl(`/api/admin/gallery/comments?id=${encodeURIComponent(commentId)}`),
        { method: "DELETE" },
      );
      return res.ok;
    } catch (err) {
      console.error("Zustand deleteComment API hatası:", err);
      return false;
    }
  },

  updateGalleryItem: async (id: string, updates: Partial<GalleryItem>) => {
    // Optimistic Update
    set((state: GalleryState) => ({
      gallery: state.gallery.map((item: GalleryItem) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));

    // Cross-tab broadcast
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "ITEM_UPDATED",
        id,
        updates,
      } as GallerySyncMessage);
      channel.close();
    }

    // Call API
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
      console.error("Zustand updateGalleryItem API hatası:", err);
    }
  },

  deleteGalleryItem: async (id: string) => {
    set((state: GalleryState) => ({
      gallery: state.gallery.filter((item: GalleryItem) => item.id !== id),
    }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "ITEM_DELETED",
        id,
      } as GallerySyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl(`/api/admin/gallery?id=${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Zustand deleteGalleryItem API hatası:", err);
    }
  },

  initSocketSync: () => {
    if (typeof window === "undefined") return () => {};

    // 1. BroadcastChannel (Sekmeler arası eşitleme)
    const broadcastChannel = getBroadcastChannel();
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const msg = event.data as GallerySyncMessage;
        if (!msg || !msg.type) return;

        if (msg.type === "LIKE_UPDATED") {
          set((state: GalleryState) => ({
            gallery: state.gallery.map((item: GalleryItem) =>
              item.id === msg.galleryId
                ? {
                    ...item,
                    begeniSayisi:
                      typeof msg.begeniSayisi === "number"
                        ? msg.begeniSayisi
                        : Math.max(0, item.begeniSayisi + msg.delta),
                  }
                : item,
            ),
          }));
        } else if (msg.type === "COMMENT_ADDED") {
          set((state: GalleryState) => {
            const list = state.commentsByItem[msg.galleryId] || [];
            const exists = list.some((c: GalleryCommentRow) => c.id === msg.comment.id);
            return {
              commentsByItem: {
                ...state.commentsByItem,
                [msg.galleryId]: exists ? list : [...list, msg.comment],
              },
              gallery: state.gallery.map((item: GalleryItem) =>
                item.id === msg.galleryId
                  ? { ...item, yorumSayisi: (item.yorumSayisi ?? 0) + 1 }
                  : item,
              ),
            };
          });
        } else if (msg.type === "COMMENT_DELETED") {
          set((state: GalleryState) => {
            const list = state.commentsByItem[msg.galleryId] || [];
            return {
              commentsByItem: {
                ...state.commentsByItem,
                [msg.galleryId]: list.filter((c: GalleryCommentRow) => c.id !== msg.commentId),
              },
              gallery: state.gallery.map((item: GalleryItem) =>
                item.id === msg.galleryId
                  ? { ...item, yorumSayisi: Math.max(0, (item.yorumSayisi ?? 0) - 1) }
                  : item,
              ),
            };
          });
        } else if (msg.type === "ITEM_UPDATED") {
          set((state: GalleryState) => ({
            gallery: state.gallery.map((item: GalleryItem) =>
              item.id === msg.id ? { ...item, ...msg.updates } : item,
            ),
          }));
        } else if (msg.type === "ITEM_DELETED") {
          set((state: GalleryState) => ({
            gallery: state.gallery.filter((item: GalleryItem) => item.id !== msg.id),
          }));
        }
      };
    }

    // 2. Supabase WebSocket Realtime Channel
    let supabaseClient: ReturnType<typeof createClient> | null = null;
    let realtimeChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    try {
      supabaseClient = createClient();
      realtimeChannel = supabaseClient
        .channel("zustand-gallery-realtime")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "gallery_items" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const updated = payload.new;
            if (!updated?.id) return;
            set((state: GalleryState) => ({
              gallery: state.gallery.map((item: GalleryItem) =>
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

            set((state: GalleryState) => {
              const list = state.commentsByItem[newComment.gallery_item_id] || [];
              const exists = list.some((c: GalleryCommentRow) => c.id === newComment.id);
              return {
                commentsByItem: {
                  ...state.commentsByItem,
                  [newComment.gallery_item_id]: exists ? list : [...list, commentRow],
                },
                gallery: state.gallery.map((item: GalleryItem) =>
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

            set((state: GalleryState) => {
              const updatedComments: Record<string, GalleryCommentRow[]> = {};
              for (const [gid, list] of Object.entries(state.commentsByItem)) {
                updatedComments[gid] = (list as GalleryCommentRow[]).filter((c: GalleryCommentRow) => c.id !== oldId);
              }

              return {
                commentsByItem: updatedComments,
                gallery: state.gallery.map((item: GalleryItem) =>
                  targetItemId && item.id === targetItemId
                    ? { ...item, yorumSayisi: Math.max(0, (item.yorumSayisi ?? 0) - 1) }
                    : item,
                ),
              };
            });
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Zustand Supabase Realtime başlatılamadı:", err);
    }

    // 3. Heartbeat (15s arka plan senkronizasyonu - sayfa görünürken)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        get().fetchGallery();
      }
    }, 15000);

    set({ isSyncInitialized: true });

    return () => {
      clearInterval(interval);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (supabaseClient && realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
      }
    };
  },
}));
