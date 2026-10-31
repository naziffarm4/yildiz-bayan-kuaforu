export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const PublicReviewBodySchema = z
  .object({
    musteri_adi: z.string().trim().max(100).optional(),
    musteriAdi: z.string().trim().max(100).optional(),
    puan: z.coerce
      .number()
      .int()
      .min(1, "Puan 1 ile 5 arasında olmalıdır.")
      .max(5, "Puan 1 ile 5 arasında olmalıdır.")
      .default(5),
    yorum: z.string().trim().max(1000, "Yorum en fazla 1000 karakter olabilir.").optional(),
    hizmet_turu: z.string().trim().max(100).optional(),
    hizmetTuru: z.string().trim().max(100).optional(),
    randevu_id: z.string().uuid("Geçersiz randevu kimliği.").nullable().optional(),
    randevuId: z.string().uuid("Geçersiz randevu kimliği.").nullable().optional(),
  })
  .refine(
    (data) => {
      const name = (data.musteri_adi || data.musteriAdi || "").trim();
      return name.length >= 2;
    },
    { message: "Lütfen adınızı ve soyadınızı belirtiniz." }
  );

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`public-reviews:${getClientIp(request)}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Çok fazla değerlendirme isteği gönderildi. Lütfen biraz bekleyiniz." },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, PublicReviewBodySchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const musteriAdi = (body.musteri_adi || body.musteriAdi || "").trim();
    const puan = body.puan ?? 5;
    const yorum = (body.yorum || "").trim();
    const hizmetTuru = (body.hizmet_turu || body.hizmetTuru || "Genel Hizmet").trim();
    const randevuId = body.randevu_id || body.randevuId || null;

    if (randevuId) {
      const { data: appointment } = await supabase
        .from("appointments")
        .select("id, durum")
        .eq("id", randevuId)
        .maybeSingle();

      if (!appointment || appointment.durum !== "Tamamlandı") {
        return NextResponse.json(
          { error: "Yalnızca tamamlanmış randevular değerlendirilebilir." },
          { status: 400 }
        );
      }

      try {
        const { data: existingReview } = await supabase
          .from("customer_reviews")
          .select("id")
          .eq("randevu_id", randevuId)
          .maybeSingle();

        if (existingReview && "id" in existingReview && existingReview.id) {
          return NextResponse.json(
            { error: "Bu randevu için daha önce değerlendirme yapılmıştır." },
            { status: 409 }
          );
        }
      } catch (dupCheckErr: unknown) {
        console.warn("Mükerrer yorum kontrolü atlandı:", dupCheckErr);
      }
    }

    // Şartname Madde 15 & 16: Müşteri yorumları moderasyonludur (aktif: false)
    const { data, error } = await supabase
      .from("customer_reviews")
      .insert({
        musteri_adi: musteriAdi,
        puan,
        yorum: yorum || null,
        hizmet_turu: hizmetTuru,
        randevu_id: randevuId,
        kaynak: "Hizmet Sonrası",
        aktif: false,
      })
      .select("id, musteri_adi, hizmet_turu, puan, yorum, olusturulma_tarihi")
      .single();

    if (error) {
      const errCode = (error as { code?: string }).code;
      if (errCode === "23505") {
        return NextResponse.json(
          { error: "Bu randevu için daha önce değerlendirme yapılmıştır." },
          { status: 409 }
        );
      }
      return safeErrorResponse("Değerlendirme kaydedilemedi.", 500, error);
    }

    return NextResponse.json({
      success: true,
      data,
      funnel: "google",
      message: "Değerlendirmeniz için çok teşekkür ederiz!",
    });
  } catch (err: unknown) {
    return safeErrorResponse("Değerlendirme kaydedilemedi.", 500, err);
  }
}
