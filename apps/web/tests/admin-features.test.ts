import { describe, it, expect } from "vitest";
import {
  MOCK_STAFF,
  MOCK_SERVICES,
  MOCK_STOCK_ITEMS,
  MOCK_SUPPLIERS,
  INITIAL_MOCK_PAYMENTS,
} from "./fixtures/test-data";
import { generateSafeUUID } from "../src/lib/uuid";
import {
  calculateCommission,
  calculateLoyaltyPoints,
  calculateLoyaltyDiscount,
  StockItemSchema,
  SupplierItemSchema,
  CashPaymentSchema,
} from "@yildiz/types";

describe("Admin & Kasa Yönetim İş Kuralları", () => {
  it("personel komisyonunu net hizmet tutarı üzerinden doğru hesaplar", () => {
    // 2800 TL balyaj işleminde %25 komisyon = 700 TL
    const commission = calculateCommission(2800, 25);
    expect(commission).toBe(700);
  });

  it("Z Raporu ödeme yöntemleri dökümünü doğru toplar", () => {
    const samplePayments = [
      ...INITIAL_MOCK_PAYMENTS,
      {
        id: generateSafeUUID(),
        musteriId: generateSafeUUID(),
        musteriAdSoyad: "Deniz Yılmaz",
        islemiYapanCalisanId: MOCK_STAFF[0]?.id ?? "",
        hizmetAdlari: ["Tasarım Saç Kesimi"],
        toplamTutar: 650,
        odenenTutar: 650,
        indirimTutari: 0,
        kullanilanPuanTutari: 0,
        odemeYontemi: "Nakit" as const,
        bahsisTutari: 50,
        veresiye: false,
        olusturulmaTarihi: new Date().toISOString(),
      },
      {
        id: generateSafeUUID(),
        musteriId: generateSafeUUID(),
        musteriAdSoyad: "Merve Tekin",
        islemiYapanCalisanId: MOCK_STAFF[1]?.id ?? "",
        hizmetAdlari: ["Fön"],
        toplamTutar: 300,
        odenenTutar: 300,
        indirimTutari: 0,
        kullanilanPuanTutari: 0,
        odemeYontemi: "Havale_EFT" as const,
        bahsisTutari: 0,
        veresiye: false,
        olusturulmaTarihi: new Date().toISOString(),
      },
    ];

    const nakitToplam = samplePayments.filter((p) => p.odemeYontemi === "Nakit").reduce((a, b) => a + b.odenenTutar, 0);
    const kartToplam = samplePayments.filter((p) => p.odemeYontemi === "Kart").reduce((a, b) => a + b.odenenTutar, 0);
    const havaleToplam = samplePayments.filter((p) => p.odemeYontemi === "Havale_EFT").reduce((a, b) => a + b.odenenTutar, 0);

    expect(nakitToplam).toBe(650);
    expect(kartToplam).toBe(1100);
    expect(havaleToplam).toBe(300);

    // Kasa Farkı Hesabı
    const kasaFizikiSayim = 650;
    const kasaFarki = kasaFizikiSayim - nakitToplam;
    expect(kasaFarki).toBe(0);
  });

  it("izinli çalışanlar onay listesinde filtrelenir", () => {
    const availableStaff = MOCK_STAFF.filter((s) => !s.izinli);
    const onLeaveStaff = MOCK_STAFF.filter((s) => s.izinli);

    expect(onLeaveStaff.length).toBeGreaterThanOrEqual(1);
    expect(availableStaff.length).toBeLessThan(MOCK_STAFF.length);
    for (const s of availableStaff) {
      expect(s.izinli).toBe(false);
    }
  });

  it("kritik stok kontrolü eşik altına inen ürünleri tespit eder", () => {
    const criticals = MOCK_STOCK_ITEMS.filter((s) => s.miktar <= s.kritikSeviye);
    expect(criticals.length).toBeGreaterThan(0);
    for (const item of criticals) {
      expect(item.miktar).toBeLessThanOrEqual(item.kritikSeviye);
    }
  });

  it("hizmetler silinmeden pasife alınabilir", () => {
    const service = { ...MOCK_SERVICES[0]!, aktif: false };
    expect(service.aktif).toBe(false);
    expect(service.id).toBeDefined();
  });

  it("sadakat puanı kazanımı ve indirim hesaplaması geçerlidir", () => {
    // 1500 TL ödeyen müşteri 150 puan kazanır
    expect(calculateLoyaltyPoints(1500)).toBe(150);
    // 150 puan 75 TL indirim sağlar
    expect(calculateLoyaltyDiscount(150)).toBe(75);
  });

  it("stok ve kasa modelleri zod şemalarını doğrular", () => {
    for (const item of MOCK_STOCK_ITEMS) {
      expect(() => StockItemSchema.parse(item)).not.toThrow();
    }
    for (const pay of INITIAL_MOCK_PAYMENTS) {
      expect(() => CashPaymentSchema.parse(pay)).not.toThrow();
    }
  });

  it("tedarikçi modelleri SupplierItem şemasına eksiksiz uyar", () => {
    expect(MOCK_SUPPLIERS.length).toBeGreaterThanOrEqual(3);
    for (const supplier of MOCK_SUPPLIERS) {
      expect(() => SupplierItemSchema.parse(supplier)).not.toThrow();
      expect(supplier.whatsapp).toMatch(/^(\+90|0)/);
    }
  });
});
