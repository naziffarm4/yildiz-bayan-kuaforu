import { z } from "zod";

export const ClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL geçerli bir URL olmalıdır."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlanmalıdır."),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL geçerli bir URL olmalıdır.")
    .default("https://yildizbayankuaforu.com"),
});

export const ServerEnvSchema = ClientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY tanımlanmalıdır."),
  CRON_SECRET: z
    .string()
    .min(32, "CRON_SECRET en az 32 karakter uzunluğunda olmalıdır."),
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
});

export function validateEnv(
  env: Record<string, string | undefined> = process.env,
  includeServer = false
) {
  return includeServer ? ServerEnvSchema.safeParse(env) : ClientEnvSchema.safeParse(env);
}
