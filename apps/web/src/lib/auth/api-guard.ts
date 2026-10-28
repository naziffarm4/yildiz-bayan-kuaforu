import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type RouteHandler<TContext = unknown> = (
  request: Request,
  context?: TContext
) => Promise<Response> | Response;

/**
 * Admin ve Personel (Çalışan) Rota Koruma Koruması (API Guard)
 * createClient() (SSR) ile oturumdaki kullanıcıyı ve public.profiles rolünü doğrular.
 * Oturum yoksa 401, rolü Admin veya Calisan değilse 403 'Yetkisiz erişim' yanıtı döner.
 */
export function withStaffOrAdminAuth<TContext = unknown>(
  handler: (request: Request, context?: TContext) => Promise<Response> | Response
) {
  return async (request: Request, context?: TContext): Promise<Response> => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profileError ||
        !profile ||
        (profile.rol !== "Admin" && profile.rol !== "Calisan")
      ) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
      }

      const safeRequest = request || new Request("http://localhost");
      return await handler(safeRequest, context);
    } catch {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
  };
}
