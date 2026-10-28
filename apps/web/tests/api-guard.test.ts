import { describe, it, expect, vi, beforeEach } from "vitest";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
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

describe("API Guard: withStaffOrAdminAuth", () => {
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

  it("Kullanıcı rolü 'Calisan' ise handler çağrılır ve 200 döner", async () => {
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

  it("Kullanıcı rolü 'Admin' ise handler çağrılır ve 200 döner", async () => {
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
});
