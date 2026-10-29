import { NextResponse } from "next/server";
import type { z } from "zod";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Geçersiz JSON gövdesi." },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(raw);
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
