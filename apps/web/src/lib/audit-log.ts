import type { Json } from "@yildiz/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface AuditLogInput {
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

    const query = supabase.from("audit_logs");
    if (!query || typeof query.insert !== "function") return;

    await query.insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as unknown as Json,
      ip_address: input.ipAddress ?? null,
    });
  } catch (err: unknown) {
    console.error("[audit-log] Denetim kaydı yazılamadı:", err);
  }
}
