export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const url = new URL(request.url);
    const galleryId = url.searchParams.get("galleryId");

    if (!galleryId) {
      return NextResponse.json({ error: "galleryId parametresi gereklidir." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("gallery_item_id", galleryId)
      .eq("aktif", true)
      .order("olusturulma_tarihi", { ascending: true });

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
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const galleryId = body.galleryId || body.gallery_item_id;
    const musteriAdi = (body.musteriAdi || body.musteri_adi || "").trim();
    const yorum = (body.yorum || "").trim();

    if (!galleryId || !musteriAdi || !yorum) {
      return NextResponse.json(
        { error: "Galeri öğesi ID, isim ve yorum metni zorunludur." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("gallery_comments")
      .insert({
        gallery_item_id: galleryId,
        musteri_adi: musteriAdi,
        yorum: yorum,
        aktif: true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Yorum kaydedilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
