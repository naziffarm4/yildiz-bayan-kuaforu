/**
 * Telefon numarasını Türkiye E.164 standardına (+905XXXXXXXXX) dönüştürür.
 */
export function normalizePhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return "";
  return cleanPhone.startsWith("90")
    ? `+${cleanPhone}`
    : cleanPhone.startsWith("0")
      ? `+90${cleanPhone.slice(1)}`
      : `+90${cleanPhone}`;
}
