import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@yildiz/types";

export interface GooglePlacesReview {
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  rating?: number;
  text?: {
    text?: string;
    languageCode?: string;
  };
  originalText?: {
    text?: string;
    languageCode?: string;
  };
  publishTime?: string;
}

export interface GooglePlacesResponse {
  id?: string;
  displayName?: {
    text?: string;
    languageCode?: string;
  };
  rating?: number;
  userRatingCount?: number;
  reviews?: GooglePlacesReview[];
  nationalPhoneNumber?: string;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function executeGoogleSync(force = false) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY ortam değişkeni tanımlı değil.");
  }
  const placeId =
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "ChIJR_wdvgizzBQR0tN_pKYFp3M";
  const mapsUrl =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ||
    process.env.GOOGLE_MAPS_URL ||
    "https://maps.google.com/?cid=8333635848754942930";
  const writeReviewUrl =
    process.env.NEXT_PUBLIC_GOOGLE_WRITE_REVIEW_URL ||
    process.env.GOOGLE_WRITE_REVIEW_URL ||
    `https://search.google.com/local/writereview?placeid=${placeId}`;

  const supabase = getSupabaseAdmin();

  // 1. Kota Koruma Kontrolü (Quota Guard)
  if (supabase && !force) {
    const { data: settingsCheck } = await supabase
      .from("site_settings")
      .select("sayfa_metinleri")
      .limit(1)
      .maybeSingle();

    if (settingsCheck?.sayfa_metinleri && typeof settingsCheck.sayfa_metinleri === "object") {
      const sm = settingsCheck.sayfa_metinleri as Record<string, unknown>;
      const revSec = sm.reviewsSection as Record<string, unknown> | undefined;
      const lastSync = revSec?.lastGoogleSyncAt as string | undefined;

      if (lastSync) {
        const diffHours = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
        if (diffHours < 6) {
          return {
            success: true,
            skipped: true,
            reason: "Kota koruması devrede. Son 6 saat içinde güncellendi.",
            data: {
              googleRating: revSec?.googleRating ?? 4.9,
              googleReviewCount: revSec?.googleReviewCount ?? 14,
              googlePlaceId: placeId,
              googleMapsUrl: mapsUrl,
              googleWriteReviewUrl: writeReviewUrl,
              lastGoogleSyncAt: lastSync,
            },
          };
        }
      }
    }
  }

  let rating = 4.9;
  let userRatingCount = 14;
  let incomingReviews: GooglePlacesReview[] = [];

  // 2. Google Places API (New) çağrısı yap
  try {
    const googleRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,rating,userRatingCount,reviews,nationalPhoneNumber",
        },
      }
    );

    if (googleRes.ok) {
      const placeData = (await googleRes.json()) as GooglePlacesResponse;
      if (typeof placeData.rating === "number") {
        rating = placeData.rating;
      }
      if (typeof placeData.userRatingCount === "number") {
        userRatingCount = placeData.userRatingCount;
      }
      if (Array.isArray(placeData.reviews)) {
        incomingReviews = placeData.reviews;
      }
    }
  } catch (err: unknown) {
    console.warn("Google Places API çağrısı başarısız, varsayılan değerler korunuyor:", err);
  }

  let newReviewsCount = 0;
  const nowIso = new Date().toISOString();

  if (supabase) {
    // 3. Supabase site_settings tablosundaki reviewsSection alanını güncelle
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("id, sayfa_metinleri")
      .limit(1)
      .maybeSingle();

    if (settingsRow?.id) {
      const currentSayfaMetinleri =
        typeof settingsRow.sayfa_metinleri === "object" && settingsRow.sayfa_metinleri !== null
          ? (settingsRow.sayfa_metinleri as Record<string, unknown>)
          : {};

      const currentReviewsSection =
        typeof currentSayfaMetinleri.reviewsSection === "object" &&
        currentSayfaMetinleri.reviewsSection !== null
          ? (currentSayfaMetinleri.reviewsSection as Record<string, unknown>)
          : {};

      const updatedSayfaMetinleri = {
        ...currentSayfaMetinleri,
        reviewsSection: {
          ...currentReviewsSection,
          googleRating: rating,
          googleReviewCount: userRatingCount,
          googlePlaceId: placeId,
          googleMapsUrl: mapsUrl,
          googleWriteReviewUrl: writeReviewUrl,
          lastGoogleSyncAt: nowIso,
        },
      };

      await supabase
        .from("site_settings")
        .update({
          sayfa_metinleri: updatedSayfaMetinleri as unknown as Json,
        })
        .eq("id", settingsRow.id);
    }

    // 4. Gelen Google yorumlarını customer_reviews tablosuna ekle (mükerrer olmadan, toplu insert - P-03)
    if (incomingReviews.length > 0) {
      const selectQuery = supabase
        .from("customer_reviews")
        .select("musteri_adi, yorum") as unknown as {
        limit?: (n: number) => Promise<{
          data: Array<{ musteri_adi: string; yorum: string | null }> | null;
        }>;
      } & Promise<{
        data: Array<{ musteri_adi: string; yorum: string | null }> | null;
      }>;

      const { data: existingReviews } =
        typeof selectQuery.limit === "function"
          ? await selectQuery.limit(500)
          : await selectQuery;

      const existingSet = new Set(
        (existingReviews || []).map(
          (r) => `${r.musteri_adi.trim()}:::${(r.yorum || "").trim()}`
        )
      );

      const rowsToInsert: Array<{
        musteri_adi: string;
        yorum: string;
        puan: number;
        hizmet_turu: string;
        aktif: boolean;
      }> = [];

      for (const rev of incomingReviews) {
        const author = rev.authorAttribution?.displayName?.trim() || "Google Kullanıcısı";
        const comment = (rev.text?.text || rev.originalText?.text || "").trim();
        const score = typeof rev.rating === "number" ? Math.min(Math.max(rev.rating, 1), 5) : 5;

        if (comment && !existingSet.has(`${author}:::${comment}`)) {
          rowsToInsert.push({
            musteri_adi: author,
            yorum: comment,
            puan: score,
            hizmet_turu: "Google Doğrulanmış Deneyim",
            aktif: true,
          });
          existingSet.add(`${author}:::${comment}`);
        }
      }

      if (rowsToInsert.length > 0) {
        await supabase.from("customer_reviews").insert(rowsToInsert);
        newReviewsCount = rowsToInsert.length;
      }
    }
  }

  return {
    success: true,
    data: {
      googleRating: rating,
      googleReviewCount: userRatingCount,
      googlePlaceId: placeId,
      googleMapsUrl: mapsUrl,
      googleWriteReviewUrl: writeReviewUrl,
      lastGoogleSyncAt: nowIso,
      newReviewsAdded: newReviewsCount,
    },
  };
}
