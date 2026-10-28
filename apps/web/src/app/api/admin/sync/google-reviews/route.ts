export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { executeGoogleSync } from "@/services/google-sync.service";

export async function POST(request: Request) {
  try {
    let force = false;

    // URL parametresinden force kontrolü
    const url = new URL(request.url);
    if (url.searchParams.get("force") === "true") {
      force = true;
    } else {
      // JSON body üzerinden force kontrolü
      const body = await request.json().catch(() => ({}));
      if (body && body.force === true) {
        force = true;
      }
    }

    const result = await executeGoogleSync(force);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";
    const result = await executeGoogleSync(force);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
