import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@yildiz/types";

let cachedClient: SupabaseClient<Database> | null = null;
let cachedUrl: string | undefined;
let cachedKey: string | undefined;

export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    cachedClient = null;
    cachedUrl = undefined;
    cachedKey = undefined;
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === serviceKey) {
    return cachedClient;
  }

  cachedUrl = url;
  cachedKey = serviceKey;
  cachedClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
