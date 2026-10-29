export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { recordAuditLog } from "@/lib/audit-log";
import type { Database, Json, PageTexts, SalonInfo } from "@yildiz/types";

async function handleGet() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase bağlantı bilgileri eksik." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Site ayarları getirilemedi: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase bağlantı bilgileri eksik." },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      salonInfo?: Partial<SalonInfo>;
      pageTexts?: Partial<PageTexts>;
      [key: string]: unknown;
    };

    const salonInfo = body.salonInfo;
    const pageTexts = body.pageTexts;

    const updateData: Database["public"]["Tables"]["site_settings"]["Update"] = {};

    if (salonInfo) {
      if (salonInfo.ad !== undefined) updateData.salon_adi = salonInfo.ad;
      if (salonInfo.slogan !== undefined) updateData.slogan = salonInfo.slogan;
      if (salonInfo.adres !== undefined) updateData.adres = salonInfo.adres;
      if (salonInfo.googleHaritaUrl !== undefined) updateData.google_maps_url = salonInfo.googleHaritaUrl;
      if (salonInfo.telefon !== undefined) updateData.telefon = salonInfo.telefon;
      if (salonInfo.whatsapp !== undefined) updateData.whatsapp = salonInfo.whatsapp;
      if (salonInfo.instagram !== undefined) updateData.instagram = salonInfo.instagram;
      if (salonInfo.tiktok !== undefined) updateData.tiktok = salonInfo.tiktok;
      if (salonInfo.facebook !== undefined) updateData.facebook = salonInfo.facebook;
      if (salonInfo.varsayilanTamponSureDakika !== undefined) {
        updateData.tampon_sure_dakika = salonInfo.varsayilanTamponSureDakika;
      }
      if (salonInfo.calismaSaatleri !== undefined) {
        updateData.calisma_saatleri = salonInfo.calismaSaatleri as unknown as Json;
      }
    }

    if (pageTexts) {
      updateData.sayfa_metinleri = pageTexts as unknown as Json;
      if (pageTexts.hero?.title) updateData.hero_baslik = pageTexts.hero.title;
      if (pageTexts.hero?.description) updateData.hero_aciklama = pageTexts.hero.description;
      if (pageTexts.about?.storyText) updateData.hakkimizda_hikaye = pageTexts.about.storyText;
    }

    if (typeof body.salon_adi === "string") updateData.salon_adi = body.salon_adi;
    if (typeof body.slogan === "string") updateData.slogan = body.slogan;
    if (typeof body.adres === "string") updateData.adres = body.adres;
    if (typeof body.google_maps_url === "string") updateData.google_maps_url = body.google_maps_url;
    if (typeof body.telefon === "string") updateData.telefon = body.telefon;
    if (typeof body.whatsapp === "string") updateData.whatsapp = body.whatsapp;
    if (typeof body.instagram === "string") updateData.instagram = body.instagram;
    if (typeof body.tiktok === "string") updateData.tiktok = body.tiktok;
    if (typeof body.facebook === "string") updateData.facebook = body.facebook;
    if (typeof body.calisma_saatleri === "object" && body.calisma_saatleri !== null) {
      updateData.calisma_saatleri = body.calisma_saatleri as Json;
    }
    if (typeof body.tampon_sure_dakika === "number") updateData.tampon_sure_dakika = body.tampon_sure_dakika;
    if (typeof body.blokaj_sure_dakika === "number") updateData.blokaj_sure_dakika = body.blokaj_sure_dakika;
    if (typeof body.hero_baslik === "string") updateData.hero_baslik = body.hero_baslik;
    if (typeof body.hero_aciklama === "string") updateData.hero_aciklama = body.hero_aciklama;
    if (typeof body.kampanya_metni === "string") updateData.kampanya_metni = body.kampanya_metni;
    if (typeof body.hakkimizda_hikaye === "string") updateData.hakkimizda_hikaye = body.hakkimizda_hikaye;
    if (typeof body.sayfa_metinleri === "object" && body.sayfa_metinleri !== null) {
      updateData.sayfa_metinleri = body.sayfa_metinleri as Json;
    }

    // 1. Mevcut kaydı bul veya ekle
    const { data: existing, error: fetchError } = await supabase
      .from("site_settings")
      .select("id, sayfa_metinleri, calisma_saatleri")
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: `Mevcut ayarlar sorgulanamadı: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (existing?.id) {
      // JSONB alanlarını derin birleştirmek için mevcut değerleri koru
      if (pageTexts && existing.sayfa_metinleri && typeof existing.sayfa_metinleri === "object") {
        updateData.sayfa_metinleri = {
          ...(existing.sayfa_metinleri as Record<string, unknown>),
          ...(pageTexts as Record<string, unknown>),
        } as unknown as Json;
      }

      const { data, error: updateError } = await supabase
        .from("site_settings")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: `Site ayarları güncellenemedi: ${updateError.message}` },
          { status: 500 }
        );
      }

      await recordAuditLog({
        action: "site_settings.update",
        entityType: "site_settings",
        entityId: existing.id,
      });

      return NextResponse.json({ success: true, data });
    } else {
      const { data, error: insertError } = await supabase
        .from("site_settings")
        .insert(updateData)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: `Site ayarları oluşturulamadı: ${insertError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withStaffOrAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);
export const PUT = withAdminAuth(handlePost);
