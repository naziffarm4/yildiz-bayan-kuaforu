export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import type { Database } from "@yildiz/types";

export const GET = withStaffOrAdminAuth(async () => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("gallery_items")
      .select("*, gallery_comments(count)")
      .order("sira", { ascending: true })
      .order("olusturulma_tarihi", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const body = await request.json();
    const gorselUrl = body.url || body.gorselUrl;

    if (!gorselUrl || !body.baslik || !body.kategori) {
      return NextResponse.json(
        { error: "Görsel URL, başlık ve kategori alanları zorunludur." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("gallery_items")
      .insert({
        ...(body.id ? { id: body.id } : {}),
        url: gorselUrl,
        baslik: body.baslik,
        kategori: body.kategori,
        sira: Number(body.sira ?? 0),
        medya_turu: body.medya_turu ?? body.medyaTuru ?? "image",
        kapak_url: body.kapak_url ?? body.kapakUrl ?? null,
        aciklama: body.aciklama ?? null,
        stilist: body.stilist ?? "Yıldız Bayan Kuaförü",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
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
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const PATCH = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const updates: Database["public"]["Tables"]["gallery_items"]["Update"] = {};
    if (body.url !== undefined || body.gorselUrl !== undefined) {
      updates.url = body.url ?? body.gorselUrl;
    }
    if (body.baslik !== undefined) updates.baslik = body.baslik;
    if (body.kategori !== undefined) updates.kategori = body.kategori;
    if (body.sira !== undefined) updates.sira = Number(body.sira);
    if (body.medya_turu !== undefined || body.medyaTuru !== undefined) {
      updates.medya_turu = body.medya_turu ?? body.medyaTuru;
    }
    if (body.kapak_url !== undefined || body.kapakUrl !== undefined) {
      updates.kapak_url = body.kapak_url ?? body.kapakUrl;
    }
    if (body.aciklama !== undefined) updates.aciklama = body.aciklama;
    if (body.stilist !== undefined) updates.stilist = body.stilist;

    const { data, error } = await supabase
      .from("gallery_items")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
