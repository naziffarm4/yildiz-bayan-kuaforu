export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { executeGoogleSync } from "@/services/google-sync.service";

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (!cronSecret) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası: CRON_SECRET tanımlı değil." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const isAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Geçersiz cron anahtarı." },
        { status: 401 }
      );
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
