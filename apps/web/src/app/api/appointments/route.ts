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
import {
  checkIstanbulBusinessHours,
  generateSafeUUID,
  type FlexibleSpecialDay,
} from "@yildiz/types";
import { SALON_INFO } from "@/lib/site-defaults";

const RawAppointmentBodySchema = z
  .object({
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
  })
  .strict();

const NormalizedAppointmentSchema = z
  .object({
    musteriAdSoyad: z
      .string()
      .trim()
      .min(1, "Müşteri adı ve soyadı zorunludur.")
      .max(80, "Müşteri adı ve soyadı en fazla 80 karakter olabilir."),
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
    tarihSaat: z
      .string()
      .trim()
      .min(1, "Randevu tarihi ve saati seçilmelidir.")
      .refine(
        (val) => !isNaN(Date.parse(val)) && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(val),
        "Geçerli bir tarih ve saat formatı giriniz."
      ),
    toplamSureDakika: z.number().int().positive().default(30),
    notlar: z.string().max(500, "Not alanı en fazla 500 karakter olabilir.").nullable(),
    kvkkOnay: z.literal(true, {
      errorMap: () => ({ message: "KVKK aydınlatma metnini onaylamanız zorunludur." }),
    }),
  })
  .strict();

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
      notlar,
    } = validated.data;

    // 1. Saat Dilimi Normalizasyonu (Y1) & Geçmiş / İleri Tarih Kontrolü (O9, O-6)
    const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(tarihSaat);
    const isoCandidate = hasOffset ? tarihSaat : `${tarihSaat}+03:00`;
    const apptDate = new Date(isoCandidate);
    if (isNaN(apptDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir tarih ve saat formatı giriniz." },
        { status: 400 }
      );
    }
    const normalizedIso = apptDate.toISOString();

    if (apptDate.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Geçmiş tarihe randevu alınamaz." },
        { status: 400 }
      );
    }
    if (apptDate.getTime() > Date.now() + 60 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: "En fazla 60 gün sonrasına randevu alınabilir." },
        { status: 400 }
      );
    }

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

    // 2. Çalışma Saatleri & Özel Günler Kontrolü (O9, O-6)
    let rawCalismaSaatleri: Record<string, unknown> | null = null;
    let extraSpecialDays: FlexibleSpecialDay[] | undefined;
    try {
      const { data: settingsData } = await supabaseAdmin
        .from("site_settings")
        .select("calisma_saatleri, sayfa_metinleri")
        .limit(1)
        .maybeSingle();

      if (
        settingsData?.calisma_saatleri &&
        typeof settingsData.calisma_saatleri === "object"
      ) {
        rawCalismaSaatleri = settingsData.calisma_saatleri as Record<string, unknown>;
      }
      if (
        settingsData?.sayfa_metinleri &&
        typeof settingsData.sayfa_metinleri === "object"
      ) {
        const textsObj = settingsData.sayfa_metinleri as Record<string, unknown>;
        if (Array.isArray(textsObj.specialDays)) {
          extraSpecialDays = textsObj.specialDays as FlexibleSpecialDay[];
        }
      }
    } catch (settingsErr: unknown) {
      console.warn("Ayarlar tablosu okunamadı, varsayılan çalışma saatleri kullanılıyor:", settingsErr);
    }

    const businessHoursCheck = checkIstanbulBusinessHours(
      apptDate,
      rawCalismaSaatleri ?? (SALON_INFO.calismaSaatleri as unknown as Record<string, unknown>),
      extraSpecialDays
    );
    if (!businessHoursCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: businessHoursCheck.error || "Randevu saati çalışma saatleri dışındadır.",
        },
        { status: 400 }
      );
    }

    // 3. Aktif Hizmet Doğrulaması ve Süre Hesabı (O9)
    let servicesData: { id: string; tahmini_sure_dakika: number }[] | null = null;
    try {
      const { data, error } = await supabaseAdmin
        .from("services")
        .select("id, tahmini_sure_dakika")
        .in("id", hizmetIdleri)
        .eq("aktif", true);

      if (!error && Array.isArray(data)) {
        servicesData = data as { id: string; tahmini_sure_dakika: number }[];
      }
    } catch (srvErr: unknown) {
      console.warn("Hizmetler sorgulanırken hata oluştu:", srvErr);
      servicesData = null;
    }

    if (!servicesData || servicesData.length !== hizmetIdleri.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Seçilen hizmetlerden biri veya birkaçı geçersizdir.",
        },
        { status: 400 }
      );
    }

    const totalServiceMinutes = servicesData.reduce((acc, item) => {
      const d = Number(item.tahmini_sure_dakika ?? 0);
      return acc + (Number.isFinite(d) && d > 0 ? d : 0);
    }, 0);
    const computedDuration = totalServiceMinutes > 0 ? totalServiceMinutes : 30;

    // 4. Çifte gönderim / aynı saat ve telefonda aktif randevu çakışma kontrolü
    try {
      const existingQuery = supabaseAdmin
        .from("appointments")
        .select("id, durum")
        .eq("musteri_telefon", targetPhone)
        .eq("tarih_saat", normalizedIso)
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
    } catch (dupErr: unknown) {
      console.warn("Mükerrer randevu kontrolü atlandı:", dupErr);
    }

    // 3. Müşteri Profili Çözümlemesi (Bölüm 2.8 & 4.3: Oturumsuz isteklerde telefonla profil aranmaz veya sahte/doğrulanmamış profil üretilmez; musteri_id: null kaydedilir)
    let musteriId: string | null = null;

    try {
      const serverSupabase = await createClient();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      if (user?.id) {
        musteriId = user.id;
      }
    } catch (authErr: unknown) {
      console.warn("Oturum bilgisi okunamadı, misafir akışına devam ediliyor:", authErr);
    }

    // 4. Randevuyu kaydet (K-7: yalnızca gerekli sütunları döndür)
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
        tarih_saat: normalizedIso,
        toplam_sure_dakika: computedDuration,
        durum: "Beklemede",
        kaynak: "Web",
        notlar,
        kvkk_onay_tarihi: new Date().toISOString(),
      })
      .select(
        "id, musteri_id, musteri_ad_soyad, musteri_telefon, hizmet_idleri, calisan_idleri, tarih_saat, toplam_sure_dakika, durum, kaynak, notlar, olusturulma_tarihi"
      )
      .single();

    if (appointmentError) {
      const errCode = (appointmentError as { code?: string }).code;
      if (errCode === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Bu tarih ve saat için zaten aktif bir randevu talebiniz bulunmaktadır.",
          },
          { status: 409 }
        );
      }
    }

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
