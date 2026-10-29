export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import { safeErrorResponse } from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  isDuplicateIdempotencyKey,
  recordIdempotencyKey,
} from "@/lib/rate-limit";
import { generateSafeUUID } from "@yildiz/types";

const RawAppointmentBodySchema = z.object({
  musteri_ad_soyad: z.string().optional(),
  musteriAdSoyad: z.string().optional(),
  musteri_telefon: z.string().optional(),
  musteriTelefon: z.string().optional(),
  hizmet_idleri: z.array(z.string().trim().min(1)).optional(),
  hizmetIdleri: z.array(z.string().trim().min(1)).optional(),
  tarih_saat: z.string().optional(),
  tarihSaat: z.string().optional(),
  toplam_sure_dakika: z.union([z.number(), z.string()]).optional(),
  toplamSureDakika: z.union([z.number(), z.string()]).optional(),
  notlar: z.string().nullable().optional(),
  not: z.string().nullable().optional(),
  kvkk_onay: z.boolean().optional(),
  kvkkOnay: z.boolean().optional(),
});

const NormalizedAppointmentSchema = z.object({
  musteriAdSoyad: z
    .string()
    .trim()
    .min(1, "Müşteri adı ve soyadı zorunludur.")
    .max(100, "Müşteri adı ve soyadı en fazla 100 karakter olabilir."),
  musteriTelefon: z
    .string()
    .trim()
    .min(1, "Müşteri telefon numarası zorunludur.")
    .regex(/^[0-9+\s()-]+$/, "Geçersiz telefon numarası formatı.")
    .refine(
      (val) => val.replace(/\D/g, "").length >= 10 && val.replace(/\D/g, "").length <= 15,
      "Geçerli bir telefon numarası giriniz."
    ),
  hizmetIdleri: z
    .array(z.string().trim().min(1))
    .min(1, "En az bir hizmet seçilmelidir.")
    .max(10, "En fazla 10 hizmet seçilebilir."),
  tarihSaat: z.string().trim().min(1, "Randevu tarihi ve saati seçilmelidir."),
  toplamSureDakika: z.number().int().positive().default(30),
  notlar: z.string().max(500, "Not alanı en fazla 500 karakter olabilir.").nullable(),
  kvkkOnay: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`appointments:${getClientIp(request)}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Çok fazla randevu isteği gönderildi. Lütfen biraz bekleyiniz.",
        },
        { status: 429 }
      );
    }

    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (idempotencyKey && isDuplicateIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu randevu talebi zaten işleme alındı.",
        },
        { status: 409 }
      );
    }

    const rawJson: unknown = await request.json().catch(() => null);
    if (!rawJson || typeof rawJson !== "object") {
      return NextResponse.json(
        { success: false, error: "Geçersiz randevu verisi." },
        { status: 400 }
      );
    }

    const rawParsed = RawAppointmentBodySchema.safeParse(rawJson);
    if (!rawParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: rawParsed.error.issues[0]?.message || "Geçersiz randevu verisi.",
        },
        { status: 400 }
      );
    }

    const body = rawParsed.data;
    const rawDuration = Number(body.toplam_sure_dakika ?? body.toplamSureDakika);
    const normalizedInput = {
      musteriAdSoyad: (body.musteri_ad_soyad ?? body.musteriAdSoyad ?? "").trim(),
      musteriTelefon: (body.musteri_telefon ?? body.musteriTelefon ?? "").trim(),
      hizmetIdleri: Array.isArray(body.hizmet_idleri)
        ? body.hizmet_idleri
        : Array.isArray(body.hizmetIdleri)
          ? body.hizmetIdleri
          : [],
      tarihSaat: (body.tarih_saat ?? body.tarihSaat ?? "").trim(),
      toplamSureDakika:
        Number.isFinite(rawDuration) && rawDuration > 0 ? Math.trunc(rawDuration) : 30,
      notlar: (body.notlar ?? body.not ?? "")?.trim() || null,
      kvkkOnay: body.kvkk_onay ?? body.kvkkOnay,
    };

    const validated = NormalizedAppointmentSchema.safeParse(normalizedInput);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.issues[0]?.message || "Geçersiz randevu bilgileri.",
        },
        { status: 400 }
      );
    }

    const {
      musteriAdSoyad,
      musteriTelefon,
      hizmetIdleri,
      tarihSaat,
      toplamSureDakika: fallbackDuration,
      notlar,
    } = validated.data;

    const formattedPhone = normalizePhoneNumber(musteriTelefon);
    const cleanDigits = musteriTelefon.replace(/\D/g, "");
    const targetPhone = formattedPhone || cleanDigits;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Veritabanı bağlantısı kurulamadı." },
        { status: 500 }
      );
    }

    // 1. Çifte gönderim / aynı saat ve telefonda aktif randevu çakışma kontrolü
    try {
      const existingQuery = supabaseAdmin
        .from("appointments")
        .select("id, durum")
        .eq("musteri_telefon", targetPhone)
        .eq("tarih_saat", tarihSaat)
        .in("durum", ["Beklemede", "Onaylandı"])
        .limit(1)
        .maybeSingle();

      const { data: duplicateAppt } = await existingQuery;
      if (duplicateAppt?.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Bu tarih ve saat için zaten aktif bir randevu talebiniz bulunmaktadır.",
          },
          { status: 409 }
        );
      }
    } catch {
      // Sorgu desteklenmiyorsa devam et
    }

    // 2. Hizmet sürelerini sunucuda hesapla (G-06)
    let computedDuration = fallbackDuration;
    try {
      const { data: servicesData } = await supabaseAdmin
        .from("services")
        .select("id, tahmini_sure_dakika")
        .in("id", hizmetIdleri);

      if (Array.isArray(servicesData) && servicesData.length > 0) {
        const sum = servicesData.reduce((acc, item) => {
          const d = Number(
            (item as { tahmini_sure_dakika?: unknown }).tahmini_sure_dakika ?? 0
          );
          return acc + (Number.isFinite(d) && d > 0 ? d : 0);
        }, 0);
        if (sum > 0) {
          computedDuration = sum;
        }
      }
    } catch {
      // Hizmet tablosu okunamazsa doğrulanmış fallback süreyi kullan
    }

    // 3. Müşteri Profili Çözümlemesi (G-06: Oturumsuz istekte başkasının profiline telefonla bağlama yapılmaz)
    let musteriId: string | null = null;

    try {
      const serverSupabase = createClient();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      if (user?.id) {
        musteriId = user.id;
      }
    } catch (authErr: unknown) {
      console.warn("Oturum bilgisi okunamadı, misafir akışına devam ediliyor:", authErr);
    }

    // Oturum yoksa yalnızca yeni misafir profili eklemeyi dene; mevcut hesaba telefonla bağlama yapma
    if (!musteriId) {
      const nameParts = musteriAdSoyad.split(" ");
      const ad = nameParts[0] || musteriAdSoyad;
      const soyad = nameParts.slice(1).join(" ") || "";
      const newProfileId = generateSafeUUID();

      try {
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: newProfileId,
            ad,
            soyad,
            telefon: targetPhone,
            rol: "Musteri",
            toplam_puan: 0,
            sms_dogrulandi: false,
          })
          .select("id")
          .single();

        if (!profileError && newProfile?.id) {
          musteriId = newProfile.id;
        } else {
          musteriId = null;
        }
      } catch {
        musteriId = null;
      }
    }

    // 4. Randevuyu kaydet
    const appointmentId = generateSafeUUID();
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .insert({
        id: appointmentId,
        musteri_id: musteriId || null,
        musteri_ad_soyad: musteriAdSoyad,
        musteri_telefon: targetPhone,
        hizmet_idleri: hizmetIdleri,
        calisan_idleri: [],
        tarih_saat: tarihSaat,
        toplam_sure_dakika: computedDuration,
        durum: "Beklemede",
        kaynak: "Web",
        notlar,
      })
      .select("*")
      .single();

    if (appointmentError || !appointment) {
      return safeErrorResponse(
        "Randevu kaydedilemedi, lütfen bilgilerinizi kontrol edip tekrar deneyiniz.",
        500,
        appointmentError
      );
    }

    if (idempotencyKey) {
      recordIdempotencyKey(idempotencyKey);
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (err: unknown) {
    return safeErrorResponse(
      "Randevu işlemi sırasında beklenmedik bir hata oluştu.",
      500,
      err
    );
  }
}
