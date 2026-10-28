import { describe, it, expect } from "vitest";
import {
  calculatePackageRefund,
  calculateLoyaltyPoints,
  calculateLoyaltyDiscount,
  calculateCommission,
  calculateAppointmentTotalDuration,
  calculateElapsedWorkingMinutes,
  isPendingAppointmentExpired,
  generateSafeUUID,
  formatFacebookUrl,
  AppointmentStatusSchema,
  UserRoleSchema,
  CustomerReviewSchema,
  BookingWizardFormSchema,
  type SpecialDay,
} from "../src/index";

describe("İş Kuralları - Paket İadesi", () => {
  it("kalan seans ve net ödenen tutara göre iadeyi doğru hesaplar", () => {
    // 10 seanslık paket 5000 TL, 4 seans kalmışsa: 4 * (5000 / 10) = 2000 TL
    const refund = calculatePackageRefund(4, 5000, 10);
    expect(refund).toBe(2000);
  });

  it("kalan seans 0 veya negatif ise 0 döner", () => {
    expect(calculatePackageRefund(0, 5000, 10)).toBe(0);
    expect(calculatePackageRefund(-1, 5000, 10)).toBe(0);
  });

  it("toplam seans 0 ise 0 döner", () => {
    expect(calculatePackageRefund(2, 5000, 0)).toBe(0);
  });
});

describe("İş Kuralları - Sadakat Puanı", () => {
  it("her 10 TL için 1 puan kazandırır", () => {
    expect(calculateLoyaltyPoints(100)).toBe(10);
    expect(calculateLoyaltyPoints(155)).toBe(15);
    expect(calculateLoyaltyPoints(9)).toBe(0);
  });

  it("100 puanın 50 TL indirim sağladığını hesaplar", () => {
    expect(calculateLoyaltyDiscount(100)).toBe(50);
    expect(calculateLoyaltyDiscount(50)).toBe(25);
    expect(calculateLoyaltyDiscount(0)).toBe(0);
  });
});

describe("İş Kuralları - Komisyon ve Süre Hesaplama", () => {
  it("çalışan komisyonunu yüzdeye göre hesaplar", () => {
    // 1000 TL hizmet, %20 komisyon = 200 TL
    expect(calculateCommission(1000, 20)).toBe(200);
    expect(calculateCommission(750, 15)).toBe(112.5);
  });

  it("çoklu hizmet sürelerini ve tampon süreyi toplar", () => {
    // Saç kesim (45 dk) + Fön (30 dk) + 15 dk tampon = 90 dk
    expect(calculateAppointmentTotalDuration([45, 30], 15)).toBe(90);
    expect(calculateAppointmentTotalDuration([60], 0)).toBe(60);
  });
});

describe("Zod Şemaları Doğrulama", () => {
  it("tüm geçerli randevu durumlarını doğrular", () => {
    const statuses = [
      "Beklemede",
      "Onaylandı",
      "Tamamlandı",
      "İptal Edildi",
      "Gelmedi",
      "Süresi Doldu",
    ];
    for (const status of statuses) {
      expect(AppointmentStatusSchema.parse(status)).toBe(status);
    }
  });

  it("geçersiz rollerde hata fırlatır", () => {
    expect(() => UserRoleSchema.parse("SuperAdmin")).toThrow();
  });

  it("müşteri yorum şemasını ve puan aralığını doğrular", () => {
    const validReview = {
      id: "c3010000-0000-4000-8000-000000000001",
      musteriAdi: "Selin Doğan",
      puan: 5,
      yorum: "Harika bir deneyim.",
      tarih: "18 Ekim 2026",
      kaynak: "Google" as const,
    };
    expect(CustomerReviewSchema.parse(validReview)).toEqual(validReview);
    expect(() => CustomerReviewSchema.parse({ ...validReview, puan: 6 })).toThrow();
  });

  it("randevu sihirbazı form şeması eksik hizmette hata verir", () => {
    const invalidForm = {
      secilenHizmetIdleri: [],
      calisanId: null,
      tarih: "2026-10-22",
      saat: "14:30",
      musteriAd: "Ayşe",
      musteriSoyad: "Yılmaz",
      musteriTelefon: "05321234567",
    };
    expect(() => BookingWizardFormSchema.parse(invalidForm)).toThrow();
  });

  it("generateSafeUUID geçerli RFC4122 v4 UUID formatında kimlik üretir", () => {
    const uuid = generateSafeUUID();
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(regex);
  });

  describe("formatFacebookUrl Yardımcısı", () => {
    it("boş, null veya tanımsız değerde varsayılan facebook.com döner", () => {
      expect(formatFacebookUrl(null)).toBe("https://facebook.com");
      expect(formatFacebookUrl(undefined)).toBe("https://facebook.com");
      expect(formatFacebookUrl("")).toBe("https://facebook.com");
      expect(formatFacebookUrl("   ")).toBe("https://facebook.com");
    });

    it("doğrudan http veya https ile başlayan url leri olduğu gibi korur", () => {
      expect(formatFacebookUrl("https://facebook.com/yildiz")).toBe("https://facebook.com/yildiz");
      expect(formatFacebookUrl("http://fb.me/yildiz")).toBe("http://fb.me/yildiz");
    });

    it("@ ile başlayan veya doğrudan kullanıcı adını facebook URL sine dönüştürür", () => {
      expect(formatFacebookUrl("@yildizbayankuaforu")).toBe("https://facebook.com/yildizbayankuaforu");
      expect(formatFacebookUrl("yildizbayankuaforu")).toBe("https://facebook.com/yildizbayankuaforu");
    });

    it("boşluk içeren salon isimleri için Facebook arama URL si üretir", () => {
      expect(formatFacebookUrl("Yıldız Bayan Kuaförü")).toBe(
        "https://www.facebook.com/search/top?q=Y%C4%B1ld%C4%B1z%20Bayan%20Kuaf%C3%B6r%C3%BC"
      );
    });
  });
});

describe("İş Kuralları - Bekleyen Randevu 30 Dk Çalışma Saatleri Süre Dolumu (Madde 4 & 15)", () => {
  const defaultWorkingHours = {
    haftaIci: "09:00 - 20:00",
    cumartesi: "09:00 - 20:30",
    pazar: "Kapalı",
  };

  it("çalışma saatleri içinde geçen süreyi dakika olarak doğru hesaplar", () => {
    // Çarşamba 10:00 -> 10:35 (35 dakika çalışma süresi)
    const elapsed = calculateElapsedWorkingMinutes(
      "2026-10-28T10:00:00+03:00",
      "2026-10-28T10:35:00+03:00",
      defaultWorkingHours,
    );
    expect(elapsed).toBe(35);
    expect(
      isPendingAppointmentExpired(
        "2026-10-28T10:00:00+03:00",
        "2026-10-28T10:35:00+03:00",
        30,
        defaultWorkingHours,
      ),
    ).toBe(true);
  });

  it("çalışma saatleri dışında (gece / kapalı saatlerde) süreyi işletmez", () => {
    // Çarşamba 21:00'da alındı, Perşembe 09:20'de kontrol edildi -> Sadece 09:00-09:20 arası 20 dk işler (30 dk dolmadı)
    const elapsed = calculateElapsedWorkingMinutes(
      "2026-10-28T21:00:00+03:00",
      "2026-10-29T09:20:00+03:00",
      defaultWorkingHours,
    );
    expect(elapsed).toBe(20);
    expect(
      isPendingAppointmentExpired(
        "2026-10-28T21:00:00+03:00",
        "2026-10-29T09:20:00+03:00",
        30,
        defaultWorkingHours,
      ),
    ).toBe(false);

    // Kapanışa 10 dk kala (19:50) alındı, ertesi sabah 09:25'te kontrol edildi -> 10 + 25 = 35 dk (süresi doldu)
    const elapsedAcrossNight = calculateElapsedWorkingMinutes(
      "2026-10-28T19:50:00+03:00",
      "2026-10-29T09:25:00+03:00",
      defaultWorkingHours,
    );
    expect(elapsedAcrossNight).toBe(35);
    expect(
      isPendingAppointmentExpired(
        "2026-10-28T19:50:00+03:00",
        "2026-10-29T09:25:00+03:00",
        30,
        defaultWorkingHours,
      ),
    ).toBe(true);
  });

  it("kapalı günde (Pazar) süreyi işletmez, Pazartesi açılışından itibaren sayar", () => {
    // 2026-10-25 Pazar 14:00 -> 2026-10-26 Pazartesi 09:15 (15 dk)
    const elapsed = calculateElapsedWorkingMinutes(
      "2026-10-25T14:00:00+03:00",
      "2026-10-26T09:15:00+03:00",
      defaultWorkingHours,
    );
    expect(elapsed).toBe(15);
  });

  it("özel günleri (SpecialDay) her zaman standart çalışma saatlerine göre öncelikli uygular", () => {
    const specialDays: SpecialDay[] = [
      {
        id: "f9010000-0000-4000-8000-000000000001",
        tarih: "2026-10-29",
        aciklama: "Cumhuriyet Bayramı Resmi Tatili",
        kapali: true,
      },
      {
        id: "f9010000-0000-4000-8000-000000000002",
        tarih: "2026-12-31",
        aciklama: "Yılbaşı Özel Seansları",
        kapali: false,
        ozelSaatler: "10:00 - 14:00",
      },
    ];

    // 29 Ekim Perşembe resmi tatil (kapalı): Çarşamba 19:45'te alınan randevu Cuma 09:10'a kadar 15 + 10 = 25 dk işler
    const elapsedWithHoliday = calculateElapsedWorkingMinutes(
      "2026-10-28T19:45:00+03:00",
      "2026-10-30T09:10:00+03:00",
      defaultWorkingHours,
      specialDays,
    );
    expect(elapsedWithHoliday).toBe(25);

    // 31 Aralık özel saatler (10:00 - 14:00): 09:00 - 10:20 arasında sadece 20 dk işler
    const elapsedSpecialOpen = calculateElapsedWorkingMinutes(
      "2026-12-31T09:00:00+03:00",
      "2026-12-31T10:20:00+03:00",
      defaultWorkingHours,
      specialDays,
    );
    expect(elapsedSpecialOpen).toBe(20);
  });
});

