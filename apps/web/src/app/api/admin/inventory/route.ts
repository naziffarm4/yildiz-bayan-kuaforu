export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";
import type { Database } from "@yildiz/types";

const AdminInventoryPostSchema = z
  .object({
    urun_adi: z.string().trim().min(1).max(150).optional(),
    urunAdi: z.string().trim().min(1).max(150).optional(),
    kategori: z.string({ required_error: "Kategori zorunludur." }).trim().min(1).max(100),
    miktar: z.coerce.number().int().nonnegative("Stok miktarı negatif olamaz.").default(0),
    birim: z.string({ required_error: "Birim zorunludur." }).trim().min(1).max(50),
    kritik_seviye: z.coerce.number().int().nonnegative("Kritik seviye negatif olamaz.").optional(),
    kritikSeviye: z.coerce.number().int().nonnegative("Kritik seviye negatif olamaz.").optional(),
    supplier_id: z.string().trim().min(1).nullable().optional(),
    supplierId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Boolean(data.urun_adi || data.urunAdi), {
    message: "Ürün adı zorunludur.",
  });

const AdminInventoryPatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  urun_adi: z.string().trim().min(1).max(150).optional(),
  urunAdi: z.string().trim().min(1).max(150).optional(),
  kategori: z.string().trim().min(1).max(100).optional(),
  birim: z.string().trim().min(1).max(50).optional(),
  miktar: z.coerce.number().int().nonnegative("Stok miktarı negatif olamaz.").optional(),
  kritik_seviye: z.coerce.number().int().nonnegative("Kritik seviye negatif olamaz.").optional(),
  kritikSeviye: z.coerce.number().int().nonnegative("Kritik seviye negatif olamaz.").optional(),
  supplier_id: z.string().trim().min(1).nullable().optional(),
  supplierId: z.string().trim().min(1).nullable().optional(),
});

export const GET = withStaffOrAdminAuth(async () => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const { data, error } = await supabase
      .from("inventory")
      .select("*, suppliers(firma_adi)")
      .order("urun_adi", { ascending: true });

    if (error) {
      return safeErrorResponse("Stok listesi getirilemedi.", 500, error);
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

    const parsed = await parseJsonBody(request, AdminInventoryPostSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { data, error } = await supabase
      .from("inventory")
      .insert({
        urun_adi: (body.urun_adi ?? body.urunAdi)!,
        kategori: body.kategori,
        miktar: body.miktar,
        birim: body.birim,
        kritik_seviye: body.kritik_seviye ?? body.kritikSeviye ?? 5,
        supplier_id: body.supplier_id ?? body.supplierId ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Stok ürünü eklenemedi.", 500, error);
    }

    await recordAuditLog({
      action: "inventory.create",
      entityType: "inventory",
      entityId: data?.id ?? null,
      metadata: {
        urun_adi: body.urun_adi ?? body.urunAdi,
        kategori: body.kategori,
        miktar: body.miktar,
      },
    });

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

    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) {
      return safeErrorResponse("Stok ürünü silinemedi.", 500, error);
    }

    await recordAuditLog({
      action: "inventory.delete",
      entityType: "inventory",
      entityId: id,
    });

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

    const parsed = await parseJsonBody(request, AdminInventoryPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { id, kritikSeviye } = body;

    const updates: Database["public"]["Tables"]["inventory"]["Update"] = {};
    if (body.urun_adi !== undefined || body.urunAdi !== undefined) {
      updates.urun_adi = body.urun_adi ?? body.urunAdi;
    }
    if (body.kategori !== undefined) updates.kategori = body.kategori;
    if (body.birim !== undefined) updates.birim = body.birim;
    if (body.miktar !== undefined) updates.miktar = body.miktar;
    if (kritikSeviye !== undefined || body.kritik_seviye !== undefined) {
      updates.kritik_seviye = kritikSeviye ?? body.kritik_seviye;
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
      return safeErrorResponse("Stok ürünü güncellenemedi.", 500, error);
    }

    await recordAuditLog({
      action: "inventory.update",
      entityType: "inventory",
      entityId: id,
      metadata: updates as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
