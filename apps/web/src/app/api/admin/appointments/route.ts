export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getRequestAuthContext,
  withAdminAuth,
  withStaffOrAdminAuth,
} from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";
import {
  AppointmentSourceSchema,
  AppointmentStatusSchema,
  generateSafeUUID,
  type AppointmentSource,
  type AppointmentStatus,
} from "@yildiz/types";

const AdminAppointmentCreateSchema = z.object({
  id: z.string().trim().min(1).optional(),
  musteri_id: z.string().trim().min(1).nullable().optional(),
  musteri_ad_soyad: z.string().trim().min(1).max(80).optional(),
  musteri_telefon: z.string().trim().min(1).max(30).optional(),
  hizmet_idleri: z.array(z.string().trim().min(1)).optional(),
  calisan_idleri: z.array(z.string().trim().min(1)).optional(),
  tarih_saat: z.string().trim().min(1).optional(),
  toplam_sure_dakika: z.coerce.number().int().positive().max(720).optional(),
  durum: AppointmentStatusSchema.optional(),
  kaynak: AppointmentSourceSchema.optional(),
  notlar: z.string().max(500).nullable().optional(),
});

const AdminAppointmentPatchSchema = z.object({
  id: z
    .string({ required_error: "ID parametresi gereklidir." })
    .trim()
    .min(1, "ID parametresi gereklidir."),
  durum: AppointmentStatusSchema.optional(),
  calisan_idleri: z.array(z.string().trim().min(1)).optional(),
  toplam_sure_dakika: z.coerce.number().int().positive().max(720).optional(),
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

    const parsedStatus = durumParam ? AppointmentStatusSchema.safeParse(durumParam) : null;
    if (parsedStatus?.success) {
      query = query.eq("durum", parsedStatus.data);
    }
    if (fromParam) {
      query = query.gte("tarih_saat", fromParam);
    }
    if (toParam) {
      query = query.lte("tarih_saat", toParam);
    }
    query = query.range(offset, offset + limit - 1);

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

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminAppointmentCreateSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const musteriAdSoyad = (body.musteri_ad_soyad ?? "").trim();
    const musteriTelefon = (body.musteri_telefon ?? "").trim();
    const hizmetIdleri = body.hizmet_idleri ?? [];
    const calisanIdleri = body.calisan_idleri ?? [];
    const rawTarihSaat = (body.tarih_saat ?? "").trim();
    const toplamSureDakika = body.toplam_sure_dakika ?? 30;
    const durum: AppointmentStatus = body.durum ?? "Onaylandı";
    const kaynak: AppointmentSource = body.kaynak ?? "Telefon";
    const notlar = body.notlar ?? null;
    const musteriId = body.musteri_id ?? null;

    if (!musteriAdSoyad || !musteriTelefon || hizmetIdleri.length === 0 || !rawTarihSaat) {
      return NextResponse.json(
        { error: "Müşteri adı, telefon, en az bir hizmet ve tarih/saat zorunludur." },
        { status: 400 }
      );
    }

    const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(rawTarihSaat);
    const parsedDate = new Date(hasOffset ? rawTarihSaat : `${rawTarihSaat}+03:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Geçersiz tarih ve saat formatı." }, { status: 400 });
    }

    const authCtx = getRequestAuthContext(request);
    const actorId = authCtx?.userId ?? null;

    const insertPayload = {
      id: body.id || generateSafeUUID(),
      musteri_id: musteriId,
      musteri_ad_soyad: musteriAdSoyad,
      musteri_telefon: musteriTelefon,
      hizmet_idleri: hizmetIdleri,
      calisan_idleri: calisanIdleri,
      tarih_saat: parsedDate.toISOString(),
      toplam_sure_dakika: toplamSureDakika,
      durum,
      kaynak,
      notlar,
      onaylayan_id: durum === "Onaylandı" ? actorId : null,
    };

    const { data, error } = await supabase
      .from("appointments")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      return safeErrorResponse("Randevu oluşturulamadı.", 500, error);
    }

    await recordAuditLog({
      request,
      actorId,
      actorRole: authCtx?.role ?? null,
      ipAddress: authCtx?.ipAddress ?? null,
      action: "appointment.create",
      entityType: "appointments",
      entityId: data.id,
      metadata: {
        musteri_telefon: musteriTelefon,
        tarih_saat: insertPayload.tarih_saat,
        durum,
        kaynak,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
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
      toplam_sure_dakika,
      notlar,
    } = parsed.data;

    const authCtx = getRequestAuthContext(request);
    const actorId = authCtx?.userId ?? null;

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

    if (calisan_idleri !== undefined) {
      updates.calisan_idleri = calisan_idleri;
    }

    if (toplam_sure_dakika !== undefined) {
      updates.toplam_sure_dakika = toplam_sure_dakika;
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
      request,
      actorId,
      actorRole: authCtx?.role ?? null,
      ipAddress: authCtx?.ipAddress ?? null,
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
      request,
      action: "appointment.delete",
      entityType: "appointments",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
