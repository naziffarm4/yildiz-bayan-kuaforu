export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const { data: newCount, error } = await supabase.rpc("toggle_gallery_like", {
      p_gallery_id: galleryId,
      p_action: action,
    });

    if (error) {
      return safeErrorResponse("Beğeni güncellenemedi.", 500, error);
    }

    const resolvedCount = Number(newCount ?? 0);

    return NextResponse.json({
      success: true,
      galleryId,
      count: resolvedCount,
      begeniSayisi: resolvedCount,
    });
  } catch (err: unknown) {
    return safeErrorResponse("Beğeni işlemi sırasında hata oluştu.", 500, err);
  }
}
