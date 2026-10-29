const buckets = new Map<string, number[]>();
const idempotencyKeys = new Map<string, number>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const existing = buckets.get(key) ?? [];
  const activeTimestamps = existing.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, activeTimestamps);
    return { allowed: false, retryAfterSeconds };
  }

  activeTimestamps.push(now);
  buckets.set(key, activeTimestamps);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function isDuplicateIdempotencyKey(key: string, ttlMs = 10 * 60_000): boolean {
  const prev = idempotencyKeys.get(key);
  if (prev !== undefined && Date.now() - prev < ttlMs) {
    return true;
  }
  return false;
}

export function recordIdempotencyKey(key: string): void {
  idempotencyKeys.set(key, Date.now());
}

export function resetRateLimiter(): void {
  buckets.clear();
  idempotencyKeys.clear();
}
