import type { Json } from "@yildiz/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getRequestAuthContext } from "@/lib/auth/api-guard";
import { getClientIp } from "@/lib/rate-limit";

export interface AuditLogInput {
  request?: Request;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const authCtx = input.request ? getRequestAuthContext(input.request) : null;
    const actorId = input.actorId ?? authCtx?.userId ?? null;
    const actorRole = input.actorRole ?? authCtx?.role ?? null;
    const ipAddress =
      input.ipAddress ??
      authCtx?.ipAddress ??
      (input.request ? getClientIp(input.request) : null);

    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      actor_role: actorRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as unknown as Json,
      ip_address: ipAddress,
    });
  } catch (err: unknown) {
    console.error("[audit-log] Denetim kaydı yazılamadı:", err);
  }
}
