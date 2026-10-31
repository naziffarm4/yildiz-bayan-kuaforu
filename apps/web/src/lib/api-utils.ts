import { NextResponse } from "next/server";
import type { z } from "zod";

const SPECIAL_KEY_ALIASES: Record<string, string> = {
  musteri_ad_soyad: "musteri_ad_soyad",
  musteriadsoyad: "musteri_ad_soyad",
  musteriAdSoyad: "musteri_ad_soyad",
  galleryId: "gallery_item_id",
  gallery_id: "gallery_item_id",
  gorselUrl: "url",
  not: "notlar",
};

export function camelToSnakeKeys(obj: unknown): unknown {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const input = obj as Record<string, unknown>;
  const output: Record<string, unknown> = { ...input };

  for (const [key, value] of Object.entries(input)) {
    const aliasKey = SPECIAL_KEY_ALIASES[key];
    if (aliasKey && output[aliasKey] === undefined) {
      output[aliasKey] = value;
    }

    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (snakeKey !== key && output[snakeKey] === undefined) {
      output[snakeKey] = value;
    }
  }

  return output;
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch (jsonErr: unknown) {
    console.warn("JSON ayrıştırma uyarısı:", jsonErr);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Geçersiz JSON gövdesi." },
        { status: 400 }
      ),
    };
  }

  const normalizedRaw = camelToSnakeKeys(raw);
  const parsed = schema.safeParse(normalizedRaw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Geçersiz istek verisi.";
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: parsed.data };
}

export function safeErrorResponse(
  userMessage: string,
  status = 500,
  internalError?: unknown
): NextResponse {
  if (internalError !== undefined) {
    console.warn("[API Hatası]:", userMessage, internalError);
  }
  return NextResponse.json({ success: false, error: userMessage }, { status });
}
