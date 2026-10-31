export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";
import type { Database } from "@yildiz/types";

const AdminServicePostSchema = z
  .object({
    ad: z.string({ required_error: "Hizmet adı zorunludur." }).trim().min(1).max(150),
    kategori: z.string({ required_error: "Kategori zorunludur." }).trim().min(1).max(100),
    tahmini_sure_dakika: z.coerce.number().int().positive("Tahmini süre pozitif olmalıdır.").optional(),
    tahminiSureDakika: z.coerce.number().int().positive("Tahmini süre pozitif olmalıdır.").optional(),
    fiyat: z.coerce.number().nonnegative("Fiyat negatif olamaz."),
    aktif: z.boolean().optional().default(true),
    aciklama: z.string().max(1000).nullable().optional(),
    gorsel_url: z.string().max(500).nullable().optional(),
    gorselUrl: z.string().max(500).nullable().optional(),
    detay: z.string().max(2000).nullable().optional(),
    sira: z.coerce.number().int().nonnegative().optional().default(0),
  })
  .refine(
    (data) =>
      (data.tahmini_sure_dakika !== undefined && data.tahmini_sure_dakika > 0) ||
      (data.tahminiSureDakika !== undefined && data.tahminiSureDakika > 0),
    { message: "Geçerli bir tahmini süre (dakika) belirtilmelidir." }
  );

const AdminServicePatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  ad: z.string().trim().min(1).max(150).optional(),
  kategori: z.string().trim().min(1).max(100).optional(),
  tahmini_sure_dakika: z.coerce.number().int().positive("Tahmini süre pozitif olmalıdır.").optional(),
  tahminiSureDakika: z.coerce.number().int().positive("Tahmini süre pozitif olmalıdır.").optional(),
  fiyat: z.coerce.number().nonnegative("Fiyat negatif olamaz.").optional(),
  aktif: z.boolean().optional(),
  aciklama: z.string().max(1000).nullable().optional(),
  gorsel_url: z.string().max(500).nullable().optional(),
  gorselUrl: z.string().max(500).nullable().optional(),
  detay: z.string().max(2000).nullable().optional(),
  sira: z.coerce.number().int().nonnegative().optional(),
});

export const GET = withStaffOrAdminAuth(async () => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("ad", { ascending: true });

    if (error) {
      return safeErrorResponse("Hizmetler getirilemedi.", 500, error);
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const POST = withAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminServicePostSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const duration = (body.tahmini_sure_dakika ?? body.tahminiSureDakika)!;

    const { data, error } = await supabase
      .from("services")
      .insert({
        ad: body.ad,
        kategori: body.kategori,
        tahmini_sure_dakika: duration,
        fiyat: body.fiyat,
        aktif: body.aktif ?? true,
        aciklama: body.aciklama ?? null,
        gorsel_url: body.gorsel_url ?? body.gorselUrl ?? null,
        detay: body.detay ?? null,
        sira: body.sira ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Hizmet eklenemedi.", 500, error);
    }

    await recordAuditLog({
      action: "service.create",
      entityType: "services",
      entityId: data?.id ?? null,
      metadata: { ad: body.ad, kategori: body.kategori, fiyat: body.fiyat },
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const DELETE = withAdminAuth(async (request: Request) => {
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

    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      return safeErrorResponse("Hizmet silinemedi.", 500, error);
    }

    await recordAuditLog({
      action: "service.delete",
      entityType: "services",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const PATCH = withAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminServicePatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { id, tahminiSureDakika } = body;

    const updates: Database["public"]["Tables"]["services"]["Update"] = {};
    if (body.ad !== undefined) updates.ad = body.ad;
    if (body.kategori !== undefined) updates.kategori = body.kategori;
    if (tahminiSureDakika !== undefined || body.tahmini_sure_dakika !== undefined) {
      updates.tahmini_sure_dakika = tahminiSureDakika ?? body.tahmini_sure_dakika;
    }
    if (body.fiyat !== undefined) updates.fiyat = body.fiyat;
    if (body.aktif !== undefined) updates.aktif = body.aktif;
    if (body.aciklama !== undefined) updates.aciklama = body.aciklama;
    if (body.gorsel_url !== undefined || body.gorselUrl !== undefined) {
      updates.gorsel_url = body.gorsel_url ?? body.gorselUrl ?? null;
    }
    if (body.detay !== undefined) updates.detay = body.detay;
    if (body.sira !== undefined) updates.sira = body.sira;

    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Hizmet güncellenemedi.", 500, error);
    }

    await recordAuditLog({
      action: "service.update",
      entityType: "services",
      entityId: id,
      metadata: updates as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
