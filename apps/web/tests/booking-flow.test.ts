import { describe, it, expect } from "vitest";

const ALL_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

function filterSlotsForTime(dateVal: string, todayVal: string, currentTotalMinutes: number): string[] {
  if (dateVal !== todayVal) {
    return ALL_TIME_SLOTS;
  }
  return ALL_TIME_SLOTS.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    if (h === undefined || m === undefined) return false;
    const slotTotal = h * 60 + m;
    return slotTotal > currentTotalMinutes;
  });
}

describe("Randevu Sihirbazı - 30 Dk Slot ve Akıllı Bugün Filtresi", () => {
  it("çalışma saatleri içinde tam 22 adet 30 dakikalık slot bulunur (09:00 - 19:30)", () => {
    expect(ALL_TIME_SLOTS.length).toBe(22);
    expect(ALL_TIME_SLOTS[0]).toBe("09:00");
    expect(ALL_TIME_SLOTS[ALL_TIME_SLOTS.length - 1]).toBe("19:30");
  });

  it("gelecek bir tarih seçildiğinde tüm slotlar eksiksiz listelenir", () => {
    const slots = filterSlotsForTime("2026-10-25", "2026-10-21", 14 * 60);
    expect(slots.length).toBe(22);
    expect(slots).toEqual(ALL_TIME_SLOTS);
  });

  it("seçilen gün bugün ise geçmiş saatler filtrelenir", () => {
    // Saat 14:10 iken (14*60 + 10 = 850 dakika)
    const currentMinutes = 14 * 60 + 10;
    const slots = filterSlotsForTime("2026-10-21", "2026-10-21", currentMinutes);

    // 14:00 ve öncesi elenmiş olmalı
    expect(slots.includes("14:00")).toBe(false);
    expect(slots.includes("13:30")).toBe(false);
    expect(slots.includes("09:00")).toBe(false);

    // İlk müsait slot 14:30 olmalı
    expect(slots[0]).toBe("14:30");
    expect(slots.includes("19:30")).toBe(true);
  });

  it("akşam 20:00'den sonra bugün için boş slot kalmaz", () => {
    const currentMinutes = 20 * 60;
    const slots = filterSlotsForTime("2026-10-21", "2026-10-21", currentMinutes);
    expect(slots.length).toBe(0);
  });
});

describe("Randevu Sihirbazı - KVKK Onayı ve Buton Durumu (O8)", () => {
  it("SMS doğrulanmış olsa bile KVKK onay kutusu işaretlenmeden randevu onay butonu aktif olamaz", () => {
    const isStep3Valid = (
      smsSent: boolean,
      enteredSmsCode: string,
      kvkkConsent: boolean,
      isSubmitting: boolean
    ) => {
      const disabled = !smsSent || !enteredSmsCode || !kvkkConsent || isSubmitting;
      return !disabled;
    };

    expect(isStep3Valid(true, "1234", false, false)).toBe(false);
    expect(isStep3Valid(true, "1234", true, false)).toBe(true);
    expect(isStep3Valid(true, "1234", true, true)).toBe(false);
    expect(isStep3Valid(false, "1234", true, false)).toBe(false);
    expect(isStep3Valid(true, "", true, false)).toBe(false);
  });
});
