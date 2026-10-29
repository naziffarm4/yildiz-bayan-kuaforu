export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";
import { AppointmentStatusSchema, type AppointmentStatus } from "@yildiz/types";

const AdminAppointmentPatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  durum: AppointmentStatusSchema.optional(),
  calisan_idleri: z.array(z.string().trim().min(1)).optional(),
  calisanIdleri: z.array(z.string().trim().min(1)).optional(),
  toplam_sure_dakika: z.coerce.number().int().positive().max(720).optional(),
  toplamSureDakika: z.coerce.number().int().positive().max(720).optional(),
  notlar: z.string().max(500).nullable().optional(),
});

export const GET = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const url = new URL(request.url || "http://localhost/api/admin/appointments");
    const rawLimit = Number(url.searchParams.get("limit") ?? 200);
    const rawOffset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.trunc(rawLimit), 500) : 200;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.trunc(rawOffset) : 0;
    const durumParam = url.searchParams.get("durum")?.trim();
    const fromParam = url.searchParams.get("from")?.trim();
    const toParam = url.searchParams.get("to")?.trim();

    let query = supabase
      .from("appointments")
      .select("*")
      .order("tarih_saat", { ascending: false });

    const dynamicQuery = query as unknown as {
      eq?: (col: string, val: string) => typeof query;
      gte?: (col: string, val: string) => typeof query;
      lte?: (col: string, val: string) => typeof query;
      range?: (from: number, to: number) => typeof query;
    };

    if (durumParam && AppointmentStatusSchema.safeParse(durumParam).success && typeof dynamicQuery.eq === "function") {
      query = dynamicQuery.eq("durum", durumParam);
    }
    if (fromParam && typeof dynamicQuery.gte === "function") {
      query = dynamicQuery.gte("tarih_saat", fromParam);
    }
    if (toParam && typeof dynamicQuery.lte === "function") {
      query = dynamicQuery.lte("tarih_saat", toParam);
    }
    if (typeof (query as unknown as { range?: unknown }).range === "function") {
      query = (query as unknown as { range: (from: number, to: number) => typeof query }).range(
        offset,
        offset + limit - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      return safeErrorResponse("Randevular getirilemedi.", 500, error);
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

export const PATCH = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminAppointmentPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const {
      id,
      durum,
      calisan_idleri,
      calisanIdleri,
      toplam_sure_dakika,
      toplamSureDakika,
      notlar,
    } = parsed.data;

    let actorId: string | null = null;
    try {
      const authClient = await createClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();
      actorId = user?.id ?? null;
    } catch {
      actorId = null;
    }

    const updates: {
      durum?: AppointmentStatus;
      onaylayan_id?: string | null;
      calisan_idleri?: string[];
      toplam_sure_dakika?: number;
      notlar?: string | null;
    } = {};

    if (durum) {
      updates.durum = durum;

      // G-09: onaylayan_id istemciden alınmaz; oturumdaki kullanıcının kimliğinden atanır
      if (durum === "Onaylandı") {
        updates.onaylayan_id = actorId;
      }
    }

    const resolvedStaffIds = calisan_idleri ?? calisanIdleri;
    if (resolvedStaffIds !== undefined) {
      updates.calisan_idleri = resolvedStaffIds;
    }

    const resolvedDuration = toplam_sure_dakika ?? toplamSureDakika;
    if (resolvedDuration !== undefined) {
      updates.toplam_sure_dakika = resolvedDuration;
    }

    if (notlar !== undefined) {
      updates.notlar = notlar;
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return safeErrorResponse("Randevu güncellenemedi.", 500, error);
    }

    await recordAuditLog({
      actorId,
      action: "appointment.update",
      entityType: "appointments",
      entityId: id,
      metadata: updates,
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

    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      return safeErrorResponse("Randevu silinemedi.", 500, error);
    }

    await recordAuditLog({
      action: "appointment.delete",
      entityType: "appointments",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
