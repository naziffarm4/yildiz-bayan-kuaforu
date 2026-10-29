export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const GalleryLikeSchema = z
  .object({
    galleryId: z.string().trim().min(1).optional(),
    id: z.string().trim().min(1).optional(),
    action: z.enum(["like", "unlike"]).default("like"),
  })
  .refine((data) => Boolean(data.galleryId || data.id), {
    message: "galleryId parametresi gereklidir.",
  });

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`gallery-like:${getClientIp(request)}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Çok fazla istek gönderildi. Lütfen biraz bekleyiniz." },
        { status: 429 }
      );
    }

    // Şartname Madde 18: Beğeni ve yorum için giriş zorunludur
    const authSupabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Beğeni işlemi için giriş yapmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const parsed = await parseJsonBody(request, GalleryLikeSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const galleryId = (parsed.data.galleryId || parsed.data.id)!;
    const { action } = parsed.data;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    // 1. Mevcut galeri öğesini doğrula
    const { data: item, error: fetchError } = await supabase
      .from("gallery_items")
      .select("id, begeni_sayisi")
      .eq("id", galleryId)
      .maybeSingle();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Galeri öğesi bulunamadı." }, { status: 404 });
    }

    const currentCount = Number(item.begeni_sayisi ?? 0);

    // 2. Kullanıcı bazlı mükerrer beğeni kontrolü (gallery_likes tablosu)
    const { data: existingLike } = await supabase
      .from("gallery_likes")
      .select("user_id")
      .eq("gallery_item_id", galleryId)
      .eq("user_id", user.id)
      .maybeSingle();

    const hasRealLikeRecord =
      existingLike !== null &&
      typeof existingLike === "object" &&
      "user_id" in existingLike &&
      Boolean(existingLike.user_id);

    if (action === "like") {
      if (hasRealLikeRecord) {
        return NextResponse.json({
          success: true,
          galleryId,
          begeniSayisi: currentCount,
        });
      }

      await supabase
        .from("gallery_likes")
        .insert({ gallery_item_id: galleryId, user_id: user.id })
        .select("*")
        .single();
    } else {
      if (existingLike === null) {
        return NextResponse.json({
          success: true,
          galleryId,
          begeniSayisi: currentCount,
        });
      }

      const deleteStep = supabase
        .from("gallery_likes")
        .delete()
        .eq("gallery_item_id", galleryId) as unknown;

      if (deleteStep && typeof (deleteStep as { eq?: unknown }).eq === "function") {
        await (deleteStep as { eq: (col: string, val: string) => Promise<unknown> }).eq(
          "user_id",
          user.id
        );
      } else {
        await (deleteStep as Promise<unknown>);
      }
    }

    const delta = action === "unlike" ? -1 : 1;
    const newCount = Math.max(0, currentCount + delta);

    // 3. Sayıyı güncelle
    const { data: updated, error: updateError } = await supabase
      .from("gallery_items")
      .update({ begeni_sayisi: newCount })
      .eq("id", galleryId)
      .select("id, begeni_sayisi")
      .single();

    if (updateError) {
      return safeErrorResponse("Beğeni güncellenemedi.", 500, updateError);
    }

    return NextResponse.json({
      success: true,
      galleryId,
      begeniSayisi: updated.begeni_sayisi ?? newCount,
    });
  } catch (err: unknown) {
    return safeErrorResponse("Beğeni işlemi sırasında hata oluştu.", 500, err);
  }
}
