import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { withAdminAuth, withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle, maybeSingle: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

function collectRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
    } else if (entry.isFile() && entry.name === "route.ts") {
      files.push(fullPath);
    }
  }
  return files;
}

describe("API Guard: withStaffOrAdminAuth & withAdminAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Kullanıcı oturumu yoksa 401 Yetkisiz erişim döner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const guarded = withStaffOrAdminAuth(handler);

    const res = await guarded(new Request("http://localhost/api/admin/services"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Yetkisiz erişim");
    expect(handler).not.toHaveBeenCalled();
  });

  it("Kullanıcı rolü 'Musteri' ise 403 Yetkisiz erişim döner", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "musteri@example.com" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Musteri" },
      error: null,
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const guarded = withStaffOrAdminAuth(handler);

    const res = await guarded(new Request("http://localhost/api/admin/services"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Yetkisiz erişim");
    expect(handler).not.toHaveBeenCalled();
  });

  it("Kullanıcı rolü 'Calisan' ise withStaffOrAdminAuth 200 döner", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "staff-1", email: "calisan@yildizkuafor.com" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Calisan" },
      error: null,
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true, allowed: true }));
    const guarded = withStaffOrAdminAuth(handler);

    const res = await guarded(new Request("http://localhost/api/admin/services"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.allowed).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it("Kullanıcı rolü 'Admin' ise withStaffOrAdminAuth 200 döner", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@yildizkuafor.com" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Admin" },
      error: null,
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true, admin: true }));
    const guarded = withStaffOrAdminAuth(handler);

    const res = await guarded(new Request("http://localhost/api/admin/services"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.admin).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it("withAdminAuth: Kullanıcı rolü 'Calisan' ise 403 Yetkisiz erişim döner (G-08)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "staff-1", email: "calisan@yildizkuafor.com" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Calisan" },
      error: null,
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const guarded = withAdminAuth(handler);

    const res = await guarded(new Request("http://localhost/api/admin/settings"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Yetkisiz erişim");
    expect(handler).not.toHaveBeenCalled();
  });

  it("withAdminAuth: Kullanıcı rolü 'Admin' ise handler çağrılır ve 200 döner (G-08)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@yildizkuafor.com" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { rol: "Admin" },
      error: null,
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true, adminOnly: true }));
    const guarded = withAdminAuth(handler);

    const res = await guarded(new Request("http://localhost/api/admin/settings"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.adminOnly).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it("getSupabaseAdmin SUPABASE_SERVICE_ROLE_KEY yoksa NEXT_PUBLIC_SUPABASE_ANON_KEY'e düşmez ve null döner (S10)", () => {
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const origService = process.env.SUPABASE_SERVICE_ROLE_KEY;

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(getSupabaseAdmin()).toBeNull();

    if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origAnon) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origAnon;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (origService) process.env.SUPABASE_SERVICE_ROLE_KEY = origService;
  });

  it("src/app/api/admin altındaki tüm route.ts dosyaları merkezi API guard kullanır (K-07)", () => {
    const adminApiDir = path.resolve(__dirname, "../src/app/api/admin");
    const routeFiles = collectRouteFiles(adminApiDir);

    expect(routeFiles.length).toBeGreaterThan(0);

    for (const filePath of routeFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const hasGuard =
        content.includes("withStaffOrAdminAuth") ||
        content.includes("withAdminAuth") ||
        content.includes("withRole");
      expect(
        hasGuard,
        `${path.relative(adminApiDir, filePath)} dosyasında API Guard (withStaffOrAdminAuth / withAdminAuth / withRole) bulunamadı!`
      ).toBe(true);
    }
  });
});
