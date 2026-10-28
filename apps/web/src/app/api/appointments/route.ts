export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import { generateSafeUUID } from "@yildiz/types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const musteriAdSoyad = (body.musteri_ad_soyad || body.musteriAdSoyad || "").trim();
    const musteriTelefon = (body.musteri_telefon || body.musteriTelefon || "").trim();
    const hizmetIdleri = body.hizmet_idleri || body.hizmetIdleri;
    const tarihSaat = body.tarih_saat || body.tarihSaat;
    const toplamSureDakika = Number(body.toplam_sure_dakika || body.toplamSureDakika) || 30;
    const notlar = (body.notlar || body.not || "").trim() || null;

    if (!musteriAdSoyad) {
      return NextResponse.json(
        { success: false, error: "Müşteri adı ve soyadı zorunludur." },
        { status: 400 }
      );
    }

    if (!musteriTelefon) {
      return NextResponse.json(
        { success: false, error: "Müşteri telefon numarası zorunludur." },
        { status: 400 }
      );
    }

    if (!Array.isArray(hizmetIdleri) || hizmetIdleri.length === 0) {
      return NextResponse.json(
        { success: false, error: "En az bir hizmet seçilmelidir." },
        { status: 400 }
      );
    }

    if (!tarihSaat) {
      return NextResponse.json(
        { success: false, error: "Randevu tarihi ve saati seçilmelidir." },
        { status: 400 }
      );
    }

    const formattedPhone = normalizePhoneNumber(musteriTelefon);
    const cleanDigits = musteriTelefon.replace(/\D/g, "");

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
    } catch {
      // Oturum yok, misafir akışına devam edilir
    }

    // 2. Oturum yoksa: profiles tablosunda telefon ile kayıtlı profil ara
    if (!musteriId) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, ad, soyad")
        .or(`telefon.eq.${formattedPhone},telefon.eq.${cleanDigits},telefon.eq.${musteriTelefon}`)
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
          telefon: formattedPhone || musteriTelefon,
          rol: "Musteri",
          toplam_puan: 0,
          sms_dogrulandi: true,
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
        musteri_telefon: formattedPhone || musteriTelefon,
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
