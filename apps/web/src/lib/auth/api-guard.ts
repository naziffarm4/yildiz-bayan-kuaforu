import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/rate-limit";

export type AllowedRole = "Admin" | "Calisan";

export interface ApiAuthContext {
  userId: string;
  role: AllowedRole;
  ipAddress: string;
}

export type RouteHandler<TContext = unknown> = (
  request: Request,
  context?: TContext
) => Promise<Response> | Response;

const requestAuthContextMap = new WeakMap<Request, ApiAuthContext>();

export function setRequestAuthContext(request: Request, ctx: ApiAuthContext): void {
  requestAuthContextMap.set(request, ctx);
}

export function getRequestAuthContext(request?: Request | null): ApiAuthContext | null {
  if (!request) return null;
  return requestAuthContextMap.get(request) ?? null;
}

/**
 * Rol Bazlı Rota Koruması (API Guard)
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

      let resolvedRole: string | null = null;
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("rol")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileError && profile?.rol) {
          resolvedRole = profile.rol;
        }
      } catch (profileErr: unknown) {
        console.warn("API Guard profil rol sorgusu uyarısı:", profileErr);
      }

      if (!resolvedRole) {
        resolvedRole =
          (user.app_metadata?.rol as string | undefined) ||
          (user.app_metadata?.role as string | undefined) ||
          null;
      }

      if (!resolvedRole || !allowedRoles.includes(resolvedRole as AllowedRole)) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
      }

      const safeRequest = request || new Request("http://localhost");
      const authCtx: ApiAuthContext = {
        userId: user.id,
        role: resolvedRole as AllowedRole,
        ipAddress: getClientIp(safeRequest),
      };
      requestAuthContextMap.set(safeRequest, authCtx);

      return await handler(safeRequest, (context ?? (authCtx as unknown as TContext)));
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
