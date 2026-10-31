export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateLoyaltyDiscount,
  calculateLoyaltyPoints,
  generateSafeUUID,
  PaymentMethodSchema,
} from "@yildiz/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getRequestAuthContext,
  withStaffOrAdminAuth,
} from "@/lib/auth/api-guard";
import { parseJsonBody, safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";

const AdminPaymentCreateSchema = z.object({
  id: z.string().trim().min(1).optional(),
  randevu_id: z.string().trim().min(1).nullable().optional(),
  randevuId: z.string().trim().min(1).nullable().optional(),
  musteri_id: z.string().trim().min(1).nullable().optional(),
  musteriId: z.string().trim().min(1).nullable().optional(),
  islemi_yapan_calisan_id: z.string().trim().min(1).optional(),
  islemiYapanCalisanId: z.string().trim().min(1).optional(),
  hizmet_idleri: z.array(z.string().trim().min(1)).optional(),
  hizmetIdleri: z.array(z.string().trim().min(1)).optional(),
  hizmet_adlari: z.array(z.string().trim().min(1)).optional(),
  hizmetAdlari: z.array(z.string().trim().min(1)).optional(),
  indirim_tipi: z.enum(["TL", "PERCENT"]).default("TL"),
  indirimTipi: z.enum(["TL", "PERCENT"]).optional(),
  indirim_degeri: z.coerce.number().min(0).default(0),
  indirimDegeri: z.coerce.number().min(0).optional(),
  kullanilan_puan_adedi: z.coerce.number().int().min(0).default(0),
  kullanilanPuanAdedi: z.coerce.number().int().min(0).optional(),
  bahsis_tutari: z.coerce.number().min(0).default(0),
  bahsisTutari: z.coerce.number().min(0).optional(),
  odeme_yontemi: PaymentMethodSchema.optional(),
  odemeYontemi: PaymentMethodSchema.optional(),
  gizli_not: z.string().max(500).nullable().optional(),
  gizliNot: z.string().max(500).nullable().optional(),
});

const AdminPaymentPatchSchema = z.object({
  id: z
    .string({ required_error: "Ödeme ID'si gereklidir." })
    .trim()
    .min(1, "Ödeme ID'si gereklidir."),
  action: z.enum(["settle_veresiye", "refund"]),
  odeme_yontemi: PaymentMethodSchema.optional(),
  odemeYontemi: PaymentMethodSchema.optional(),
});

export const GET = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const url = new URL(request.url || "http://localhost/api/admin/payments");
    const rawLimit = Number(url.searchParams.get("limit") ?? 200);
    const rawOffset = Number(url.searchParams.get("offset") ?? 0);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.trunc(rawLimit), 500)
        : 200;
    const offset =
      Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.trunc(rawOffset) : 0;

    let query = supabase
      .from("payments")
      .select("*")
      .order("olusturulma_tarihi", { ascending: false });

    const dynamicQuery = query as unknown as {
      range?: (from: number, to: number) => typeof query;
    };
    if (typeof dynamicQuery.range === "function") {
      query = dynamicQuery.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      return safeErrorResponse("Ödemeler getirilemedi.", 500, error);
    }

    const rows = data ?? [];
    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        limit,
        offset,
        count: rows.length,
      },
    });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminPaymentCreateSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const body = parsed.data;
    const serviceIds = body.hizmet_idleri ?? body.hizmetIdleri ?? [];
    const fallbackServiceNames = body.hizmet_adlari ?? body.hizmetAdlari ?? [];

    if (serviceIds.length === 0 && fallbackServiceNames.length === 0) {
      return NextResponse.json(
        { error: "En az bir hizmet seçilmelidir." },
        { status: 400 }
      );
    }

    const authCtx = getRequestAuthContext(request);
    const requestedStaffId =
      body.islemi_yapan_calisan_id ?? body.islemiYapanCalisanId ?? null;

    // Bölüm 2.1: Calisan kendi dışındaki bir çalışan ID'sini gönderse bile kendi userId'si atanır (komisyon sahteciliği önlemi)
    let staffId: string | null = null;
    if (authCtx?.role === "Calisan") {
      staffId = authCtx.userId;
    } else if (authCtx?.role === "Admin") {
      staffId = requestedStaffId || authCtx.userId;
    } else {
      staffId = requestedStaffId || authCtx?.userId || null;
    }

    if (!staffId) {
      return NextResponse.json(
        { error: "İşlemi yapan personel kimliği doğrulanamadı." },
        { status: 401 }
      );
    }

    const appointmentId = body.randevu_id ?? body.randevuId ?? null;
    let customerId: string | null = body.musteri_id ?? body.musteriId ?? null;

    // Randevu bağlıysa durumunu ve müşteri kimliğini doğrula
    if (appointmentId) {
      try {
        const apptTable = supabase.from("appointments") as unknown as {
          select?: (cols: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{
                data: { id?: string; musteri_id?: string | null; durum?: string } | null;
                error: unknown;
              }>;
            };
          };
        };

        if (typeof apptTable?.select === "function") {
          const { data: apptRow } = await apptTable
            .select("id, musteri_id, durum")
            .eq("id", appointmentId)
            .maybeSingle();

          if (apptRow?.durum) {
            if (apptRow.durum === "Tamamlandı") {
              return NextResponse.json(
                { error: "Bu randevu için ödeme zaten alınmış." },
                { status: 409 }
              );
            }
            if (apptRow.durum === "İptal Edildi" || apptRow.durum === "Süresi Doldu") {
              return NextResponse.json(
                { error: "İptal edilmiş veya süresi dolmuş randevu için tahsilat yapılamaz." },
                { status: 400 }
              );
            }
          }
          if (!customerId && apptRow?.musteri_id) {
            customerId = apptRow.musteri_id;
          }
        }
      } catch (apptLookupErr: unknown) {
        console.warn("Randevu ön kontrolü uyarısı:", apptLookupErr);
      }
    }

    const paymentId = body.id || generateSafeUUID();
    const discountType = body.indirimTipi ?? body.indirim_tipi ?? "TL";
    const discountValue = body.indirimDegeri ?? body.indirim_degeri ?? 0;
    const usedPointsCount = body.kullanilanPuanAdedi ?? body.kullanilan_puan_adedi ?? 0;
    const tipAmount = body.bahsisTutari ?? body.bahsis_tutari ?? 0;
    const paymentMethod = body.odeme_yontemi ?? body.odemeYontemi ?? "Nakit";
    const isVeresiye = paymentMethod === "Veresiye";
    const privateNote = body.gizli_not ?? body.gizliNot ?? null;

    // 1. Hizmet fiyatlarını sunucuda veritabanından oku
    let resolvedServiceNames: string[] = [...fallbackServiceNames];
    let subTotal = 0;

    if (serviceIds.length > 0) {
      const uniqueIds = Array.from(new Set(serviceIds));
      const { data: dbServices, error: srvError } = await supabase
        .from("services")
        .select("id, ad, fiyat")
        .in("id", uniqueIds);

      if (srvError || !Array.isArray(dbServices) || dbServices.length === 0) {
        return NextResponse.json(
          { error: "Seçilen hizmetler doğrulanamadı." },
          { status: 400 }
        );
      }

      const serviceMap = new Map<string, { ad: string; fiyat: number }>();
      for (const row of dbServices) {
        serviceMap.set(row.id, { ad: row.ad, fiyat: Number(row.fiyat) });
      }

      resolvedServiceNames = [];
      for (const sid of serviceIds) {
        const found = serviceMap.get(sid);
        if (!found) {
          return NextResponse.json(
            { error: "Seçilen hizmetlerden biri geçersizdir." },
            { status: 400 }
          );
        }
        resolvedServiceNames.push(found.ad);
        subTotal += found.fiyat;
      }
    } else {
      const { data: dbServices } = await supabase
        .from("services")
        .select("ad, fiyat")
        .in("ad", fallbackServiceNames);

      const namePriceMap = new Map<string, number>();
      if (Array.isArray(dbServices)) {
        for (const row of dbServices) {
          namePriceMap.set(row.ad, Number(row.fiyat));
        }
      }
      for (const name of fallbackServiceNames) {
        subTotal += namePriceMap.get(name) ?? 0;
      }
    }

    // 2. İndirim, Puan İndirimi, Net Ödenen Tutar ve Kazanılan Puanı sunucuda hesapla
    const rawDiscount =
      discountType === "PERCENT"
        ? Math.round(subTotal * (Math.min(discountValue, 100) / 100))
        : discountValue;
    const discountAmount = Math.max(0, Math.min(rawDiscount, subTotal));
    const loyaltyDiscountAmount = calculateLoyaltyDiscount(usedPointsCount);
    const totalDeductions = discountAmount + loyaltyDiscountAmount;
    const netPayable = Math.max(0, subTotal - totalDeductions);
    const earnedPoints = isVeresiye ? 0 : calculateLoyaltyPoints(netPayable);

    // 3. Yalnızca atomik RPC ile tahsilat, sadakat puanı ve randevu durumunu kaydet
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{
        data: unknown;
        error: { message?: string; code?: string } | null;
      }>;
    };

    const { data: rpcData, error: rpcError } = await rpcClient.rpc(
      "record_payment_transaction",
      {
        p_id: paymentId,
        p_randevu_id: appointmentId,
        p_musteri_id: customerId,
        p_islemi_yapan_calisan_id: staffId,
        p_hizmet_adlari: resolvedServiceNames,
        p_toplam_tutar: subTotal,
        p_odenen_tutar: netPayable,
        p_indirim_tutari: discountAmount,
        p_kullanilan_puan: usedPointsCount,
        p_kazanilan_puan: earnedPoints,
        p_odeme_yontemi: paymentMethod,
        p_bahsis_tutari: tipAmount,
        p_veresiye: isVeresiye,
        p_gizli_not: privateNote,
      }
    );

    if (rpcError) {
      const errMsg = rpcError.message ?? "";
      if (
        rpcError.code === "23505" ||
        /zaten alınmış|unique/i.test(errMsg)
      ) {
        return NextResponse.json(
          { error: "Bu randevu için ödeme zaten alınmış." },
          { status: 409 }
        );
      }
      if (errMsg.includes("Yetersiz sadakat puanı")) {
        return NextResponse.json(
          { error: "Yetersiz sadakat puanı bakiyesi." },
          { status: 400 }
        );
      }
      if (errMsg.includes("İptal edilmiş") || errMsg.includes("uyuşmuyor")) {
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }
      return safeErrorResponse("Ödeme işlemi kaydedilemedi.", 500, rpcError);
    }

    const savedPayment: Record<string, unknown> =
      rpcData && typeof rpcData === "object"
        ? (rpcData as Record<string, unknown>)
        : {
            id: paymentId,
            randevu_id: appointmentId,
            musteri_id: customerId,
            islemi_yapan_calisan_id: staffId,
            hizmet_adlari: resolvedServiceNames,
            toplam_tutar: subTotal,
            odenen_tutar: netPayable,
            indirim_tutari: discountAmount,
            kullanilan_puan: usedPointsCount,
            odeme_yontemi: paymentMethod,
            bahsis_tutari: tipAmount,
            veresiye: isVeresiye,
            gizli_not: privateNote,
          };

    await recordAuditLog({
      actorId: authCtx?.userId ?? staffId,
      actorRole: authCtx?.role ?? null,
      ipAddress: authCtx?.ipAddress ?? null,
      action: "payment.create",
      entityType: "payments",
      entityId: paymentId,
      metadata: {
        randevu_id: appointmentId,
        musteri_id: customerId,
        islemi_yapan_calisan_id: staffId,
        toplam_tutar: subTotal,
        indirim_tutari: discountAmount,
        kullanilan_puan_adedi: usedPointsCount,
        kullanilan_puan_indirimi: loyaltyDiscountAmount,
        odenen_tutar: netPayable,
        kazanilan_puan: earnedPoints,
        odeme_yontemi: paymentMethod,
        veresiye: isVeresiye,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...savedPayment,
          islemi_yapan_calisan_id: staffId,
          musteri_id: customerId,
          toplam_tutar: subTotal,
          indirim_tutari: discountAmount,
          kullanilan_puan_indirimi: loyaltyDiscountAmount,
          odenen_tutar: netPayable,
          kazanilan_puan: earnedPoints,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});

export const PATCH = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return safeErrorResponse("Supabase bağlantısı eksik.", 500);
    }

    const parsed = await parseJsonBody(request, AdminPaymentPatchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const { id, action, odeme_yontemi, odemeYontemi } = parsed.data;
    const authCtx = getRequestAuthContext(request);

    // Şartname Madde 18: İade işlemi yalnızca Admin tarafından yapılabilir
    if (action === "refund" && authCtx?.role === "Calisan") {
      return NextResponse.json(
        { error: "İade işlemi yalnızca Admin yetkisiyle yapılabilir." },
        { status: 403 }
      );
    }

    const resolvedMethod = odeme_yontemi ?? odemeYontemi ?? "Nakit";
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{
        data: unknown;
        error: { message?: string } | null;
      }>;
    };

    const { data, error } = await rpcClient.rpc("settle_or_refund_payment", {
      p_payment_id: id,
      p_action: action,
      p_odeme_yontemi: resolvedMethod,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Ödeme güncellenemedi." },
        { status: 400 }
      );
    }

    await recordAuditLog({
      actorId: authCtx?.userId ?? null,
      actorRole: authCtx?.role ?? null,
      ipAddress: authCtx?.ipAddress ?? null,
      action: action === "refund" ? "payment.refund" : "payment.settle_veresiye",
      entityType: "payments",
      entityId: id,
      metadata: { action, odeme_yontemi: resolvedMethod },
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse("Sunucu hatası.", 500, err);
  }
});
