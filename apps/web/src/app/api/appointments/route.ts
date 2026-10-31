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

interface RawSpecialDayEntry {
  date?: string;
  tarih?: string;
  isClosed?: boolean;
  kapali?: boolean;
  open?: string;
  close?: string;
  ozelSaatler?: string;
}

function checkBusinessHours(
  apptDate: Date,
  calismaSaatleri: Record<string, unknown>,
  extraSpecialDays?: RawSpecialDayEntry[]
): WorkingHoursCheck {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(apptDate);
  const yyyy = parts.find((p) => p.type === "year")?.value ?? "";
  const mm = parts.find((p) => p.type === "month")?.value ?? "";
  const dd = parts.find((p) => p.type === "day")?.value ?? "";
  const istanbulDateKey = `${yyyy}-${mm}-${dd}`;
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const apptMinutes = hour * 60 + minute;

  const specialDaysList: RawSpecialDayEntry[] = [
    ...(Array.isArray(calismaSaatleri.specialDays)
      ? (calismaSaatleri.specialDays as RawSpecialDayEntry[])
      : []),
    ...(Array.isArray(extraSpecialDays) ? extraSpecialDays : []),
  ];

  const matchedSpecialDay = specialDaysList.find(
    (sd) => (sd?.date ?? sd?.tarih) === istanbulDateKey
  );

  if (matchedSpecialDay) {
    const isClosed = matchedSpecialDay.isClosed ?? matchedSpecialDay.kapali ?? false;
    if (isClosed) {
      return {
        valid: false,
        error: `Salonumuz ${istanbulDateKey} tarihinde özel gün / resmi tatil nedeniyle hizmet vermemektedir (Kapalı).`,
      };
    }

    const customRange =
      matchedSpecialDay.open && matchedSpecialDay.close
        ? `${matchedSpecialDay.open} - ${matchedSpecialDay.close}`
        : matchedSpecialDay.ozelSaatler;

    if (customRange) {
      if (/kapalı|kapali|closed/i.test(customRange)) {
        return {
          valid: false,
          error: `Salonumuz ${istanbulDateKey} tarihinde hizmet vermemektedir (Kapalı).`,
        };
      }
      const specialMatch = customRange.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
      if (specialMatch) {
        const openMinutes = Number(specialMatch[1]) * 60 + Number(specialMatch[2]);
        const closeMinutes = Number(specialMatch[3]) * 60 + Number(specialMatch[4]);
        if (apptMinutes < openMinutes || apptMinutes >= closeMinutes) {
          const openFormatted = `${specialMatch[1]?.padStart(2, "0")}:${specialMatch[2]}`;
          const closeFormatted = `${specialMatch[3]?.padStart(2, "0")}:${specialMatch[4]}`;
          return {
            valid: false,
            error: `Randevu saati özel gün çalışma saatleri dışındadır (${openFormatted} - ${closeFormatted}).`,
          };
        }
        return { valid: true };
      }
    }
  }

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
    let extraSpecialDays: RawSpecialDayEntry[] | undefined;
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
          extraSpecialDays = textsObj.specialDays as RawSpecialDayEntry[];
        }
      }
    } catch (settingsErr: unknown) {
      console.warn("Ayarlar tablosu okunamadı, varsayılan çalışma saatleri kullanılıyor:", settingsErr);
    }

    const businessHoursCheck = checkBusinessHours(
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

    // 3. Müşteri Profili Çözümlemesi (G-06 & O-4: Oturumsuz istekte doğrulanmış hesaba bağlanmaz; varsa mevcut misafir profili yeniden kullanılır)
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

    // Oturum yoksa önce aynı telefona ait doğrulanmamış misafir profilini ara, yoksa yeni oluştur (O-4)
    if (!musteriId) {
      try {
        const { data: existingGuest } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("telefon", targetPhone)
          .eq("sms_dogrulandi", false)
          .is("eposta", null)
          .maybeSingle();

        if (existingGuest?.id) {
          musteriId = existingGuest.id;
        }
      } catch (guestLookupErr: unknown) {
        console.warn("Mevcut misafir profili aranamadı:", guestLookupErr);
      }
    }

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
      } catch (profileCreateErr: unknown) {
        console.warn("Misafir profili oluşturulamadı:", profileCreateErr);
        musteriId = null;
      }
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
