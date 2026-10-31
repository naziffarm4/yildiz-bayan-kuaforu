export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";
import type { Database } from "@yildiz/types";

const AdminReviewPostSchema = z.object({
  musteri_adi: z.string({ required_error: "Müşteri adı zorunludur." }).trim().min(1).max(100),
  yorum: z.string().trim().max(1000).optional().default(""),
  puan: z.coerce.number().int().min(1).max(5).optional().default(5),
  hizmet_turu: z.string().trim().max(100).optional().default("Genel Deneyim"),
  google_review_url: z.string().trim().max(500).nullable().optional(),
  aktif: z.boolean().optional().default(true),
});

const AdminReviewPatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  musteri_adi: z.string().trim().min(1).max(100).optional(),
  yorum: z.string().trim().max(1000).nullable().optional(),
  puan: z.coerce.number().int().min(1).max(5).optional(),
  hizmet_turu: z.string().trim().max(100).optional(),
  google_review_url: z.string().trim().max(500).nullable().optional(),
  aktif: z.boolean().optional(),
});

export const GET = withStaffOrAdminAuth(async (request?: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const url = new URL(request?.url || "http://localhost/api/admin/reviews");
    const rawLimit = Number(url.searchParams.get("limit") ?? 200);
    const rawOffset = Number(url.searchParams.get("offset") ?? 0);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.trunc(rawLimit), 500)
        : 200;
    const offset =
      Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.trunc(rawOffset) : 0;

    let query = supabase
      .from("customer_reviews")
      .select("*")
      .order("olusturulma_tarihi", { ascending: false });

    const dynamicQuery = query as unknown as {
      range?: (from: number, to: number) => typeof query;
    };
    if (typeof dynamicQuery.range === "function") {
      query = dynamicQuery.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      return safeErrorResponse("Yorumlar getirilemedi.", 500, error);
    }

    const rows = data ?? [];
    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        limit,
        offset,
        count: rows.length,
      },
    });
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

    const parsed = await parseJsonBody(request, AdminReviewPostSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { data, error } = await supabase
      .from("customer_reviews")
      .insert({
        musteri_adi: body.musteri_adi,
        yorum: body.yorum || "",
        puan: body.puan ?? 5,
        hizmet_turu: body.hizmet_turu || "Genel Deneyim",
        google_review_url: body.google_review_url || null,
        aktif: body.aktif ?? true,
      })
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Yorum eklenemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "review.create",
      entityType: "customer_reviews",
      entityId: data?.id ?? null,
      metadata: { musteri_adi: body.musteri_adi, puan: body.puan ?? 5 },
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

    const { error } = await supabase.from("customer_reviews").delete().eq("id", id);
    if (error) {
      return safeErrorResponse("Yorum silinemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "review.delete",
      entityType: "customer_reviews",
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

    const parsed = await parseJsonBody(request, AdminReviewPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const { id, ...rest } = parsed.data;
    const updates: Database["public"]["Tables"]["customer_reviews"]["Update"] = {};
    if (rest.musteri_adi !== undefined) updates.musteri_adi = rest.musteri_adi;
    if (rest.yorum !== undefined) updates.yorum = rest.yorum;
    if (rest.puan !== undefined) updates.puan = rest.puan;
    if (rest.hizmet_turu !== undefined) updates.hizmet_turu = rest.hizmet_turu;
    if (rest.google_review_url !== undefined) updates.google_review_url = rest.google_review_url;
    if (rest.aktif !== undefined) updates.aktif = rest.aktif;

    const { data, error } = await supabase
      .from("customer_reviews")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Yorum güncellenemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "review.update",
      entityType: "customer_reviews",
      entityId: id,
      metadata: updates as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
