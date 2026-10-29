export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import type { Database } from "@yildiz/types";

const AdminSupplierPostSchema = z
  .object({
    firma_adi: z.string().trim().min(1).max(150).optional(),
    firmaAdi: z.string().trim().min(1).max(150).optional(),
    yetkili_kisi: z.string().trim().min(1).max(150).optional(),
    yetkiliKisi: z.string().trim().min(1).max(150).optional(),
    telefon: z.string({ required_error: "Telefon zorunludur." }).trim().min(1).max(30),
    whatsapp: z.string().trim().max(30).nullable().optional(),
    eposta: z.string().trim().max(150).nullable().optional(),
    kategoriler: z.array(z.string().trim().min(1)).optional().default([]),
    adres: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (data) =>
      Boolean((data.firma_adi || data.firmaAdi) && (data.yetkili_kisi || data.yetkiliKisi)),
    { message: "Firma adı ve yetkili kişi alanları zorunludur." }
  );

const AdminSupplierPatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  firma_adi: z.string().trim().min(1).max(150).optional(),
  firmaAdi: z.string().trim().min(1).max(150).optional(),
  yetkili_kisi: z.string().trim().min(1).max(150).optional(),
  yetkiliKisi: z.string().trim().min(1).max(150).optional(),
  telefon: z.string().trim().min(1).max(30).optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  eposta: z.string().trim().max(150).nullable().optional(),
  kategoriler: z.array(z.string().trim().min(1)).optional(),
  adres: z.string().trim().max(500).nullable().optional(),
});

export const GET = withStaffOrAdminAuth(async () => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("firma_adi", { ascending: true });

    if (error) {
      return safeErrorResponse("Tedarikçiler getirilemedi.", 500, error);
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminSupplierPostSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        firma_adi: (body.firma_adi ?? body.firmaAdi)!,
        yetkili_kisi: (body.yetkili_kisi ?? body.yetkiliKisi)!,
        telefon: body.telefon,
        whatsapp: body.whatsapp ?? null,
        eposta: body.eposta ?? null,
        kategoriler: body.kategoriler ?? [],
        adres: body.adres ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Tedarikçi eklenemedi.", 500, error);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const DELETE = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const url = new URL(request.url);
    let id = url.searchParams.get("id")?.trim() || null;
    if (!id) {
      const body = (await request.json().catch(() => ({}))) as { id?: unknown };
      if (typeof body?.id === "string" && body.id.trim()) {
        id = body.id.trim();
      }
    }

    if (!id) {
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      return safeErrorResponse("Tedarikçi silinemedi.", 500, error);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const PATCH = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminSupplierPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { id, firmaAdi, yetkiliKisi } = body;

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
      return safeErrorResponse("Tedarikçi güncellenemedi.", 500, error);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
