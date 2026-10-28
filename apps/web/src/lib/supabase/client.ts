import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@yildiz/types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL ve Anon Key ortam değişkenleri tanımlanmamış.');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
