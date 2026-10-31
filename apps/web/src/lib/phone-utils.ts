import { normalizeTrPhone } from "@yildiz/types";

/**
 * Telefon numarasını Türkiye E.164 standardına (+905XXXXXXXXX) dönüştürür.
 */
export const normalizePhoneNumber = normalizeTrPhone;
export { normalizeTrPhone };
