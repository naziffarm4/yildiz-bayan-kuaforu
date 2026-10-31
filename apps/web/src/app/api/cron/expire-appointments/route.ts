export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  isPendingAppointmentExpired,
  normalizeWorkingHours,
  type SpecialDay,
} from "@yildiz/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyCronRequest } from "@/lib/auth/cron-auth";
import { safeErrorResponse } from "@/lib/api-utils";
import { DEFAULT_SPECIAL_DAYS } from "@/lib/site-defaults";

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

    const cutoffIso = new Date(
      new Date(nowIso).getTime() - timeoutMinutes * 60_000
    ).toISOString();

    const { data: pendingRows, error: fetchError } = await supabase
      .from("appointments")
      .select("id, durum, olusturulma_tarihi")
      .eq("durum", "Beklemede")
      .lt("olusturulma_tarihi", cutoffIso);

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
