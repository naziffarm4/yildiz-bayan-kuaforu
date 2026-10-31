export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const GalleryCommentPostSchema = z
  .object({
    galleryId: z.string().trim().min(1).optional(),
    gallery_item_id: z.string().trim().min(1).optional(),
    musteriAdi: z.string().trim().max(100).optional(),
    musteri_adi: z.string().trim().max(100).optional(),
    yorum: z
      .string({ required_error: "Yorum metni zorunludur." })
      .trim()
      .min(1, "Yorum metni boş olamaz.")
      .max(500, "Yorum metni en fazla 500 karakter olabilir."),
  })
  .refine((data) => Boolean(data.galleryId || data.gallery_item_id), {
    message: "Galeri öğesi ID zorunludur.",
  });

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const url = new URL(request.url);
    const galleryId = url.searchParams.get("galleryId")?.trim();

    if (!galleryId) {
      return NextResponse.json({ error: "galleryId parametresi gereklidir." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("gallery_comments")
      .select("id, gallery_item_id, musteri_adi, yorum, olusturulma_tarihi")
      .eq("gallery_item_id", galleryId)
      .eq("aktif", true)
      .order("olusturulma_tarihi", { ascending: true });

    if (error) {
      return safeErrorResponse("Yorumlar getirilemedi.", 500, error);
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (err: unknown) {
    return safeErrorResponse("Yorumlar getirilemedi.", 500, err);
  }
}

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`gallery-comments:${getClientIp(request)}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Çok fazla yorum isteği gönderildi. Lütfen biraz bekleyiniz." },
        { status: 429 }
      );
    }

    // Şartname Madde 16 & 18: Beğeni ve yorum için giriş zorunludur
    const authSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Yorum yapmak için giriş yapmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const parsed = await parseJsonBody(request, GalleryCommentPostSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const galleryId = (parsed.data.galleryId || parsed.data.gallery_item_id)!;
    const yorum = parsed.data.yorum;

    // Bölüm 2.10: Kimlik sahteciliğini önlemek için istemciden gelen musteriAdi kullanılmaz; yalnızca doğrulanmış profil veya user_metadata adı kullanılır
    let musteriAdi = "";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ad, soyad")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && typeof profile.ad === "string" && profile.ad.trim()) {
        musteriAdi = `${profile.ad.trim()} ${(profile.soyad || "").trim()}`.trim();
      }
    } catch (profileErr: unknown) {
      console.warn("Galeri yorumu profil sorgusu uyarısı:", profileErr);
    }

    if (!musteriAdi) {
      const metaAd = (user.user_metadata?.ad as string | undefined)?.trim() || "";
      const metaSoyad = (user.user_metadata?.soyad as string | undefined)?.trim() || "";
      const metaFull =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        (user.user_metadata?.name as string | undefined)?.trim() ||
        "";
      musteriAdi =
        `${metaAd} ${metaSoyad}`.trim() || metaFull || "Değerli Müşterimiz";
    }

    musteriAdi = musteriAdi.slice(0, 100);

    // Şartname Madde 18: Yorumlar admin onayından sonra yayınlanır (aktif: false)
    const { data, error } = await supabase
      .from("gallery_comments")
      .insert({
        gallery_item_id: galleryId,
        musteri_adi: musteriAdi,
        yorum,
        aktif: false,
      })
      .select("id, gallery_item_id, musteri_adi, yorum, aktif, olusturulma_tarihi")
      .single();

    if (error) {
      return safeErrorResponse("Yorum kaydedilemedi.", 500, error);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    return safeErrorResponse("Yorum kaydedilemedi.", 500, err);
  }
}
