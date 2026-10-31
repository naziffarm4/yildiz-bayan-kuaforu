"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type {
  AppointmentItem,
  CashPayment,
  ServiceItem,
  StaffProfile,
  StockItem,
  SupplierItem,
  CustomerReview,
  GalleryItem,
} from "@yildiz/types";
import { generateSafeUUID } from "@yildiz/types";
import { AdminTopbar, type AdminTab } from "@/components/admin/AdminTopbar";
import { AdminDrawer } from "@/components/admin/AdminDrawer";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminFixedFooter } from "@/components/admin/AdminFixedFooter";
import { PageLoader } from "@/components/PageLoader";

const AdminDashboard = dynamic(
  () => import("@yildiz/ui").then((m) => m.AdminDashboard),
  { loading: () => <PageLoader /> },
);
const AppointmentManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.AppointmentManager),
  { loading: () => <PageLoader /> },
);
const CashRegisterPOS = dynamic(
  () => import("@yildiz/ui").then((m) => m.CashRegisterPOS),
  { loading: () => <PageLoader /> },
);
const StaffCommissionManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.StaffCommissionManager),
  { loading: () => <PageLoader /> },
);
const ServiceManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.ServiceManager),
  { loading: () => <PageLoader /> },
);
const StockManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.StockManager),
  { loading: () => <PageLoader /> },
);
const SupplierManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.SupplierManager),
  { loading: () => <PageLoader /> },
);
const GalleryManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.GalleryManager),
  { loading: () => <PageLoader /> },
);
const ReviewsManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.ReviewsManager),
  { loading: () => <PageLoader /> },
);
const SiteSettingsManager = dynamic(
  () => import("@yildiz/ui").then((m) => m.SiteSettingsManager),
  { loading: () => <PageLoader /> },
);
import { useContent } from "@/lib/content-context";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/stores/toast-store";
import { createClient } from "@/lib/supabase/client";
import {
  AppointmentService,
  PaymentService,
  InventoryService,
  ServiceService,
  ContentService,
  type AppointmentRow,
  type PaymentRow,
  type InventoryRow,
  type SupplierRow,
  type ServiceRow,
  type ReviewRow,
} from "@/services";

export default function AdminPage() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>("dashboard");
  const [userRole, setUserRole] = useState<"Admin" | "Calisan">("Admin");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dinamik CMS İçerik Sağlayıcısı
  const {
    salonInfo,
    updateSalonInfo,
    pageTexts,
    updatePageTexts,
    gallery,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    reviews,
    addReview,
    deleteReview,
    bookingRules,
    updateBookingRules,
    specialDays,
    addSpecialDay,
    deleteSpecialDay,
  } = useContent();

  // Ana Veri State'leri (Canlı Supabase Servislerinden Beslenir)
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [payments, setPayments] = useState<CashPayment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [adminReviews, setAdminReviews] = useState<CustomerReview[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  // Zustand App Store Realtime & Gallery Senkronizasyonu
  const storeGallery = useAppStore((s) => s.gallery);
  const storeUpdateGalleryItem = useAppStore((s) => s.updateGalleryItem);
  const storeDeleteGalleryItem = useAppStore((s) => s.deleteGalleryItem);
  const storeAddGalleryItem = useAppStore((s) => s.addGalleryItem);
  const storeModerateGalleryComment = useAppStore((s) => s.moderateGalleryComment);

  // Randevudan POS'a aktarım için ara state
  const [selectedAppointmentForPOS, setSelectedAppointmentForPOS] = useState<AppointmentItem | null>(null);

  // Aktif kullanıcı adı
  const authFullName = user ? `${user.ad} ${user.soyad}`.trim() : "";
  const activeStaffMember = staff.find((s) => (userRole === "Admin" ? s.rol === "Admin" : s.rol === "Calisan")) ?? staff[0];
  const activeStaffName =
    authFullName ||
    (activeStaffMember ? `${activeStaffMember.ad} ${activeStaffMember.soyad}`.trim() : "Yıldız Bayan Kuaförü");

  // Sayıcılar
  const pendingCount = appointments.filter((a) => a.durum === "Beklemede").length;
  const criticalStockCount = stockItems.filter((s) => s.miktar <= s.kritikSeviye).length;

  // Supabase'den Canlı Verileri Çek
  useEffect(() => {
    let isMounted = true;

    async function loadLiveAdminData() {
      try {
        const client = createClient();
        const appointmentService = new AppointmentService(client);
        const paymentService = new PaymentService(client);
        const inventoryService = new InventoryService(client);
        const serviceService = new ServiceService(client);
        const contentService = new ContentService(client);

        const [
          appointmentRows,
          paymentRows,
          inventoryRows,
          supplierRows,
          serviceRows,
          reviewRows,
        ] = await Promise.all([
          appointmentService.getAllAppointments().catch(() => [] as AppointmentRow[]),
          paymentService.getAllPayments().catch(() => [] as PaymentRow[]),
          inventoryService.getAllInventory().catch(() => [] as InventoryRow[]),
          inventoryService.getAllSuppliers().catch(() => [] as SupplierRow[]),
          serviceService.getAllServices().catch(() => [] as ServiceRow[]),
          contentService.getAllReviews().catch(() => [] as ReviewRow[]),
        ]);

        if (!isMounted) return;

        const supplierMap = new Map<string, string>();
        if (supplierRows && supplierRows.length > 0) {
          const mappedSuppliers: SupplierItem[] = supplierRows.map((s) => ({
            id: s.id,
            firmaAdi: s.firma_adi,
            yetkiliKisi: s.yetkili_kisi,
            telefon: s.telefon,
            whatsapp: s.whatsapp ?? s.telefon,
            eposta: s.eposta ?? undefined,
            kategoriler: s.kategoriler,
            adres: s.adres ?? undefined,
          }));
          setSuppliers(mappedSuppliers);
          supplierRows.forEach((s) => supplierMap.set(s.id, s.firma_adi));
        }

        if (appointmentRows && appointmentRows.length > 0) {
          const mappedAppointments: AppointmentItem[] = appointmentRows.map((r) => ({
            id: r.id,
            musteriId: r.musteri_id,
            musteriAdSoyad: r.musteri_ad_soyad,
            musteriTelefon: r.musteri_telefon,
            hizmetIdleri: r.hizmet_idleri,
            calisanIdleri: r.calisan_idleri,
            tarihSaat: r.tarih_saat,
            toplamSureDakika: r.toplam_sure_dakika,
            durum: r.durum,
            kaynak: r.kaynak,
            not: r.notlar ?? undefined,
            onaylayanKullaniciId: r.onaylayan_id ?? undefined,
            olusturulmaTarihi: r.olusturulma_tarihi,
          }));
          setAppointments(mappedAppointments);
        }

        if (paymentRows && paymentRows.length > 0) {
          const mappedPayments: CashPayment[] = paymentRows.map((p) => ({
            id: p.id,
            randevuId: p.randevu_id ?? undefined,
            musteriId: p.musteri_id ?? generateSafeUUID(),
            musteriAdSoyad: "Kayıtlı Müşteri",
            islemiYapanCalisanId: p.islemi_yapan_calisan_id,
            hizmetAdlari: p.hizmet_adlari,
            toplamTutar: Number(p.toplam_tutar),
            odenenTutar: Number(p.odenen_tutar),
            indirimTutari: Number(p.indirim_tutari ?? 0),
            kullanilanPuanTutari: Number(p.kullanilan_puan ?? 0),
            odemeYontemi: p.odeme_yontemi,
            bahsisTutari: Number(p.bahsis_tutari ?? 0),
            veresiye: p.veresiye,
            gizliNot: p.gizli_not ?? undefined,
            olusturulmaTarihi: p.olusturulma_tarihi,
          }));
          setPayments(mappedPayments);
        }

        if (inventoryRows && inventoryRows.length > 0) {
          const mappedStock: StockItem[] = inventoryRows.map((item) => ({
            id: item.id,
            urunAdi: item.urun_adi,
            kategori: item.kategori,
            miktar: Number(item.miktar),
            birim: item.birim,
            kritikSeviye: Number(item.kritik_seviye),
            tedarikci: (item.supplier_id && supplierMap.get(item.supplier_id)) || "Genel Tedarikçi",
          }));
          setStockItems(mappedStock);
        }

        if (serviceRows && serviceRows.length > 0) {
          const mappedServices: ServiceItem[] = serviceRows.map((s) => ({
            id: s.id,
            ad: s.ad,
            kategori: s.kategori,
            tahminiSureDakika: s.tahmini_sure_dakika,
            fiyat: Number(s.fiyat),
            aktif: s.aktif,
            aciklama: s.aciklama ?? undefined,
            gorselUrl: s.gorsel_url ?? undefined,
            detay: s.detay ?? undefined,
            sira: s.sira ?? 0,
          }));
          setServices(mappedServices);
        }

        if (reviewRows && reviewRows.length > 0) {
          const mappedReviews: CustomerReview[] = reviewRows.map((r) => ({
            id: r.id,
            musteriAdi: r.musteri_adi,
            puan: r.puan,
            yorum: r.yorum ?? undefined,
            tarih: r.olusturulma_tarihi
              ? new Date(r.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("tr-TR"),
            kaynak: r.google_review_url ? "Google" : "Salon",
            hizmetTuru: r.hizmet_turu,
            googleReviewUrl: r.google_review_url ?? undefined,
          }));
          setAdminReviews(mappedReviews);
        }

        // Canlı çalışan kadrosunu getir
        const { data: profileRows } = await client
          .from("profiles")
          .select("id, ad, soyad, telefon, eposta, rol")
          .in("rol", ["Admin", "Calisan"]);

        if (profileRows && profileRows.length > 0) {
          const mappedStaff: StaffProfile[] = profileRows.map((p) => ({
            id: p.id,
            ad: p.ad,
            soyad: p.soyad,
            unvan: p.rol === "Admin" ? "Master Stilist & Kurucu" : "Kuaför & Stilist",
            telefon: p.telefon,
            eposta: p.eposta ?? "",
            rol: p.rol as "Admin" | "Calisan",
            komisyonOrani: p.rol === "Admin" ? 35 : 20,
            aktif: true,
            izinli: false,
            yetkinlikHizmetIdleri: [],
          }));
          setStaff(mappedStaff);
        }
      } catch (err: unknown) {
        console.warn("Admin verileri yüklenirken uyarı, yerel durum korunuyor:", err);
      } finally {
        if (isMounted) {
          setIsAdminLoading(false);
        }
      }
    }

    loadLiveAdminData();

    const handleAppointmentsRealtimeChange = (event: Event) => {
      if (!isMounted) return;
      const customEvent = event as CustomEvent<{
        eventType?: string;
        new?: Record<string, unknown>;
        old?: Record<string, unknown>;
        appointment?: AppointmentItem;
        id?: string;
      }>;
      const detail = customEvent.detail;

      if (detail?.eventType === "DELETE") {
        const deletedId =
          typeof detail.old?.id === "string"
            ? detail.old.id
            : typeof detail.id === "string"
            ? detail.id
            : "";
        if (deletedId) {
          setAppointments((prev) => prev.filter((a) => a.id !== deletedId));
          return;
        }
      }

      if (detail?.appointment) {
        const incoming = detail.appointment;
        setAppointments((prev) => {
          const exists = prev.some((a) => a.id === incoming.id);
          return exists
            ? prev.map((a) => (a.id === incoming.id ? incoming : a))
            : [incoming, ...prev];
        });
        return;
      }

      if (detail?.new && typeof detail.new.id === "string") {
        const row = detail.new;
        const mapped: AppointmentItem = {
          id: row.id as string,
          musteriId: typeof row.musteri_id === "string" ? row.musteri_id : null,
          musteriAdSoyad: typeof row.musteri_ad_soyad === "string" ? row.musteri_ad_soyad : "",
          musteriTelefon: typeof row.musteri_telefon === "string" ? row.musteri_telefon : "",
          hizmetIdleri: Array.isArray(row.hizmet_idleri)
            ? row.hizmet_idleri.filter((v): v is string => typeof v === "string")
            : [],
          calisanIdleri: Array.isArray(row.calisan_idleri)
            ? row.calisan_idleri.filter((v): v is string => typeof v === "string")
            : [],
          tarihSaat:
            typeof row.tarih_saat === "string" ? row.tarih_saat : new Date().toISOString(),
          toplamSureDakika: Number(row.toplam_sure_dakika) || 30,
          durum:
            typeof row.durum === "string"
              ? (row.durum as AppointmentItem["durum"])
              : "Beklemede",
          kaynak:
            typeof row.kaynak === "string"
              ? (row.kaynak as AppointmentItem["kaynak"])
              : "Web",
          not: typeof row.notlar === "string" ? row.notlar : undefined,
          onaylayanKullaniciId:
            typeof row.onaylayan_id === "string" ? row.onaylayan_id : undefined,
          olusturulmaTarihi:
            typeof row.olusturulma_tarihi === "string"
              ? row.olusturulma_tarihi
              : new Date().toISOString(),
        };

        setAppointments((prev) => {
          const exists = prev.some((a) => a.id === mapped.id);
          return exists
            ? prev.map((a) => (a.id === mapped.id ? mapped : a))
            : [mapped, ...prev];
        });
        return;
      }

      loadLiveAdminData();
    };

    window.addEventListener("yildiz:appointments-changed", handleAppointmentsRealtimeChange);

    return () => {
      isMounted = false;
      window.removeEventListener("yildiz:appointments-changed", handleAppointmentsRealtimeChange);
    };
  }, []);

  // Context reviews senkronizasyonu
  useEffect(() => {
    if (reviews.length > 0 && adminReviews.length === 0) {
      setAdminReviews(reviews);
    }
  }, [reviews, adminReviews.length]);

  // Aksiyon Handlers (Sunucu Tarafı API CRUD Entegrasyonu)
  const handleUpdateAppointment = async (updated: AppointmentItem) => {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    try {
      await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updated.id,
          durum: updated.durum,
          onaylayan_id: activeStaffMember?.id ?? null,
        }),
      });
    } catch (err) {
      console.error("Randevu durum güncelleme hatası:", err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/admin/appointments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Randevu silme hatası:", err);
    }
  };

  const handleCreateAppointment = async (created: AppointmentItem) => {
    setAppointments((prev) => [created, ...prev]);

    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: created.id,
          musteri_id: created.musteriId,
          musteri_ad_soyad: created.musteriAdSoyad,
          musteri_telefon: created.musteriTelefon,
          hizmet_idleri: created.hizmetIdleri,
          calisan_idleri: created.calisanIdleri,
          tarih_saat: created.tarihSaat,
          toplam_sure_dakika: created.toplamSureDakika,
          durum: created.durum,
          kaynak: created.kaynak,
          notlar: created.not ?? null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setAppointments((prev) => prev.filter((a) => a.id !== created.id));
        toast.error(json.error || "Randevu kaydedilemedi.");
      }
    } catch (err: unknown) {
      console.error("Randevu oluşturma hatası:", err);
      setAppointments((prev) => prev.filter((a) => a.id !== created.id));
      toast.error("Randevu sunucuya kaydedilemedi.");
    }
  };

  const handleOpenPOSWithAppointment = (appointment: AppointmentItem) => {
    setSelectedAppointmentForPOS(appointment);
    setCurrentTab("pos");
  };

  const handlePaymentCompleted = async (
    payment: CashPayment,
    appointmentId?: string,
    meta?: {
      serviceIds?: string[];
      discountType?: "TL" | "PERCENT";
      discountValue?: number;
      usedPointsCount?: number;
    },
  ) => {
    const previousAppointments = appointments;
    setPayments((prev) => [payment, ...prev]);
    if (appointmentId) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, durum: "Tamamlandı" } : a)),
      );
    }

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payment.id,
          randevu_id: appointmentId ?? payment.randevuId ?? null,
          musteri_id: payment.musteriId,
          islemi_yapan_calisan_id: payment.islemiYapanCalisanId,
          hizmet_idleri: meta?.serviceIds ?? [],
          hizmet_adlari: payment.hizmetAdlari,
          indirim_tipi: meta?.discountType ?? "TL",
          indirim_degeri: meta?.discountValue ?? payment.indirimTutari,
          kullanilan_puan_adedi:
            meta?.usedPointsCount ?? Math.round(payment.kullanilanPuanTutari * 2),
          bahsis_tutari: payment.bahsisTutari,
          odeme_yontemi: payment.odemeYontemi,
          gizli_not: payment.gizliNot ?? null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setPayments((prev) => prev.filter((p) => p.id !== payment.id));
        if (appointmentId) {
          setAppointments(previousAppointments);
        }
        const errMsg = json.error || "Tahsilat kaydedilemedi.";
        toast.error(errMsg);
        throw new Error(errMsg);
      }

      if (json.data) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === payment.id
              ? {
                  ...p,
                  toplamTutar: Number(json.data.toplam_tutar ?? p.toplamTutar),
                  indirimTutari: Number(json.data.indirim_tutari ?? p.indirimTutari),
                  kullanilanPuanTutari: Number(
                    json.data.kullanilan_puan_indirimi ?? p.kullanilanPuanTutari,
                  ),
                  odenenTutar: Number(json.data.odenen_tutar ?? p.odenenTutar),
                }
              : p,
          ),
        );
      }
    } catch (err: unknown) {
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
      if (appointmentId) {
        setAppointments(previousAppointments);
      }
      if (err instanceof Error) {
        throw err;
      }
      const fallbackMsg = "Tahsilat sunucuya iletilemedi.";
      toast.error(fallbackMsg);
      throw new Error(fallbackMsg);
    }
  };

  const handleToggleStaffLeave = (staffId: string) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, izinli: !s.izinli } : s)),
    );
  };

  const handleToggleServiceActive = async (serviceId: string) => {
    const target = services.find((s) => s.id === serviceId);
    const newActive = target ? !target.aktif : false;
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, aktif: newActive } : s)),
    );

    try {
      await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serviceId, aktif: newActive }),
      });
    } catch (err) {
      console.error("Hizmet durum güncelleme hatası:", err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));

    try {
      await fetch(`/api/admin/services?id=${encodeURIComponent(serviceId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Hizmet silme hatası:", err);
    }
  };

  const handleAddService = async (newService: ServiceItem) => {
    setServices((prev) => [newService, ...prev]);

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newService.id,
          ad: newService.ad,
          kategori: newService.kategori,
          tahmini_sure_dakika: newService.tahminiSureDakika,
          fiyat: newService.fiyat,
          aktif: newService.aktif,
          aciklama: newService.aciklama ?? null,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.data?.id && json.data.id !== newService.id) {
          setServices((prev) =>
            prev.map((s) => (s.id === newService.id ? { ...s, id: json.data.id } : s)),
          );
        }
      }
    } catch (err) {
      console.error("Hizmet ekleme hatası:", err);
    }
  };

  const handleUpdateStockQuantity = async (id: string, delta: number) => {
    const target = stockItems.find((s) => s.id === id);
    const newQuantity = target ? Math.max(0, target.miktar + delta) : 0;
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, miktar: newQuantity } : item,
      ),
    );

    try {
      await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, miktar: newQuantity }),
      });
    } catch (err) {
      console.error("Stok miktar güncelleme hatası:", err);
    }
  };

  const handleDeleteStockItem = async (id: string) => {
    setStockItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await fetch(`/api/admin/inventory?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Stok kalemi silme hatası:", err);
    }
  };

  const handleAddStockItem = async (newItem: StockItem) => {
    setStockItems((prev) => [newItem, ...prev]);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newItem.id,
          urun_adi: newItem.urunAdi,
          kategori: newItem.kategori,
          miktar: newItem.miktar,
          birim: newItem.birim,
          kritik_seviye: newItem.kritikSeviye,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.data?.id && json.data.id !== newItem.id) {
          setStockItems((prev) =>
            prev.map((item) => (item.id === newItem.id ? { ...item, id: json.data.id } : item)),
          );
        }
      }
    } catch (err) {
      console.error("Stok kalemi ekleme hatası:", err);
    }
  };

  const handleAddSupplier = async (newSupplier: SupplierItem) => {
    setSuppliers((prev) => [newSupplier, ...prev]);

    try {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newSupplier.id,
          firma_adi: newSupplier.firmaAdi,
          yetkili_kisi: newSupplier.yetkiliKisi,
          telefon: newSupplier.telefon,
          whatsapp: newSupplier.whatsapp,
          eposta: newSupplier.eposta ?? null,
          kategoriler: newSupplier.kategoriler,
          adres: newSupplier.adres ?? null,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.data?.id && json.data.id !== newSupplier.id) {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === newSupplier.id ? { ...s, id: json.data.id } : s)),
          );
        }
      }
    } catch (err) {
      console.error("Tedarikçi ekleme hatası:", err);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));

    try {
      await fetch(`/api/admin/suppliers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Tedarikçi silme hatası:", err);
    }
  };

  const handleAddStaff = (newStaff: StaffProfile) => {
    setStaff((prev) => [...prev, newStaff]);
  };

  const handleAddReview = async (
    review: Omit<CustomerReview, "id" | "tarih"> & { tarih?: string },
  ) => {
    let savedId = generateSafeUUID();
    const todayStr = review.tarih ?? new Date().toLocaleDateString("tr-TR");

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_adi: review.musteriAdi,
          yorum: review.yorum || "",
          puan: review.puan,
          hizmet_turu: review.hizmetTuru || "Genel Deneyim",
          google_review_url: review.googleReviewUrl || null,
          aktif: true,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.data?.id) {
          savedId = json.data.id;
        }
      }
    } catch (err) {
      console.error("Yorum kaydetme hatası:", err);
    }

    const newRevItem: CustomerReview = {
      ...review,
      id: savedId,
      tarih: todayStr,
    };
    addReview(newRevItem);
    setAdminReviews((prev) => [newRevItem, ...prev]);
  };

  const handleDeleteReview = async (id: string) => {
    deleteReview(id);
    setAdminReviews((prev) => prev.filter((r) => r.id !== id));

    try {
      await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Yorum silme hatası:", err);
    }
  };

  const handleAddPhoto = async (photo: Omit<GalleryItem, "id" | "begeniSayisi">) => {
    const resolvedStylist = photo.stilist?.trim() || activeStaffName || "Yıldız Bayan Kuaförü";
    let savedId = generateSafeUUID();
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: photo.gorselUrl,
          baslik: photo.baslik,
          kategori: photo.kategori,
          sira: photo.sira ?? 0,
          medya_turu: photo.medyaTuru ?? "image",
          kapak_url: photo.kapakUrl ?? null,
          aciklama: photo.aciklama ?? null,
          stilist: resolvedStylist,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.data?.id) {
          savedId = json.data.id;
        }
      }
    } catch (err) {
      console.error("Galeri kaydetme hatası:", err);
    }

    const newItem = {
      ...photo,
      id: savedId,
      begeniSayisi: 0,
      stilist: resolvedStylist,
      medyaTuru: photo.medyaTuru || "image",
    } as GalleryItem;

    addGalleryItem(newItem);
    await storeAddGalleryItem(newItem);
  };

  const handleDeletePhoto = async (id: string) => {
    deleteGalleryItem(id);
    await storeDeleteGalleryItem(id);
  };

  const handleUpdatePhoto = async (id: string, updates: Partial<GalleryItem>) => {
    await storeUpdateGalleryItem(id, updates);
    await updateGalleryItem(id, updates);
  };

  const handleSyncGoogleReviews = async () => {
    const res = await fetch("/api/admin/sync/google-reviews?force=true", {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error("Senkronizasyon başarısız oldu");
    }
    const json = (await res.json().catch(() => ({}))) as {
      data?: {
        googleRating?: number;
        googleReviewCount?: number;
        lastGoogleSyncAt?: string;
      };
    };
    if (json.data) {
      updatePageTexts((prev) => ({
        ...prev,
        reviewsSection: {
          ...prev.reviewsSection,
          googleRating: json.data?.googleRating ?? prev.reviewsSection?.googleRating,
          googleReviewCount: json.data?.googleReviewCount ?? prev.reviewsSection?.googleReviewCount,
          lastGoogleSyncAt: json.data?.lastGoogleSyncAt ?? new Date().toISOString(),
        },
      }));
    }
  };

  if (isAdminLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex max-w-full overflow-x-clip bg-bg-primary text-text-primary">
      {/* 1. MASAÜSTÜ SOL SABİT SİDEBAR (hidden lg:flex w-64) */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
        criticalStockCount={criticalStockCount}
        userRole={userRole}
        onToggleRole={setUserRole}
        activeStaffName={activeStaffName}
      />

      {/* 2. MOBİL ÇEKMECE MENÜSÜ (lg:hidden) */}
      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
        criticalStockCount={criticalStockCount}
        userRole={userRole}
        onToggleRole={setUserRole}
        activeStaffName={activeStaffName}
      />

      {/* 3. SAĞ SÜTUN: TOPBAR + ANA İÇERİK */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full lg:pl-64">
        {/* Üst Bar */}
        <AdminTopbar
          userRole={userRole}
          onToggleRole={setUserRole}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          activeStaffName={activeStaffName}
          onOpenQuickPOS={() => {
            setSelectedAppointmentForPOS(null);
            setCurrentTab("pos");
          }}
          onOpenManualAppointment={() => {
            setCurrentTab("appointments");
          }}
        />

        <main className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-24 pb-28 lg:pb-12 flex-1 max-w-full">
          {currentTab === "dashboard" && (
            <AdminDashboard
              appointments={appointments}
              payments={payments}
              stockItems={stockItems}
              services={services}
              staff={staff}
              onNavigateToTab={setCurrentTab}
              onOpenQuickPOS={() => {
                setSelectedAppointmentForPOS(null);
                setCurrentTab("pos");
              }}
              onOpenApproveModal={(app) => {
                setSelectedAppointmentForPOS(app);
                setCurrentTab("appointments");
              }}
              onOpenPOSWithAppointment={handleOpenPOSWithAppointment}
            />
          )}

          {currentTab === "appointments" && (
            <AppointmentManager
              appointments={appointments}
              services={services}
              staff={staff}
              onUpdateAppointment={handleUpdateAppointment}
              onCreateAppointment={handleCreateAppointment}
              onOpenPOSWithAppointment={handleOpenPOSWithAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              activeStaffName={activeStaffName}
            />
          )}

          {currentTab === "pos" && (
            <CashRegisterPOS
              appointments={appointments}
              services={services}
              staff={staff}
              payments={payments}
              selectedAppointmentForPOS={selectedAppointmentForPOS}
              onClearSelectedAppointment={() => setSelectedAppointmentForPOS(null)}
              onPaymentCompleted={handlePaymentCompleted}
              activeStaffName={activeStaffName}
            />
          )}

          {currentTab === "staff" && (
            <StaffCommissionManager
              staff={staff}
              payments={payments}
              userRole={userRole}
              onToggleLeave={handleToggleStaffLeave}
              activeStaffId={activeStaffMember?.id ?? ""}
              onAddStaff={handleAddStaff}
            />
          )}

          {currentTab === "services" && (
            <ServiceManager
              services={services}
              onToggleServiceActive={handleToggleServiceActive}
              onAddService={handleAddService}
              onDeleteService={handleDeleteService}
            />
          )}

          {currentTab === "stock" && (
            <StockManager
              stockItems={stockItems}
              suppliers={suppliers}
              onUpdateStockQuantity={handleUpdateStockQuantity}
              onAddStockItem={handleAddStockItem}
              onDeleteStockItem={handleDeleteStockItem}
            />
          )}

          {currentTab === "suppliers" && (
            <SupplierManager
              suppliers={suppliers}
              onAddSupplier={handleAddSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {currentTab === "gallery" && (
            <GalleryManager
              gallery={storeGallery.length > 0 ? storeGallery : gallery}
              onAddPhoto={handleAddPhoto}
              onDeletePhoto={handleDeletePhoto}
              onUpdatePhoto={handleUpdatePhoto}
              onModerateComment={storeModerateGalleryComment}
            />
          )}

          {currentTab === "reviews" && (
            <ReviewsManager
              reviews={adminReviews}
              onAddReview={handleAddReview}
              onDeleteReview={handleDeleteReview}
              googleRating={pageTexts.reviewsSection?.googleRating}
              googleReviewCount={pageTexts.reviewsSection?.googleReviewCount}
              lastGoogleSyncAt={pageTexts.reviewsSection?.lastGoogleSyncAt}
              onSyncGoogleReviews={handleSyncGoogleReviews}
            />
          )}

          {currentTab === "settings" && (
            <SiteSettingsManager
              salonInfo={salonInfo}
              onUpdateSalonInfo={updateSalonInfo}
              pageTexts={pageTexts}
              onUpdatePageTexts={updatePageTexts}
              bookingRules={bookingRules}
              onUpdateBookingRules={updateBookingRules}
              specialDays={specialDays}
              onAddSpecialDay={addSpecialDay}
              onDeleteSpecialDay={deleteSpecialDay}
            />
          )}
        </main>
      </div>

      {/* 4. MOBİL SABİT HIZLI ERİŞİM FOOTER BARI (lg:hidden) */}
      <AdminFixedFooter
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingCount={pendingCount}
        criticalStockCount={criticalStockCount}
      />
    </div>
  );
}
