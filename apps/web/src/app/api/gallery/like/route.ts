export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { galleryId, action } = body;

    if (!galleryId) {
      return NextResponse.json({ error: "galleryId parametresi gereklidir." }, { status: 400 });
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
