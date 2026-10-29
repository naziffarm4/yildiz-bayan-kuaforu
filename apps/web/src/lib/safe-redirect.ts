function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return true;
    }
  }
  return false;
}

export function safeRedirectPath(
  next: string | null | undefined,
  origin?: string,
  fallback = "/profil"
): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    hasControlCharacters(next)
  ) {
    return fallback;
  }

  const baseOrigin = origin || "http://localhost";
  try {
    const baseUrl = new URL(baseOrigin);
    const url = new URL(next, baseUrl.origin);
    if (url.origin !== baseUrl.origin) {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
