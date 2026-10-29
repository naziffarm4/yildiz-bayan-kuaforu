import type { AuthUser } from "@/lib/auth-context";

export function getDevAuthUser(identifier: string): AuthUser {
  const clean = identifier.toLowerCase().replace(/\s+/g, "");

  const isCalisan =
    clean.includes("elif") ||
    clean.includes("merve") ||
    clean.includes("seda") ||
    clean.includes("personel") ||
    clean.includes("calisan") ||
    clean.endsWith("1000002") ||
    clean.endsWith("1000003") ||
    clean.endsWith("1000004");

  const isSpecial =
    !isCalisan &&
    (clean.includes("admin") ||
      clean.startsWith("yildiz@") ||
      clean === "yildiz" ||
      clean.endsWith("1000001"));

  const staffName = clean.includes("merve")
    ? { ad: "Merve", soyad: "Aydın" }
    : clean.includes("seda")
      ? { ad: "Seda", soyad: "Kaya" }
      : { ad: "Elif", soyad: "Yıldırım" };

  return {
    id: isSpecial
      ? "b2010000-0000-4000-8000-000000000001"
      : isCalisan
        ? "c1010000-0000-4000-8000-000000000001"
        : "u1010000-0000-4000-8000-000000000001",
    ad: isSpecial ? "Yıldız" : isCalisan ? staffName.ad : "Selin",
    soyad: isSpecial ? "Yönetici" : isCalisan ? staffName.soyad : "Doğan",
    telefon: identifier.includes("@") ? "05321000001" : identifier,
    eposta: identifier.includes("@")
      ? identifier
      : `${isSpecial ? "admin" : isCalisan ? staffName.ad.toLowerCase() : "selin"}@yildizkuafor.com`,
    rol: isSpecial ? "Admin" : isCalisan ? "Calisan" : "Musteri",
    toplamPuan: isSpecial || isCalisan ? 0 : 140,
    smsDogrulandi: true,
  };
}
