export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import { generateSafeUUID } from "@yildiz/types";

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
  })
  .passthrough();

const NormalizedAppointmentSchema = z.object({
  musteriAdSoyad: z.string().trim().min(1, "Müşteri adı ve soyadı zorunludur."),
  musteriTelefon: z
    .string()
    .trim()
    .min(1, "Müşteri telefon numarası zorunludur.")
    .regex(
      /^[0-9+\s()-]+$/,
      "Geçersiz telefon numarası formatı."
    )
    .refine(
      (val) => val.replace(/\D/g, "").length >= 10 && val.replace(/\D/g, "").length <= 15,
      "Geçerli bir telefon numarası giriniz."
    ),
  hizmetIdleri: z
    .array(z.string().trim().min(1))
    .min(1, "En az bir hizmet seçilmelidir."),
  tarihSaat: z.string().trim().min(1, "Randevu tarihi ve saati seçilmelidir."),
  toplamSureDakika: z.number().int().positive().default(30),
  notlar: z.string().nullable(),
});

export async function POST(request: Request) {
  try {
    const rawJson: unknown = await request.json().catch(() => ({}));
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
      toplamSureDakika: Number.isFinite(rawDuration) && rawDuration > 0 ? Math.trunc(rawDuration) : 30,
      notlar: (body.notlar ?? body.not ?? "")?.trim() || null,
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
      toplamSureDakika,
      notlar,
    } = validated.data;

    const formattedPhone = normalizePhoneNumber(musteriTelefon);
    const cleanDigits = musteriTelefon.replace(/\D/g, "");
    const validPhoneCandidates = Array.from(
      new Set(
        [formattedPhone, cleanDigits, musteriTelefon].filter(
          (candidate): candidate is string =>
            Boolean(candidate && /^[0-9+\s()-]{10,20}$/.test(candidate))
        )
      )
    );

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Veritabanı bağlantısı kurulamadı." },
        { status: 500 }
      );
    }

    // Müşteri Profili Çözümlemesi (Şartname Bölüm 3 & 4)
    let musteriId: string | null = null;

    // 1. İsteği yapan kullanıcının oturumu varsa
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

    // 2. Oturum yoksa: profiles tablosunda telefon ile kayıtlı profil ara
    if (!musteriId && validPhoneCandidates.length > 0) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, ad, soyad")
        .in("telefon", validPhoneCandidates)
        .limit(1)
        .maybeSingle();

      if (existingProfile?.id) {
        musteriId = existingProfile.id;
      }
    }

    // 3. Profil yoksa: profiles tablosuna yeni müşteri profili ekle
    if (!musteriId) {
      const nameParts = musteriAdSoyad.split(" ");
      const ad = nameParts[0] || musteriAdSoyad;
      const soyad = nameParts.slice(1).join(" ") || "";
      const newProfileId = generateSafeUUID();

      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: newProfileId,
          ad,
          soyad,
          telefon: formattedPhone || cleanDigits,
          rol: "Musteri",
          toplam_puan: 0,
          sms_dogrulandi: false,
        })
        .select("id")
        .single();

      if (profileError || !newProfile) {
        console.warn(
          "Misafir müşteri profili eklenirken hata oluştu veya profil dönmedi, musteri_id = null olarak devam ediliyor:",
          profileError?.message || "Profil bulunamadı"
        );
        musteriId = null;
      } else {
        musteriId = newProfile.id;
      }
    }

    // appointments tablosuna randevuyu kaydet
    const appointmentId = generateSafeUUID();
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .insert({
        id: appointmentId,
        musteri_id: musteriId || null,
        musteri_ad_soyad: musteriAdSoyad,
        musteri_telefon: formattedPhone || cleanDigits,
        hizmet_idleri: hizmetIdleri,
        calisan_idleri: [],
        tarih_saat: tarihSaat,
        toplam_sure_dakika: toplamSureDakika,
        durum: "Beklemede",
        kaynak: "Web",
        notlar,
      })
      .select("*")
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        {
          success: false,
          error: `Randevu kaydedilemedi: ${appointmentError?.message || "Bilinmeyen hata"}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
