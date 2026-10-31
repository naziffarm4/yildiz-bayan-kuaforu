export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
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
  musteriId: z.string().trim().min(1).nullable().optional(),
  musteri_ad_soyad: z.string().trim().min(1).max(80).optional(),
  musteriAdSoyad: z.string().trim().min(1).max(80).optional(),
  musteri_telefon: z.string().trim().min(1).max(30).optional(),
  musteriTelefon: z.string().trim().min(1).max(30).optional(),
  hizmet_idleri: z.array(z.string().trim().min(1)).optional(),
  hizmetIdleri: z.array(z.string().trim().min(1)).optional(),
  calisan_idleri: z.array(z.string().trim().min(1)).optional(),
  calisanIdleri: z.array(z.string().trim().min(1)).optional(),
  tarih_saat: z.string().trim().min(1).optional(),
  tarihSaat: z.string().trim().min(1).optional(),
  toplam_sure_dakika: z.coerce.number().int().positive().max(720).optional(),
  toplamSureDakika: z.coerce.number().int().positive().max(720).optional(),
  durum: AppointmentStatusSchema.optional(),
  kaynak: AppointmentSourceSchema.optional(),
  notlar: z.string().max(500).nullable().optional(),
  not: z.string().max(500).nullable().optional(),
});

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
    const musteriAdSoyad = (body.musteri_ad_soyad ?? body.musteriAdSoyad ?? "").trim();
    const musteriTelefon = (body.musteri_telefon ?? body.musteriTelefon ?? "").trim();
    const hizmetIdleri = body.hizmet_idleri ?? body.hizmetIdleri ?? [];
    const calisanIdleri = body.calisan_idleri ?? body.calisanIdleri ?? [];
    const rawTarihSaat = (body.tarih_saat ?? body.tarihSaat ?? "").trim();
    const toplamSureDakika = body.toplam_sure_dakika ?? body.toplamSureDakika ?? 30;
    const durum: AppointmentStatus = body.durum ?? "Onaylandı";
    const kaynak: AppointmentSource = body.kaynak ?? "Telefon";
    const notlar = body.notlar ?? body.not ?? null;
    const musteriId = body.musteri_id ?? body.musteriId ?? null;

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
      actorId,
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
