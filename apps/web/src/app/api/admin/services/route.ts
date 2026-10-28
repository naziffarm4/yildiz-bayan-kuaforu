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
      .from("services")
      .select("*")
      .order("ad", { ascending: true });

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
    const { data, error } = await supabase
      .from("services")
      .insert({
        ...(body.id ? { id: body.id } : {}),
        ad: body.ad,
        kategori: body.kategori,
        tahmini_sure_dakika: Number(body.tahmini_sure_dakika ?? body.tahminiSureDakika),
        fiyat: Number(body.fiyat),
        aktif: body.aktif ?? true,
        aciklama: body.aciklama ?? null,
        gorsel_url: body.gorsel_url ?? body.gorselUrl ?? null,
        detay: body.detay ?? null,
        sira: Number(body.sira ?? 0),
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

    const { error } = await supabase.from("services").delete().eq("id", id);
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
    const { id, tahminiSureDakika } = body;

    if (!id) {
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const updates: Database["public"]["Tables"]["services"]["Update"] = {};
    if (body.ad !== undefined) updates.ad = body.ad;
    if (body.kategori !== undefined) updates.kategori = body.kategori;
    if (tahminiSureDakika !== undefined || body.tahmini_sure_dakika !== undefined) {
      updates.tahmini_sure_dakika = Number(tahminiSureDakika ?? body.tahmini_sure_dakika);
    }
    if (body.fiyat !== undefined) updates.fiyat = Number(body.fiyat);
    if (body.aktif !== undefined) updates.aktif = Boolean(body.aktif);
    if (body.aciklama !== undefined) updates.aciklama = body.aciklama;
    if (body.gorsel_url !== undefined || body.gorselUrl !== undefined) {
      updates.gorsel_url = body.gorsel_url ?? body.gorselUrl ?? null;
    }
    if (body.detay !== undefined) updates.detay = body.detay;
    if (body.sira !== undefined) updates.sira = Number(body.sira);

    const { data, error } = await supabase
      .from("services")
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
