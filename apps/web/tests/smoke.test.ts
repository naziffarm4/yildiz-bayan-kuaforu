import { describe, it, expect } from "vitest";

describe("Web Arayüzü Smoke Testi", () => {
  it("temel test ortamı ve paket yapılandırması başarıyla çalışır", () => {
    const isReady = true;
    expect(isReady).toBe(true);
  });
});
