import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AllowedRole = "Admin" | "Calisan";

export type RouteHandler<TContext = unknown> = (
  request: Request,
  context?: TContext
) => Promise<Response> | Response;

/**
 * Rol Bazlı Rota Koruma Koruması (API Guard)
 * createClient() (SSR) ile oturumdaki kullanıcıyı ve public.profiles rolünü doğrular.
 * Oturum yoksa 401, rolü allowedRoles içinde değilse 403 'Yetkisiz erişim' yanıtı döner.
 */
export function withRole<TContext = unknown>(
  allowedRoles: readonly AllowedRole[],
  handler: RouteHandler<TContext>
) {
  return async (request: Request, context?: TContext): Promise<Response> => {
    try {
      const supabase = await createClient();
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
        !allowedRoles.includes(profile.rol as AllowedRole)
      ) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
      }

      const safeRequest = request || new Request("http://localhost");
      return await handler(safeRequest, context);
    } catch (err: unknown) {
      console.warn("API Guard yetkilendirme doğrulaması sırasında hata:", err);
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
  };
}

/**
 * Yalnızca Admin Rolü İçin Rota Koruması
 */
export function withAdminAuth<TContext = unknown>(handler: RouteHandler<TContext>) {
  return withRole(["Admin"], handler);
}

/**
 * Admin ve Personel (Çalışan) Rota Koruması
 */
export function withStaffOrAdminAuth<TContext = unknown>(
  handler: RouteHandler<TContext>
) {
  return withRole(["Admin", "Calisan"], handler);
}
