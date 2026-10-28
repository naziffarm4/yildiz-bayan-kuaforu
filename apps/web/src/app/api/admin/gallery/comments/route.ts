export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";

export const GET = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const url = new URL(request.url);
    const galleryId = url.searchParams.get("galleryId");

    let query = supabase
      .from("gallery_comments")
      .select("id, gallery_item_id, musteri_adi, yorum, aktif, olusturulma_tarihi")
      .order("olusturulma_tarihi", { ascending: false });

    if (galleryId) {
      query = query.eq("gallery_item_id", galleryId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Yorumlar getirilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const DELETE = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "id parametresi gereklidir." }, { status: 400 });
    }

    const { error } = await supabase.from("gallery_comments").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Yorum başarıyla silindi.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Yorum silinemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
