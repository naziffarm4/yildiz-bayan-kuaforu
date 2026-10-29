export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/api-guard";
import { executeGoogleSync } from "@/services/google-sync.service";

export const POST = withAdminAuth(async (request: Request) => {
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
});
