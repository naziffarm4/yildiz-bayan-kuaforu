export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/auth/cron-auth";
import { safeErrorResponse } from "@/lib/api-utils";
import { executeGoogleSync } from "@/services/google-sync.service";

export async function GET(request: Request) {
  try {
    const auth = verifyCronRequest(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";
    const result = await executeGoogleSync(force);

    return NextResponse.json({
      cron: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cron senkronizasyon hatası";
    return safeErrorResponse(message, 500, err);
  }
}
