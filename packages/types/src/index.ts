import { z } from "zod";

// --- KULLANICI & ROL TİPLERİ ---
export const UserRoleSchema = z.enum(["Admin", "Calisan", "Musteri"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const CustomerProfileSchema = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2),
  soyad: z.string().min(2),
  telefon: z.string().min(10),
  eposta: z.string().email().optional(),
  adres: z.string().optional(),
  tercihEdilenCalisanId: z.string().uuid().optional(),
  alerjiNotu: z.string().optional(),
  boyaFormulu: z.string().optional(),
  smsDogrulandi: z.boolean().default(false),
  toplamPuan: z.number().nonnegative().default(0),
  olusturulmaTarihi: z.string().datetime(),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const StaffProfileSchema = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2),
  soyad: z.string().min(2),
  unvan: z.string().min(2),
  telefon: z.string().min(10),
  eposta: z.string().email(),
  rol: z.enum(["Admin", "Calisan"]),
  komisyonOrani: z.number().min(0).max(100), // Yüzde olarak (örn. %20 için 20)
  aktif: z.boolean().default(true),
  izinli: z.boolean().default(false), // İzinli/hasta olanlar onay listesinde gizlenir
  yetkinlikHizmetIdleri: z.array(z.string().uuid()).default([]),
  avatar: z.string().optional(),
});
export type StaffProfile = z.infer<typeof StaffProfileSchema>;

// --- HİZMET TİPLERİ ---
export const ServiceItemSchema = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2),
  tahminiSureDakika: z.number().positive(),
  fiyat: z.number().positive(),
  aktif: z.boolean().default(true), // Silme yoktur, sadece pasife alma vardır (Şartname Bölüm 11)
  kategori: z.string().min(2),
  aciklama: z.string().optional(),
  gorselUrl: z.string().optional(),
  detay: z.string().optional(),
  sira: z.number().optional(),
});
export type ServiceItem = z.infer<typeof ServiceItemSchema>;

// --- RANDEVU TİPLERİ ---
export const AppointmentStatusSchema = z.enum([
  "Beklemede",
  "Onaylandı",
  "Tamamlandı",
  "İptal Edildi",
  "Gelmedi",
  "Süresi Doldu",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentSourceSchema = z.enum([
  "Web",
  "Telefon",
  "WhatsApp",
  "İşletmeye Geldi",
]);
export type AppointmentSource = z.infer<typeof AppointmentSourceSchema>;

export const AppointmentItemSchema = z.object({
  id: z.string().uuid(),
  musteriId: z.string().uuid().nullable().optional(),
  musteriAdSoyad: z.string(),
  musteriTelefon: z.string(),
  hizmetIdleri: z.array(z.string().uuid()).min(1),
  calisanIdleri: z.array(z.string().uuid()).default([]),
  tarihSaat: z.string().datetime(),
  toplamSureDakika: z.number().positive(),
  durum: AppointmentStatusSchema,
  kaynak: AppointmentSourceSchema,
  not: z.string().optional(),
  kvkkOnay: z.boolean().optional(),
  onaylayanKullaniciId: z.string().uuid().optional(),
  olusturulmaTarihi: z.string().datetime(),
});
export type AppointmentItem = z.infer<typeof AppointmentItemSchema>;

// --- KASA & ÖDEME TİPLERİ ---
export const PaymentMethodSchema = z.enum(["Nakit", "Kart", "Havale_EFT", "Veresiye"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const CashPaymentSchema = z.object({
  id: z.string().uuid(),
  randevuId: z.string().uuid().optional(),
  musteriId: z.string().uuid(),
  musteriAdSoyad: z.string().default("Misafir Müşteri"),
  islemiYapanCalisanId: z.string().uuid(),
  hizmetAdlari: z.array(z.string()).default([]),
  toplamTutar: z.number().nonnegative(),
  odenenTutar: z.number().nonnegative(),
  indirimTutari: z.number().nonnegative().default(0),
  kullanilanPuanTutari: z.number().nonnegative().default(0),
  odemeYontemi: PaymentMethodSchema,
  bahsisTutari: z.number().nonnegative().default(0),
  veresiye: z.boolean().default(false),
  gizliNot: z.string().optional(),
  olusturulmaTarihi: z.string().datetime(),
});
export type CashPayment = z.infer<typeof CashPaymentSchema>;

// --- STOK TİPLERİ ---
export const StockItemSchema = z.object({
  id: z.string().uuid(),
  urunAdi: z.string().min(2),
  kategori: z.string().min(2),
  miktar: z.number().nonnegative(),
  birim: z.string(),
  kritikSeviye: z.number().positive(),
  tedarikci: z.string(),
});
export type StockItem = z.infer<typeof StockItemSchema>;

// --- TEDARİKÇİ TİPLERİ ---
export const SupplierItemSchema = z.object({
  id: z.string().uuid(),
  firmaAdi: z.string().min(2),
  yetkiliKisi: z.string().min(2),
  telefon: z.string().min(10),
  whatsapp: z.string().min(10),
  eposta: z.string().email().optional(),
  kategoriler: z.array(z.string()).default([]),
  adres: z.string().optional(),
});
export type SupplierItem = z.infer<typeof SupplierItemSchema>;

// --- PAKET TİPLERİ ---
export const PackageDefinitionSchema = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2),
  hizmetId: z.string().uuid(),
  toplamSeans: z.number().int().positive(),
  fiyat: z.number().positive(),
  aktif: z.boolean().default(true),
});
export type PackageDefinition = z.infer<typeof PackageDefinitionSchema>;

// --- YORUM & VİTRİN TİPLERİ ---
export const CustomerReviewSchema = z.object({
  id: z.string().uuid(),
  musteriAdi: z.string().min(2),
  puan: z.number().int().min(1).max(5),
  yorum: z.string().optional(),
  tarih: z.string(),
  kaynak: z.enum(["Google", "Salon", "Hizmet Sonrası"]),
  hizmetTuru: z.string().optional(),
  googleReviewUrl: z.string().url().optional(),
  createdAt: z.string().optional(),
  randevuId: z.string().optional(),
});
export type CustomerReview = z.infer<typeof CustomerReviewSchema>;

export const GalleryItemSchema = z.object({
  id: z.string().uuid(),
  baslik: z.string().min(2),
  kategori: z.string().min(2),
  gorselUrl: z.string().min(1),
  stilist: z.string().min(2).default("Yıldız Bayan Kuaförü"),
  aciklama: z.string().optional(),
  begeniSayisi: z.number().int().nonnegative().default(0),
  yorumSayisi: z.number().int().nonnegative().optional(),
  medyaTuru: z.enum(["image", "video"]).default("image"),
  kapakUrl: z.string().optional(),
  sira: z.number().int().optional(),
});
export type GalleryItem = z.infer<typeof GalleryItemSchema>;

export const GalleryCommentSchema = z.object({
  id: z.string().uuid(),
  galleryItemId: z.string().uuid(),
  musteriAdi: z.string().min(2),
  yorum: z.string().min(1),
  tarih: z.string(),
  aktif: z.boolean().default(true),
  olusturulmaTarihi: z.string().optional(),
});
export type GalleryComment = z.infer<typeof GalleryCommentSchema>;

export const SalonInfoSchema = z.object({
  ad: z.string(),
  slogan: z.string(),
  adres: z.string(),
  telefon: z.string(),
  whatsapp: z.string(),
  eposta: z.string().default("info@yildizkuafor.com"),
  googleHaritaUrl: z.string().default("https://maps.google.com"),
  instagram: z.string(),
  tiktok: z.string().default("@yildizkuafor"),
  facebook: z.string().default("Yıldız Bayan Kuaförü"),
  calismaSaatleri: z.object({
    haftaIci: z.string(),
    cumartesi: z.string(),
    pazar: z.string(),
  }),
  varsayilanTamponSureDakika: z.number().default(15),
});
export type SalonInfo = z.infer<typeof SalonInfoSchema>;

export const SpecialDaySchema = z.object({
  id: z.string().uuid(),
  tarih: z.string(),
  aciklama: z.string(),
  kapali: z.boolean().default(true),
  ozelSaatler: z.string().optional(),
});
export type SpecialDay = z.infer<typeof SpecialDaySchema>;

export const BookingRulesSchema = z.object({
  tamponSureDakika: z.number().nonnegative().default(15),
  blokajSuresiDakika: z.number().nonnegative().default(30),
  sadakatPuaniAktif: z.boolean().default(true),
  eFaturaAktif: z.boolean().default(true),
});
export type BookingRules = z.infer<typeof BookingRulesSchema>;

export interface HeroTexts {
  badge: string;
  altRozet?: string;
  title: string;
  titleHighlight: string;
  titleEnd: string;
  description: string;
  lookbookBadge: string;
  lookbookTitle: string;
  butonRandevu?: string;
  butonGaleri?: string;
}

export interface HeroMediaTexts {
  gorselUrl: string;
  rozet: string;
  baslik: string;
  altBaslik: string;
}

export interface HeroFeatureItem {
  baslik: string;
  aciklama: string;
}

export interface SectionHeaderTexts {
  rozet: string;
  baslik: string;
  aciklama: string;
  googleRating?: number;
  googleReviewCount?: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  googleWriteReviewUrl?: string;
  lastGoogleSyncAt?: string;
}

export interface TrackerSectionTexts {
  rozet: string;
  baslik: string;
  aciklama: string;
  butonMetni: string;
}

export interface HomeCTATexts {
  rozet: string;
  baslik: string;
  aciklama: string;
  butonMetni: string;
}

export interface AboutTexts {
  quote: string;
  founder: string;
  storyTitle: string;
  storyText: string;
  manifestoTitle: string;
}

export interface ContactTexts {
  welcomeTitle: string;
  welcomeSubtitle: string;
  transitNote: string;
}

export interface ArtistVipFeature {
  baslik: string;
  aciklama: string;
}

export interface ArtistSectionTexts {
  ustRozet: string;
  anaBaslik: string;
  altBaslik: string;
  etiket: string;
  adSoyad: string;
  unvan: string;
  gorselUrl: string;
  gorselRozet: string;
  alintiSoz: string;
  biyografi: string;
  vipOzellikler: ArtistVipFeature[];
  butonMetni: string;
}

export interface PageTexts {
  hero: HeroTexts;
  heroMedia: HeroMediaTexts;
  heroFeatures: HeroFeatureItem[];
  artist: ArtistSectionTexts;
  servicesSection: SectionHeaderTexts;
  reviewsSection: SectionHeaderTexts;
  trackerSection: TrackerSectionTexts;
  homeCTA: HomeCTATexts;
  about: AboutTexts;
  contact: ContactTexts;
  gallery?: SectionHeaderTexts;
}

export const HeroTextsSchema = z.object({
  badge: z.string(),
  altRozet: z.string().optional(),
  title: z.string(),
  titleHighlight: z.string(),
  titleEnd: z.string(),
  description: z.string(),
  lookbookBadge: z.string(),
  lookbookTitle: z.string(),
  butonRandevu: z.string().optional(),
  butonGaleri: z.string().optional(),
});

export const HeroMediaTextsSchema = z.object({
  gorselUrl: z.string(),
  rozet: z.string(),
  baslik: z.string(),
  altBaslik: z.string(),
});

export const HeroFeatureItemSchema = z.object({
  baslik: z.string(),
  aciklama: z.string(),
});

export const SectionHeaderTextsSchema = z.object({
  rozet: z.string(),
  baslik: z.string(),
  aciklama: z.string(),
  googleRating: z.number().optional(),
  googleReviewCount: z.number().optional(),
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  googleWriteReviewUrl: z.string().optional(),
  lastGoogleSyncAt: z.string().optional(),
});

export const TrackerSectionTextsSchema = z.object({
  rozet: z.string(),
  baslik: z.string(),
  aciklama: z.string(),
  butonMetni: z.string(),
});

export const HomeCTATextsSchema = z.object({
  rozet: z.string(),
  baslik: z.string(),
  aciklama: z.string(),
  butonMetni: z.string(),
});

export const AboutTextsSchema = z.object({
  quote: z.string(),
  founder: z.string(),
  storyTitle: z.string(),
  storyText: z.string(),
  manifestoTitle: z.string(),
});

export const ContactTextsSchema = z.object({
  welcomeTitle: z.string(),
  welcomeSubtitle: z.string(),
  transitNote: z.string(),
});

export const ArtistVipFeatureSchema = z.object({
  baslik: z.string(),
  aciklama: z.string(),
});

export const ArtistSectionTextsSchema = z.object({
  ustRozet: z.string(),
  anaBaslik: z.string(),
  altBaslik: z.string(),
  etiket: z.string(),
  adSoyad: z.string(),
  unvan: z.string(),
  gorselUrl: z.string(),
  gorselRozet: z.string(),
  alintiSoz: z.string(),
  biyografi: z.string(),
  vipOzellikler: z.array(ArtistVipFeatureSchema),
  butonMetni: z.string(),
});

export const PageTextsSchema = z.object({
  hero: HeroTextsSchema,
  heroMedia: HeroMediaTextsSchema,
  heroFeatures: z.array(HeroFeatureItemSchema),
  artist: ArtistSectionTextsSchema,
  servicesSection: SectionHeaderTextsSchema,
  reviewsSection: SectionHeaderTextsSchema,
  trackerSection: TrackerSectionTextsSchema,
  homeCTA: HomeCTATextsSchema,
  about: AboutTextsSchema,
  contact: ContactTextsSchema,
});

// --- RANDEVU SİHİRBAZI FORM TİPLERİ ---
export const BookingWizardFormSchema = z.object({
  secilenHizmetIdleri: z.array(z.string().uuid()).min(1, "En az bir hizmet seçilmelidir"),
  calisanId: z.string().nullable(), // null: 'Fark Etmez / İlk Müsait Uzman'
  tarih: z.string().min(10, "Lütfen bir randevu tarihi seçin"),
  saat: z.string().min(5, "Lütfen bir randevu saati seçin"),
  musteriAd: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  musteriSoyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  musteriTelefon: z.string().regex(/^(\+90|0)?[1-9][0-9]{9}$/, "Geçerli bir telefon numarası giriniz"),
  not: z.string().optional(),
});
export type BookingWizardFormData = z.infer<typeof BookingWizardFormSchema>;

// --- İŞ KURALLARI HESAPLAMA FONKSİYONLARI ---

/**
 * Paket İadesi Hesabı:
 * Kalan seans × (müşterinin ödediği net tutar ÷ seans sayısı)
 */
export function calculatePackageRefund(
  remainingSessions: number,
  netPaid: number,
  totalSessions: number,
): number {
  if (totalSessions <= 0 || remainingSessions <= 0 || netPaid <= 0) {
    return 0;
  }
  const perSessionPrice = netPaid / totalSessions;
  const refund = remainingSessions * perSessionPrice;
  return Math.round(refund * 100) / 100;
}

/**
 * Sadakat Puanı Kazanımı:
 * Her 10 TL harcamaya 1 puan
 */
export function calculateLoyaltyPoints(spendingAmount: number): number {
  if (spendingAmount <= 0) {
    return 0;
  }
  return Math.floor(spendingAmount / 10);
}

/**
 * Sadakat Puanı İndirim Tutarı:
 * 100 puan = 50 TL indirim (1 puan = 0.5 TL)
 */
export function calculateLoyaltyDiscount(points: number): number {
  if (points <= 0) {
    return 0;
  }
  return points * 0.5;
}

/**
 * Komisyon Tutarı:
 * Hizmet net tutarı * (oran / 100)
 */
export function calculateCommission(netServiceAmount: number, ratePercentage: number): number {
  if (netServiceAmount <= 0 || ratePercentage <= 0) {
    return 0;
  }
  return Math.round(netServiceAmount * (ratePercentage / 100) * 100) / 100;
}

/**
 * Randevu Toplam Süresi:
 * Hizmetlerin toplam süresi + tampon süre (dakika)
 */
export function calculateAppointmentTotalDuration(
  serviceDurations: readonly number[],
  bufferMinutes: number = 0,
): number {
  const servicesTotal = serviceDurations.reduce((acc, curr) => acc + (curr > 0 ? curr : 0), 0);
  return servicesTotal + (bufferMinutes > 0 ? bufferMinutes : 0);
}

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * YYYY-MM-DD ve HH:mm formatındaki tarih-saati Türkiye sabit saat dilimiyle (+03:00)
 * doğrular ve ISO-8601 formatına dönüştürür.
 */
export function toIstanbulIso(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  const isoWithOffset = `${cleanDate}T${cleanTime}:00+03:00`;
  const parsed = new Date(isoWithOffset);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Geçersiz tarih veya saat formatı: ${cleanDate} ${cleanTime}`);
  }
  return isoWithOffset;
}

export const DEFAULT_WORKING_HOURS = {
  haftaIci: "09:00 - 20:00",
  cumartesi: "09:00 - 20:30",
  pazar: "10:00 - 18:00",
} as const;

export function parseWorkingWindow(
  rangeStr?: string | null,
): { openMinutes: number; closeMinutes: number; openFormatted: string; closeFormatted: string } | null {
  if (!rangeStr) return null;
  const normalized = rangeStr.toLowerCase();
  if (
    normalized.includes("kapalı") ||
    normalized.includes("kapali") ||
    normalized.includes("closed")
  ) {
    return null;
  }
  const match = rangeStr.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const openHour = Number(match[1]);
  const openMin = Number(match[2]);
  const closeHour = Number(match[3]);
  const closeMin = Number(match[4]);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  if (closeMinutes <= openMinutes) return null;
  return {
    openMinutes,
    closeMinutes,
    openFormatted: `${String(openHour).padStart(2, "0")}:${String(openMin).padStart(2, "0")}`,
    closeFormatted: `${String(closeHour).padStart(2, "0")}:${String(closeMin).padStart(2, "0")}`,
  };
}

export function normalizeWorkingHours(raw: unknown): {
  haftaIci: string;
  cumartesi: string;
  pazar: string;
} {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const pick = (candidates: string[], fallback: string): string => {
      for (const key of candidates) {
        const val = obj[key];
        if (typeof val === "string" && val.trim().length > 0) {
          return val.trim();
        }
      }
      return fallback;
    };

    return {
      haftaIci: pick(
        [
          "haftaIci",
          "hafta_ici",
          "haftaici",
          "weekday",
          "pazartesi",
          "sali",
          "carsamba",
          "persembe",
          "cuma",
        ],
        DEFAULT_WORKING_HOURS.haftaIci,
      ),
      cumartesi: pick(
        ["cumartesi", "Cumartesi", "saturday", "Saturday"],
        DEFAULT_WORKING_HOURS.cumartesi,
      ),
      pazar: pick(
        ["pazar", "Pazar", "sunday", "Sunday"],
        DEFAULT_WORKING_HOURS.pazar,
      ),
    };
  }

  return {
    haftaIci: DEFAULT_WORKING_HOURS.haftaIci,
    cumartesi: DEFAULT_WORKING_HOURS.cumartesi,
    pazar: DEFAULT_WORKING_HOURS.pazar,
  };
}

export interface FlexibleSpecialDay {
  id?: string;
  tarih?: string;
  date?: string;
  aciklama?: string;
  kapali?: boolean;
  isClosed?: boolean;
  ozelSaatler?: string;
  open?: string;
  close?: string;
}

export function checkIstanbulBusinessHours(
  apptDate: Date,
  rawCalismaSaatleri?: unknown,
  specialDays?: readonly FlexibleSpecialDay[],
): { valid: boolean; error?: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(apptDate);
  const yyyy = parts.find((p) => p.type === "year")?.value ?? "";
  const mm = parts.find((p) => p.type === "month")?.value ?? "";
  const dd = parts.find((p) => p.type === "day")?.value ?? "";
  const istanbulDateKey = `${yyyy}-${mm}-${dd}`;
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const apptMinutes = hour * 60 + minute;

  const rawObj =
    typeof rawCalismaSaatleri === "object" && rawCalismaSaatleri !== null
      ? (rawCalismaSaatleri as Record<string, unknown>)
      : {};

  const combinedSpecialDays: FlexibleSpecialDay[] = [
    ...(Array.isArray(rawObj.specialDays)
      ? (rawObj.specialDays as FlexibleSpecialDay[])
      : []),
    ...(Array.isArray(specialDays) ? specialDays : []),
  ];

  const matchedSpecialDay = combinedSpecialDays.find(
    (sd) => (sd?.date ?? sd?.tarih) === istanbulDateKey,
  );

  if (matchedSpecialDay) {
    const isClosed = matchedSpecialDay.isClosed ?? matchedSpecialDay.kapali ?? false;
    if (isClosed) {
      return {
        valid: false,
        error: `Salonumuz ${istanbulDateKey} tarihinde özel gün / resmi tatil nedeniyle hizmet vermemektedir (Kapalı).`,
      };
    }

    const customRange =
      matchedSpecialDay.open && matchedSpecialDay.close
        ? `${matchedSpecialDay.open} - ${matchedSpecialDay.close}`
        : matchedSpecialDay.ozelSaatler;

    if (customRange) {
      if (/kapalı|kapali|closed/i.test(customRange)) {
        return {
          valid: false,
          error: `Salonumuz ${istanbulDateKey} tarihinde hizmet vermemektedir (Kapalı).`,
        };
      }
      const specialWindow = parseWorkingWindow(customRange);
      if (specialWindow) {
        if (
          apptMinutes < specialWindow.openMinutes ||
          apptMinutes >= specialWindow.closeMinutes
        ) {
          return {
            valid: false,
            error: `Randevu saati özel gün çalışma saatleri dışındadır (${specialWindow.openFormatted} - ${specialWindow.closeFormatted}).`,
          };
        }
        return { valid: true };
      }
    }
  }

  const normalizedHours = normalizeWorkingHours(rawCalismaSaatleri);
  let scheduleStr: string;
  let dayNameTr: string;

  if (weekday === "Sun") {
    scheduleStr = normalizedHours.pazar;
    dayNameTr = "Pazar";
  } else if (weekday === "Sat") {
    scheduleStr = normalizedHours.cumartesi;
    dayNameTr = "Cumartesi";
  } else {
    scheduleStr = normalizedHours.haftaIci;
    dayNameTr = "Hafta içi";
  }

  if (/kapalı|kapali|closed/i.test(scheduleStr)) {
    return {
      valid: false,
      error: `Salonumuz ${dayNameTr} günleri hizmet vermemektedir (Kapalı).`,
    };
  }

  const windowRange = parseWorkingWindow(scheduleStr);
  if (!windowRange) {
    return { valid: true };
  }

  if (apptMinutes < windowRange.openMinutes || apptMinutes >= windowRange.closeMinutes) {
    return {
      valid: false,
      error: `Randevu saati çalışma saatleri dışındadır. ${dayNameTr} çalışma saatlerimiz: ${windowRange.openFormatted} - ${windowRange.closeFormatted}`,
    };
  }

  return { valid: true };
}

/**
 * Türk Lirası para birimi biçimlendirici (örn: 1.250 ₺)
 */
export function formatTRY(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(safeAmount)} ₺`;
}

/**
 * Telefon metninden yalnızca rakamları ayıklar.
 */
export function extractPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Türkiye mobil telefon numarasının geçerli olup olmadığını kontrol eder.
 */
export function isValidTrPhone(raw: string): boolean {
  const digits = extractPhoneDigits(raw);
  if (digits.length === 10 && digits.startsWith("5")) return true;
  if (digits.length === 11 && digits.startsWith("05")) return true;
  if (digits.length === 12 && digits.startsWith("905")) return true;
  return false;
}

/**
 * Telefon numarasını Türkiye E.164 standardına (+905XXXXXXXXX) dönüştürür.
 */
export function normalizeTrPhone(raw: string): string {
  const cleanPhone = extractPhoneDigits(raw);
  if (!cleanPhone) return "";
  return cleanPhone.startsWith("90")
    ? `+${cleanPhone}`
    : cleanPhone.startsWith("0")
      ? `+90${cleanPhone.slice(1)}`
      : `+90${cleanPhone}`;
}

/**
 * Şartname Madde 4 & 15:
 * Bekleyen randevunun oluşturulma zamanından itibaren çalışma saatleri ve
 * özel günler (SpecialDay her zaman önceliklidir) dikkate alınarak kaç
 * çalışma dakikası geçtiğini hesaplar.
 */
export function calculateElapsedWorkingMinutes(
  createdAtIso: string,
  nowIso: string,
  workingHours: Record<string, string>,
  specialDays?: SpecialDay[],
): number {
  const startMs = new Date(createdAtIso).getTime();
  const endMs = new Date(nowIso).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }

  const shiftedStart = new Date(startMs + ISTANBUL_OFFSET_MS);
  const shiftedEnd = new Date(endMs + ISTANBUL_OFFSET_MS);

  let currentDayAnchorMs = Date.UTC(
    shiftedStart.getUTCFullYear(),
    shiftedStart.getUTCMonth(),
    shiftedStart.getUTCDate(),
  );
  const lastDayAnchorMs = Date.UTC(
    shiftedEnd.getUTCFullYear(),
    shiftedEnd.getUTCMonth(),
    shiftedEnd.getUTCDate(),
  );

  let totalWorkingMinutes = 0;

  while (currentDayAnchorMs <= lastDayAnchorMs) {
    const dayDate = new Date(currentDayAnchorMs);
    const yyyy = dayDate.getUTCFullYear();
    const mm = String(dayDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dayDate.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = dayDate.getUTCDay(); // 0: Pazar, 6: Cumartesi

    const specialDay = specialDays?.find((sd) => sd.tarih === dateKey);
    let scheduleStr: string | undefined;

    if (specialDay) {
      scheduleStr = specialDay.kapali ? "Kapalı" : specialDay.ozelSaatler;
    } else if (dayOfWeek === 0) {
      scheduleStr = workingHours.pazar;
    } else if (dayOfWeek === 6) {
      scheduleStr = workingHours.cumartesi;
    } else {
      scheduleStr = workingHours.haftaIci ?? workingHours.hafta_ici;
    }

    const windowRange = parseWorkingWindow(scheduleStr);
    if (windowRange) {
      const realDayMidnightMs = currentDayAnchorMs - ISTANBUL_OFFSET_MS;
      const windowOpenMs = realDayMidnightMs + windowRange.openMinutes * 60 * 1000;
      const windowCloseMs = realDayMidnightMs + windowRange.closeMinutes * 60 * 1000;

      const overlapStart = Math.max(startMs, windowOpenMs);
      const overlapEnd = Math.min(endMs, windowCloseMs);
      if (overlapEnd > overlapStart) {
        totalWorkingMinutes += (overlapEnd - overlapStart) / 60000;
      }
    }

    currentDayAnchorMs += DAY_MS;
  }

  return Math.floor(totalWorkingMinutes);
}

/**
 * Şartname Madde 4 & 15:
 * Bekleyen randevunun çalışma saatleri içindeki blokaj süresinin (varsayılan 30 dk)
 * dolup dolmadığını kontrol eder.
 */
export function isPendingAppointmentExpired(
  createdAtIso: string,
  nowIso: string,
  timeoutMinutes: number,
  workingHours: Record<string, string>,
  specialDays?: SpecialDay[],
): boolean {
  const effectiveTimeout = timeoutMinutes > 0 ? timeoutMinutes : 30;
  const elapsed = calculateElapsedWorkingMinutes(
    createdAtIso,
    nowIso,
    workingHours,
    specialDays,
  );
  return elapsed >= effectiveTimeout;
}

// --- ORTAK GÜVENLİ KİMLİK / UUID YARDIMCISI ---

/**
 * Hem HTTPS hem güvenli olmayan yerel ağ (HTTP / 192.168.x.x) ortamında
 * çalışan RFC4122 v4 uyumlu güvenli UUID üreteci.
 */
export function generateSafeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- SOSYAL MEDYA BAĞLANTI YARDIMCILARI ---

/**
 * Facebook profil, sayfa veya arama bağlantısı üretici.
 * Kullanıcı adı, @etiket, boşluklu isim veya doğrudan URL girilse dahi çalışır.
 */
export function formatFacebookUrl(value?: string | null): string {
  if (!value || !value.trim()) return "https://facebook.com";
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const clean = trimmed.replace(/^@/, "");
  if (clean.includes(" ")) return `https://www.facebook.com/search/top?q=${encodeURIComponent(clean)}`;
  return `https://facebook.com/${clean}`;
}

// --- DATABASE TYPES EXPORT ---
export * from "./database.types";

