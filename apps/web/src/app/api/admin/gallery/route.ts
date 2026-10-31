export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";
import type { Database } from "@yildiz/types";

const AdminGalleryPostSchema = z
  .object({
    url: z.string().trim().min(1).max(500).optional(),
    gorselUrl: z.string().trim().min(1).max(500).optional(),
    baslik: z.string({ required_error: "Başlık zorunludur." }).trim().min(1).max(200),
    kategori: z.string({ required_error: "Kategori zorunludur." }).trim().min(1).max(100),
    sira: z.coerce.number().int().nonnegative().optional().default(0),
    medya_turu: z.enum(["image", "video"]).optional(),
    medyaTuru: z.enum(["image", "video"]).optional(),
    kapak_url: z.string().max(500).nullable().optional(),
    kapakUrl: z.string().max(500).nullable().optional(),
    aciklama: z.string().max(1000).nullable().optional(),
    stilist: z.string().trim().max(100).optional(),
  })
  .refine((data) => Boolean(data.url || data.gorselUrl), {
    message: "Görsel URL, başlık ve kategori alanları zorunludur.",
  });

const AdminGalleryPatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  url: z.string().trim().min(1).max(500).optional(),
  gorselUrl: z.string().trim().min(1).max(500).optional(),
  baslik: z.string().trim().min(1).max(200).optional(),
  kategori: z.string().trim().min(1).max(100).optional(),
  sira: z.coerce.number().int().nonnegative().optional(),
  medya_turu: z.enum(["image", "video"]).optional(),
  medyaTuru: z.enum(["image", "video"]).optional(),
  kapak_url: z.string().max(500).nullable().optional(),
  kapakUrl: z.string().max(500).nullable().optional(),
  aciklama: z.string().max(1000).nullable().optional(),
  stilist: z.string().trim().max(100).optional(),
});

export const GET = withStaffOrAdminAuth(async () => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const { data, error } = await supabase
      .from("gallery_items")
      .select("*, gallery_comments(count)")
      .order("sira", { ascending: true })
      .order("olusturulma_tarihi", { ascending: false });

    if (error) {
      return safeErrorResponse("Galeri öğeleri getirilemedi.", 500, error);
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

    const parsed = await parseJsonBody(request, AdminGalleryPostSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const gorselUrl = (body.url || body.gorselUrl)!;

    const { data, error } = await supabase
      .from("gallery_items")
      .insert({
        url: gorselUrl,
        baslik: body.baslik,
        kategori: body.kategori,
        sira: body.sira ?? 0,
        medya_turu: body.medya_turu ?? body.medyaTuru ?? "image",
        kapak_url: body.kapak_url ?? body.kapakUrl ?? null,
        aciklama: body.aciklama ?? null,
        stilist: body.stilist ?? "Yıldız Bayan Kuaförü",
      })
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Galeri öğesi eklenemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "gallery.create",
      entityType: "gallery_items",
      entityId: data?.id ?? null,
      metadata: { baslik: body.baslik, kategori: body.kategori },
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

    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    if (error) {
      return safeErrorResponse("Galeri öğesi silinemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "gallery.delete",
      entityType: "gallery_items",
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

    const parsed = await parseJsonBody(request, AdminGalleryPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const { id } = body;

    const updates: Database["public"]["Tables"]["gallery_items"]["Update"] = {};
    if (body.url !== undefined || body.gorselUrl !== undefined) {
      updates.url = body.url ?? body.gorselUrl;
    }
    if (body.baslik !== undefined) updates.baslik = body.baslik;
    if (body.kategori !== undefined) updates.kategori = body.kategori;
    if (body.sira !== undefined) updates.sira = body.sira;
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
      return safeErrorResponse("Galeri öğesi güncellenemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "gallery.update",
      entityType: "gallery_items",
      entityId: id,
      metadata: updates as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
