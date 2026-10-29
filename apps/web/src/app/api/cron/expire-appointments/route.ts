export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isPendingAppointmentExpired, type SpecialDay } from "@yildiz/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyCronRequest } from "@/lib/auth/cron-auth";
import { safeErrorResponse } from "@/lib/api-utils";
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

function extractSpecialDays(rawTexts: unknown): SpecialDay[] {
  if (typeof rawTexts === "object" && rawTexts !== null) {
    const obj = rawTexts as Record<string, unknown>;
    if (Array.isArray(obj.specialDays)) {
      return obj.specialDays as SpecialDay[];
    }
  }
  return DEFAULT_SPECIAL_DAYS;
}

export async function GET(request: Request) {
  try {
    const auth = verifyCronRequest(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase admin bağlantısı yapılandırılmamış.", 500);
    }

    const url = new URL(request.url);
    const queryNow =
      process.env.NODE_ENV !== "production" ? url.searchParams.get("now") : null;
    const nowIso = queryNow || new Date().toISOString();

    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("blokaj_sure_dakika, tampon_sure_dakika, calisma_saatleri, sayfa_metinleri")
      .limit(1)
      .maybeSingle();

    const timeoutMinutes =
      settingsRow?.blokaj_sure_dakika ?? settingsRow?.tampon_sure_dakika ?? 30;
    const workingHours = normalizeWorkingHours(settingsRow?.calisma_saatleri);
    const specialDays: SpecialDay[] = extractSpecialDays(settingsRow?.sayfa_metinleri);

    const { data: pendingRows, error: fetchError } = await supabase
      .from("appointments")
      .select("id, durum, olusturulma_tarihi")
      .eq("durum", "Beklemede");

    if (fetchError) {
      return safeErrorResponse("Bekleyen randevular sorgulanamadı.", 500, fetchError);
    }

    const expiredIds = (pendingRows ?? [])
      .filter((row) =>
        isPendingAppointmentExpired(
          row.olusturulma_tarihi,
          nowIso,
          timeoutMinutes,
          workingHours,
          specialDays
        )
      )
      .map((row) => row.id);

    if (expiredIds.length > 0) {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ durum: "Süresi Doldu" })
        .in("id", expiredIds);

      if (updateError) {
        return safeErrorResponse(
          "Süresi dolan randevular güncellenemedi.",
          500,
          updateError
        );
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
    return safeErrorResponse("Bekleyen randevu süre dolumu kontrol hatası.", 500, err);
  }
}
