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
      .from("inventory")
      .select("*, suppliers(firma_adi)")
      .order("urun_adi", { ascending: true });

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
      .from("inventory")
      .insert({
        ...(body.id ? { id: body.id } : {}),
        urun_adi: body.urun_adi ?? body.urunAdi,
        kategori: body.kategori,
        miktar: Number(body.miktar ?? 0),
        birim: body.birim,
        kritik_seviye: Number(body.kritik_seviye ?? body.kritikSeviye ?? 5),
        supplier_id: body.supplier_id ?? body.supplierId ?? null,
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

    const { error } = await supabase.from("inventory").delete().eq("id", id);
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
    const { id, kritikSeviye } = body;

    if (!id) {
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const updates: Database["public"]["Tables"]["inventory"]["Update"] = {};
    if (body.urun_adi !== undefined || body.urunAdi !== undefined) {
      updates.urun_adi = body.urun_adi ?? body.urunAdi;
    }
    if (body.kategori !== undefined) updates.kategori = body.kategori;
    if (body.birim !== undefined) updates.birim = body.birim;
    if (body.miktar !== undefined) updates.miktar = Number(body.miktar);
    if (kritikSeviye !== undefined || body.kritik_seviye !== undefined) {
      updates.kritik_seviye = Number(kritikSeviye ?? body.kritik_seviye);
    }
    if (body.supplier_id !== undefined || body.supplierId !== undefined) {
      updates.supplier_id = body.supplier_id ?? body.supplierId;
    }

    const { data, error } = await supabase
      .from("inventory")
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
