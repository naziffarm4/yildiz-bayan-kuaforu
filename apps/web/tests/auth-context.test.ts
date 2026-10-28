import { describe, it, expect } from "vitest";
import {
  useAuth,
  normalizePhoneNumber,
  getDevAuthUser,
} from "../src/lib/auth-context";

describe("AuthContext & Auth Utilities", () => {
  describe("useAuth Hook Boundary", () => {
    it("React bileşeni bağlamı dışında çağrıldığında kural gereği hata fırlatmalıdır", () => {
      expect(() => useAuth()).toThrow();
    });
  });

  describe("normalizePhoneNumber: E.164 Telefon Numarası Formatlama", () => {
    it("Başında 0 olan 11 haneli Türkiye numarasını +90 formatına çevirir", () => {
      expect(normalizePhoneNumber("05321000001")).toBe("+905321000001");
    });

    it("Başında 90 olan numarayı +90 formatına çevirir", () => {
      expect(normalizePhoneNumber("905321000001")).toBe("+905321000001");
    });

    it("Özel karakterler ve boşluklar içeren numarayı temizler", () => {
      expect(normalizePhoneNumber("(0532) 100 00 01")).toBe("+905321000001");
    });

    it("Başında 0 veya 90 olmayan 10 haneli numaraya +90 ekler", () => {
      expect(normalizePhoneNumber("5321000001")).toBe("+905321000001");
    });

    it("Boş string verildiğinde boş string döner", () => {
      expect(normalizePhoneNumber("")).toBe("");
    });
  });

  describe("getDevAuthUser: Geliştirme Ortamı Test Kullanıcısı Belirleme", () => {
    it("Admin e-postası veya admin telefon numarası için Admin rolü üretir", () => {
      const adminEmailUser = getDevAuthUser("admin@yildizkuafor.com");
      expect(adminEmailUser.rol).toBe("Admin");
      expect(adminEmailUser.ad).toBe("Yıldız");

      const adminPhoneUser = getDevAuthUser("05321000001");
      expect(adminPhoneUser.rol).toBe("Admin");
      expect(adminPhoneUser.ad).toBe("Yıldız");
    });

    it("Çalışan e-postası veya telefonu için Calisan rolü üretir", () => {
      const staffEmailUser = getDevAuthUser("elif@yildizkuafor.com");
      expect(staffEmailUser.rol).toBe("Calisan");
      expect(staffEmailUser.ad).toBe("Elif");

      const staffPhoneUser = getDevAuthUser("05321000002");
      expect(staffPhoneUser.rol).toBe("Calisan");
    });

    it("Diğer genel kullanıcılar için Musteri rolü ve 140 sadakat puanı üretir", () => {
      const customer = getDevAuthUser("selin@gmail.com");
      expect(customer.rol).toBe("Musteri");
      expect(customer.toplamPuan).toBe(140);
      expect(customer.smsDogrulandi).toBe(true);
    });
  });

  describe("Telefon Formatlama Güvenliği", () => {
    it("Harf ve geçersiz karakterleri filtreler", () => {
      expect(normalizePhoneNumber("abc0555 123 45 67xyz")).toBe("+905551234567");
    });
  });
});
