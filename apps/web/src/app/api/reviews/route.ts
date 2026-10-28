export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase bağlantısı eksik." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const musteriAdi = (body.musteri_adi || body.musteriAdi || "").trim();
    const puan = Number(body.puan) || 5;
    const yorum = (body.yorum || "").trim();
    const hizmetTuru = (body.hizmet_turu || body.hizmetTuru || "Genel Hizmet").trim();
    const randevuId = body.randevu_id || body.randevuId || null;
    const kaynak = body.kaynak || "Hizmet Sonrası";

    if (!musteriAdi) {
      return NextResponse.json(
        { error: "Lütfen adınızı ve soyadınızı belirtiniz." },
        { status: 400 },
      );
    }

    if (puan < 1 || puan > 5) {
      return NextResponse.json(
        { error: "Puan 1 ile 5 arasında olmalıdır." },
        { status: 400 },
      );
    }

    // Smart Review Funnel: 4 ve 5 yıldız doğrudan vitrinde aktif; 1-3 yıldız inceleme için pasif
    const isHighRating = puan >= 4;
    const aktif = isHighRating;

    const { data, error } = await supabase
      .from("customer_reviews")
      .insert({
        musteri_adi: musteriAdi,
        puan,
        yorum: yorum || null,
        hizmet_turu: hizmetTuru,
        randevu_id: randevuId,
        kaynak,
        aktif,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      funnel: isHighRating ? "google" : "internal",
      message: isHighRating
        ? "Değerlendirmeniz için çok teşekkür ederiz!"
        : "Geri bildiriminiz için teşekkür ederiz. Memnuniyetiniz adına sizinle iletişime geçeceğiz.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Değerlendirme kaydedilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
