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

interface WorkingHoursCheck {
  valid: boolean;
  error?: string;
}

function checkBusinessHours(
  apptDate: Date,
  calismaSaatleri: Record<string, unknown>
): WorkingHoursCheck {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(apptDate);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const apptMinutes = hour * 60 + minute;

  let dayKeyCandidates: string[] = [];
  let dayNameTr = "Seçilen gün";

  if (weekday === "Sun") {
    dayKeyCandidates = ["pazar", "Pazar", "sunday", "Sunday"];
    dayNameTr = "Pazar";
  } else if (weekday === "Sat") {
    dayKeyCandidates = ["cumartesi", "Cumartesi", "saturday", "Saturday"];
    dayNameTr = "Cumartesi";
  } else {
    dayKeyCandidates = [
      "hafta_ici",
      "haftaIci",
      "haftaici",
      "weekday",
      "pazartesi",
      "sali",
      "carsamba",
      "persembe",
      "cuma",
    ];
    dayNameTr = "Hafta içi";
  }

  let scheduleStr: string | null = null;
  for (const key of dayKeyCandidates) {
    const val = calismaSaatleri[key];
    if (typeof val === "string" && val.trim().length > 0) {
      scheduleStr = val.trim();
      break;
    }
  }

  if (!scheduleStr) {
    if (weekday === "Sun") scheduleStr = "10:00 - 18:00";
    else if (weekday === "Sat") scheduleStr = "09:00 - 20:30";
    else scheduleStr = "09:00 - 20:00";
  }

  if (/kapalı|kapali|closed/i.test(scheduleStr)) {
    return {
      valid: false,
      error: `Salonumuz ${dayNameTr} günleri hizmet vermemektedir (Kapalı).`,
    };
  }

  const match = scheduleStr.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    return { valid: true };
  }

  const openMinutes = Number(match[1]) * 60 + Number(match[2]);
  const closeMinutes = Number(match[3]) * 60 + Number(match[4]);

  if (apptMinutes < openMinutes || apptMinutes >= closeMinutes) {
    const openFormatted = `${match[1]?.padStart(2, "0")}:${match[2]}`;
    const closeFormatted = `${match[3]?.padStart(2, "0")}:${match[4]}`;
    return {
      valid: false,
      error: `Randevu saati çalışma saatleri dışındadır. ${dayNameTr} çalışma saatlerimiz: ${openFormatted} - ${closeFormatted}`,
    };
  }

  return { valid: true };
}

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

    // 1. Geçmiş Tarih Kontrolü (O9)
    const apptDate = new Date(tarihSaat);
    if (isNaN(apptDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir tarih ve saat formatı giriniz." },
        { status: 400 }
      );
    }
    if (apptDate.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Geçmiş tarihe randevu alınamaz." },
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

    // 2. Çalışma Saatleri & Kapalı Günler Kontrolü (O9)
    let rawCalismaSaatleri: Record<string, unknown> | null = null;
    try {
      const { data: settingsData } = await supabaseAdmin
        .from("site_settings")
        .select("calisma_saatleri")
        .limit(1)
        .maybeSingle();

      if (
        settingsData?.calisma_saatleri &&
        typeof settingsData.calisma_saatleri === "object"
      ) {
        rawCalismaSaatleri = settingsData.calisma_saatleri as Record<string, unknown>;
      }
    } catch {
      // Ayarlar tablosu okunamazsa varsayılan SALON_INFO kullanılır
    }

    const businessHoursCheck = checkBusinessHours(
      apptDate,
      rawCalismaSaatleri ?? (SALON_INFO.calismaSaatleri as unknown as Record<string, unknown>)
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
    } catch {
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

    // 3. Müşteri Profili Çözümlemesi (G-06: Oturumsuz istekte başkasının profiline telefonla bağlama yapılmaz)
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
        kvkk_onay_tarihi: new Date().toISOString(),
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
