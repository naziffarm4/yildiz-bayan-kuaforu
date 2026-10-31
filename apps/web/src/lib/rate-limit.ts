const MAX_BUCKETS = 5000;
const MAX_FALLBACK_BUCKETS = 250;
const MAX_IDEMPOTENCY_KEYS = 5000;

const buckets = new Map<string, number[]>();
const fallbackBuckets = new Map<string, number[]>();
const idempotencyKeys = new Map<string, number>();

function isFallbackRateKey(key: string): boolean {
  return key.startsWith("fallback:") || key.includes(":fallback:");
}

function pruneMapBuckets(
  store: Map<string, number[]>,
  now: number,
  windowMs: number
): void {
  const windowStart = now - windowMs;
  for (const [key, timestamps] of store.entries()) {
    const active = timestamps.filter((ts) => ts > windowStart);
    if (active.length === 0) {
      store.delete(key);
    } else if (active.length !== timestamps.length) {
      store.set(key, active);
    }
  }
}

function pruneIdempotencyKeys(now: number, ttlMs: number): void {
  for (const [key, createdAt] of idempotencyKeys.entries()) {
    if (now - createdAt >= ttlMs) {
      idempotencyKeys.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const ua = request.headers.get("user-agent")?.trim() ?? "";
  const lang = request.headers.get("accept-language")?.trim() ?? "";
  if (ua || lang) {
    return `fallback:${ua.slice(0, 40)}:${lang.slice(0, 20)}`;
  }

  return "fallback:anonymous";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const isFallback = isFallbackRateKey(key);
  const targetStore = isFallback ? fallbackBuckets : buckets;
  const maxStoreSize = isFallback ? MAX_FALLBACK_BUCKETS : MAX_BUCKETS;

  const existing = targetStore.get(key) ?? [];
  const activeTimestamps = existing.filter((ts) => ts > windowStart);

  if (activeTimestamps.length === 0 && existing.length > 0) {
    targetStore.delete(key);
  }

  if (targetStore.size >= maxStoreSize && !targetStore.has(key)) {
    pruneMapBuckets(targetStore, now, windowMs);
    if (targetStore.size >= maxStoreSize) {
      const oldestKey = targetStore.keys().next().value;
      if (oldestKey !== undefined) {
        targetStore.delete(oldestKey);
      }
    }
  }

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    targetStore.set(key, activeTimestamps);
    return { allowed: false, retryAfterSeconds };
  }

  activeTimestamps.push(now);
  targetStore.set(key, activeTimestamps);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function isDuplicateIdempotencyKey(key: string, ttlMs = 10 * 60_000): boolean {
  const now = Date.now();
  const prev = idempotencyKeys.get(key);
  if (prev === undefined) {
    return false;
  }
  if (now - prev < ttlMs) {
    return true;
  }
  idempotencyKeys.delete(key);
  return false;
}

export function recordIdempotencyKey(key: string, ttlMs = 10 * 60_000): void {
  const now = Date.now();
  if (idempotencyKeys.size >= MAX_IDEMPOTENCY_KEYS && !idempotencyKeys.has(key)) {
    pruneIdempotencyKeys(now, ttlMs);
    if (idempotencyKeys.size >= MAX_IDEMPOTENCY_KEYS) {
      const oldestKey = idempotencyKeys.keys().next().value;
      if (oldestKey !== undefined) {
        idempotencyKeys.delete(oldestKey);
      }
    }
  }
  idempotencyKeys.set(key, now);
}

export function resetRateLimiter(): void {
  buckets.clear();
  fallbackBuckets.clear();
  idempotencyKeys.clear();
}
