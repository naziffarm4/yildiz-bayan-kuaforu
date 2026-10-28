export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

    const rawBody: unknown = await request.json().catch(() => ({}));
    const parsed = GalleryLikeSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz istek verisi." },
        { status: 400 }
      );
    }

    const galleryId = (parsed.data.galleryId || parsed.data.id)!;
    const { action } = parsed.data;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    // 1. Mevcut begeni_sayisi değerini oku
    const { data: item, error: fetchError } = await supabase
      .from("gallery_items")
      .select("id, begeni_sayisi")
      .eq("id", galleryId)
      .maybeSingle();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Galeri öğesi bulunamadı." }, { status: 404 });
    }

    const currentCount = Number(item.begeni_sayisi ?? 0);
    const delta = action === "unlike" ? -1 : 1;
    const newCount = Math.max(0, currentCount + delta);

    // 2. Sayıyı güncelle
    const { data: updated, error: updateError } = await supabase
      .from("gallery_items")
      .update({ begeni_sayisi: newCount })
      .eq("id", galleryId)
      .select("id, begeni_sayisi")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      galleryId,
      begeniSayisi: updated.begeni_sayisi ?? newCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Beğeni işlemi sırasında hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
