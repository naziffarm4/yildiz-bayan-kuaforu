export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data?.user) {
        return NextResponse.redirect(new URL("/giris?error=oauth", requestUrl.origin));
      }

      // Oturum açan kullanıcının profiles tablosundaki rolünü kontrol et
      const { data: profile } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.rol;

      if (role === "Admin" || role === "Calisan") {
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      }

      // Güvenli next parametresi yönlendirmesi (Open Redirect koruması)
      const safeNext = safeRedirectPath(next, requestUrl.origin, "/profil");
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    } catch {
      // Exchange veya oturum hatası durumunda hata ile giriş sayfasına yönlendir
      return NextResponse.redirect(new URL("/giris?error=oauth", requestUrl.origin));
    }
  }

  // code parametresi eksik veya geçersizse doğrudan giriş sayfasına yönlendir
  return NextResponse.redirect(new URL("/giris", requestUrl.origin));
}
