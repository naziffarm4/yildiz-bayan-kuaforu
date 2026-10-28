import { describe, it, expect, vi } from "vitest";
import { generateSafeUUID } from "../src/lib/uuid";

describe("generateSafeUUID", () => {
  it("standart ortamda geçerli RFC4122 v4 UUID formatında çıktı üretir", () => {
    const uuid = generateSafeUUID();
    const rfc4122Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(rfc4122Regex);
  });

  it("her çağrıda benzersiz UUID üretir", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateSafeUUID());
    }
    expect(set.size).toBe(100);
  });

  it("crypto.randomUUID undefined olduğunda (HTTP / yerel IP ortamı) yedek algoritma ile geçerli UUID üretir", () => {
    const originalCrypto = globalThis.crypto;

    // crypto.randomUUID fonksiyonunun bulunmadığı güvenli olmayan HTTP ortamını simüle et
    vi.stubGlobal("crypto", {
      ...originalCrypto,
      randomUUID: undefined,
    });

    const fallbackUuid = generateSafeUUID();
    const rfc4122Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(fallbackUuid).toMatch(rfc4122Regex);

    vi.unstubAllGlobals();
  });
});
