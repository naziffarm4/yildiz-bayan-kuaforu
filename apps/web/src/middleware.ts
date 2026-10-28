import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@yildiz/types";
import { getSupabaseAdmin } from "./lib/supabase/admin";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Oturum ve kullanıcıyı doğrula
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/:path* Rota Koruması
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(loginUrl);
    }

    let userRole: string | null = null;

    try {
      const adminClient = getSupabaseAdmin();
      const dbClient = adminClient || supabase;

      const { data: profile } = await dbClient
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.rol) {
        userRole = profile.rol;
      }
    } catch (err: unknown) {
      console.warn("Middleware profil rol sorgusu başarısız oldu:", err);
    }

    if (!userRole) {
      userRole =
        (user.app_metadata?.rol as string | undefined) ||
        (user.app_metadata?.role as string | undefined) ||
        null;
    }

    if (userRole !== "Admin" && userRole !== "Calisan") {
      const unauthorizedUrl = new URL("/giris", request.url);
      unauthorizedUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // /profil/:path* Rota Koruması
  if (pathname.startsWith("/profil")) {
    if (!user) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("redirect", "/profil");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public files (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
