import crypto from "node:crypto";
import { NextResponse } from "next/server";

export function verifyCronRequest(
  request: Request
): { authorized: true } | { authorized: false; response: NextResponse } {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || cronSecret.length < 16) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Sunucu yapılandırma hatası: CRON_SECRET tanımlı değil veya çok kısa." },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;

  const providedHash = crypto.createHash("sha256").update(authHeader).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();

  const isMatch =
    authHeader.length === expected.length &&
    crypto.timingSafeEqual(providedHash, expectedHash);

  if (!isMatch) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Yetkisiz erişim. Geçersiz cron anahtarı." },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
