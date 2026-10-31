export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";

const AdminGalleryCommentPatchSchema = z.object({
  id: z.string().uuid("Geçerli bir yorum ID'si gereklidir."),
  aktif: z.boolean({ required_error: "aktif alanı zorunludur." }),
});

export const GET = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const url = new URL(request.url);
    const galleryId = url.searchParams.get("galleryId")?.trim();

    let query = supabase
      .from("gallery_comments")
      .select("id, gallery_item_id, musteri_adi, yorum, aktif, olusturulma_tarihi")
      .order("olusturulma_tarihi", { ascending: false });

    if (galleryId) {
      query = query.eq("gallery_item_id", galleryId);
    }

    const { data, error } = await query;

    if (error) {
      return safeErrorResponse("Yorumlar getirilemedi.", 500, error);
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (err: unknown) {
    return safeErrorResponse("Yorumlar getirilemedi.", 500, err);
  }
});

export const PATCH = withAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminGalleryCommentPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const { id, aktif } = parsed.data;

    const { data, error } = await supabase
      .from("gallery_comments")
      .update({ aktif })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Yorum durumu güncellenemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "gallery_comment.moderate",
      entityType: "gallery_comments",
      entityId: id,
      metadata: { aktif },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    return safeErrorResponse("Yorum durumu güncellenemedi.", 500, err);
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
      return NextResponse.json({ error: "id parametresi gereklidir." }, { status: 400 });
    }

    const { error } = await supabase.from("gallery_comments").delete().eq("id", id);

    if (error) {
      return safeErrorResponse("Yorum silinemedi.", 500, error);
    }

    await recordAuditLog({
      request,
      action: "gallery_comment.delete",
      entityType: "gallery_comments",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Yorum başarıyla silindi.",
    });
  } catch (err: unknown) {
    return safeErrorResponse("Yorum silinemedi.", 500, err);
  }
});
