import { validateEnv } from "@/lib/env";

export async function register(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    const result = validateEnv(process.env, true);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join("; ");
      console.error(`[instrumentation] Eksik veya geçersiz ortam değişkenleri: ${issues}`);
    }
  }
}
