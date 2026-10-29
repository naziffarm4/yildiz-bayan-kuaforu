import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@yildiz/types";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL ve Anon Key ortam değişkenleri tanımlanmamış.");
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch (err: unknown) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Server Component çerez yazma atlandı:", err);
          }
        }
      },
    },
  });
}
