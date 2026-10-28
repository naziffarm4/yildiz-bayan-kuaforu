export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isPendingAppointmentExpired, type SpecialDay } from "@yildiz/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SALON_INFO, DEFAULT_SPECIAL_DAYS } from "@/lib/site-defaults";

function normalizeWorkingHours(raw: unknown): Record<string, string> {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      haftaIci:
        typeof obj.haftaIci === "string"
          ? obj.haftaIci
          : typeof obj.hafta_ici === "string"
          ? obj.hafta_ici
          : SALON_INFO.calismaSaatleri.haftaIci,
      cumartesi:
        typeof obj.cumartesi === "string"
          ? obj.cumartesi
          : SALON_INFO.calismaSaatleri.cumartesi,
      pazar:
        typeof obj.pazar === "string" ? obj.pazar : SALON_INFO.calismaSaatleri.pazar,
    };
  }
  return {
    haftaIci: SALON_INFO.calismaSaatleri.haftaIci,
    cumartesi: SALON_INFO.calismaSaatleri.cumartesi,
    pazar: SALON_INFO.calismaSaatleri.pazar,
  };
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (!cronSecret) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası: CRON_SECRET tanımlı değil." },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Geçersiz cron anahtarı." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin bağlantısı yapılandırılmamış." },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const nowIso = url.searchParams.get("now") || new Date().toISOString();

    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("blokaj_sure_dakika, tampon_sure_dakika, calisma_saatleri")
      .limit(1)
      .maybeSingle();

    const timeoutMinutes =
      settingsRow?.blokaj_sure_dakika ?? settingsRow?.tampon_sure_dakika ?? 30;
    const workingHours = normalizeWorkingHours(settingsRow?.calisma_saatleri);
    const specialDays: SpecialDay[] = DEFAULT_SPECIAL_DAYS;

    const { data: pendingRows, error: fetchError } = await supabase
      .from("appointments")
      .select("id, durum, olusturulma_tarihi")
      .eq("durum", "Beklemede");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const expiredIds = (pendingRows ?? [])
      .filter((row) =>
        isPendingAppointmentExpired(
          row.olusturulma_tarihi,
          nowIso,
          timeoutMinutes,
          workingHours,
          specialDays,
        ),
      )
      .map((row) => row.id);

    if (expiredIds.length > 0) {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ durum: "Süresi Doldu" })
        .in("id", expiredIds);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      cron: true,
      timestamp: nowIso,
      checkedCount: pendingRows?.length ?? 0,
      expiredCount: expiredIds.length,
      expiredIds,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Bekleyen randevu süre dolumu kontrol hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
