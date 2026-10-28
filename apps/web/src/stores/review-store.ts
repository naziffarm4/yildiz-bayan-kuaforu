import { create, type SetState, type GetState } from "./zustand";
import type { CustomerReview } from "@yildiz/types";
import { createClient } from "@/lib/supabase/client";
import { ContentService } from "@/services/content.service";

export type ReviewSyncMessage =
  | { type: "REVIEW_ADDED"; review: CustomerReview }
  | { type: "REVIEW_DELETED"; id: string }
  | { type: "REVIEW_UPDATED"; review: CustomerReview };

export interface ReviewState {
  reviews: CustomerReview[];
  isLoading: boolean;
  isSyncInitialized: boolean;

  fetchReviews: () => Promise<void>;
  addReview: (review: (Omit<CustomerReview, "id" | "tarih"> & { tarih?: string; id?: string }) | CustomerReview) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  initSocketSync: () => () => void;
}

const BROADCAST_CHANNEL_NAME = "yildiz-reviews-sync";

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `http://localhost:3000${path}`;
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

export const useReviewStore = create<ReviewState>((set: SetState<ReviewState>, _get: GetState<ReviewState>) => ({
  reviews: [],
  isLoading: false,
  isSyncInitialized: false,

  fetchReviews: async () => {
    set({ isLoading: true });
    try {
      const client = createClient();
      const contentService = new ContentService(client);
      const rows = await contentService.getActiveReviews();

      if (rows && rows.length > 0) {
        const mappedReviews: CustomerReview[] = rows.map((rev) => ({
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

        const sorted = [...mappedReviews]
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 5);

        set({ reviews: sorted });
      }
    } catch (err) {
      console.error("Zustand fetchReviews hatası:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addReview: async (review: (Omit<CustomerReview, "id" | "tarih"> & { tarih?: string; id?: string }) | CustomerReview) => {
    const isAlreadySaved = Boolean((review as CustomerReview).id);
    const id = (review as CustomerReview).id || `rev-${Date.now()}`;
    const todayStr =
      review.tarih ||
      new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date());

    const newRev: CustomerReview = {
      id,
      tarih: todayStr,
      createdAt: review.createdAt || new Date().toISOString(),
      ...review,
    };

    // Optimistic Update (slice 5)
    set((state: ReviewState) => {
      const updated = [newRev, ...state.reviews.filter((r: CustomerReview) => r.id !== id)];
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

    // Broadcast
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "REVIEW_ADDED",
        review: newRev,
      } as ReviewSyncMessage);
      channel.close();
    }

    if (!isAlreadySaved) {
      try {
        await fetch(getApiUrl("/api/reviews"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            musteri_adi: review.musteriAdi,
            yorum: review.yorum,
            puan: review.puan,
            hizmet_turu: review.hizmetTuru || "Genel Deneyim",
            google_review_url: review.googleReviewUrl || null,
            randevu_id: review.randevuId || null,
            kaynak: review.kaynak || "Salon",
          }),
        });
      } catch (err) {
        console.error("Zustand addReview API hatası:", err);
      }
    }
  },

  deleteReview: async (id: string) => {
    set((state: ReviewState) => ({
      reviews: state.reviews.filter((r: CustomerReview) => r.id !== id),
    }));

    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: "REVIEW_DELETED",
        id,
      } as ReviewSyncMessage);
      channel.close();
    }

    try {
      await fetch(getApiUrl(`/api/admin/reviews?id=${encodeURIComponent(id)}`), {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Zustand deleteReview API hatası:", err);
    }
  },

  initSocketSync: () => {
    if (typeof window === "undefined") return () => {};

    // 1. BroadcastChannel (Sekmeler arası)
    const broadcastChannel = getBroadcastChannel();
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const msg = event.data as ReviewSyncMessage;
        if (!msg || !msg.type) return;

        if (msg.type === "REVIEW_ADDED") {
          set((state: ReviewState) => {
            const updated = [msg.review, ...state.reviews.filter((r: CustomerReview) => r.id !== msg.review.id)];
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
        } else if (msg.type === "REVIEW_DELETED") {
          set((state: ReviewState) => ({
            reviews: state.reviews.filter((r: CustomerReview) => r.id !== msg.id),
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
        .channel("zustand-reviews-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "customer_reviews" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const newRow = payload.new;
            if (!newRow?.id || !newRow.aktif) return;

            const newReviewItem: CustomerReview = {
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

            set((state: ReviewState) => {
              const updated = [newReviewItem, ...state.reviews.filter((r: CustomerReview) => r.id !== newRow.id)];
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
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "customer_reviews" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const updatedRow = payload.new;
            if (!updatedRow?.id) return;

            if (!updatedRow.aktif) {
              set((state: ReviewState) => ({
                reviews: state.reviews.filter((r: CustomerReview) => r.id !== updatedRow.id),
              }));
              return;
            }

            const updatedReviewItem: CustomerReview = {
              id: updatedRow.id,
              musteriAdi: updatedRow.musteri_adi,
              puan: Number(updatedRow.puan) || 5,
              yorum: updatedRow.yorum ?? undefined,
              tarih: updatedRow.olusturulma_tarihi
                ? new Date(updatedRow.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : new Date().toLocaleDateString("tr-TR"),
              kaynak: updatedRow.google_review_url
                ? "Google"
                : updatedRow.kaynak === "Hizmet Sonrası"
                ? "Hizmet Sonrası"
                : "Salon",
              hizmetTuru: updatedRow.hizmet_turu,
              googleReviewUrl: updatedRow.google_review_url ?? undefined,
              createdAt: updatedRow.olusturulma_tarihi,
              randevuId: updatedRow.randevu_id ?? undefined,
            };

            set((state: ReviewState) => {
              const updated = [updatedReviewItem, ...state.reviews.filter((r: CustomerReview) => r.id !== updatedRow.id)];
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
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "customer_reviews" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const deletedId = payload.old?.id;
            if (!deletedId) return;

            set((state: ReviewState) => ({
              reviews: state.reviews.filter((r: CustomerReview) => r.id !== deletedId),
            }));
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Zustand Supabase Realtime Reviews başlatılamadı:", err);
    }

    set({ isSyncInitialized: true });

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
