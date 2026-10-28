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
      .from("suppliers")
      .select("*")
      .order("firma_adi", { ascending: true });

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
      .from("suppliers")
      .insert({
        ...(body.id ? { id: body.id } : {}),
        firma_adi: body.firma_adi ?? body.firmaAdi,
        yetkili_kisi: body.yetkili_kisi ?? body.yetkiliKisi,
        telefon: body.telefon,
        whatsapp: body.whatsapp ?? null,
        eposta: body.eposta ?? null,
        kategoriler: body.kategoriler ?? [],
        adres: body.adres ?? null,
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

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
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
    const { id, firmaAdi, yetkiliKisi } = body;

    if (!id) {
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const updates: Database["public"]["Tables"]["suppliers"]["Update"] = {};
    if (firmaAdi !== undefined || body.firma_adi !== undefined) {
      updates.firma_adi = firmaAdi ?? body.firma_adi;
    }
    if (yetkiliKisi !== undefined || body.yetkili_kisi !== undefined) {
      updates.yetkili_kisi = yetkiliKisi ?? body.yetkili_kisi;
    }
    if (body.telefon !== undefined) updates.telefon = body.telefon;
    if (body.whatsapp !== undefined) updates.whatsapp = body.whatsapp;
    if (body.eposta !== undefined) updates.eposta = body.eposta;
    if (body.kategoriler !== undefined) updates.kategoriler = body.kategoriler;
    if (body.adres !== undefined) updates.adres = body.adres;

    const { data, error } = await supabase
      .from("suppliers")
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
