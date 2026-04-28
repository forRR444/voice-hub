import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeRequest } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockCreateServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

const mockCreateAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

const mockLogError = vi.fn();
vi.mock("@/lib/logger", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

vi.mock("@/lib/api-utils", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  handleApiError: vi.fn((_error: unknown, message: string) =>
    NextResponse.json({ error: message }, { status: 500 })
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createServerMock(user: { id: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

function createAdminMock(opts: {
  deleteUserError?: { message: string } | null;
  deleteUserThrow?: Error;
}) {
  const deleteUser = opts.deleteUserThrow
    ? vi.fn().mockRejectedValue(opts.deleteUserThrow)
    : vi.fn().mockResolvedValue({ error: opts.deleteUserError ?? null });
  return {
    auth: {
      admin: { deleteUser },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("DELETE /api/account", () => {
  it("未認証の場合は401を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock(null));

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", {
      method: "DELETE",
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("認証が必要です");
  });

  it("認証済みの場合、signOutしてauth.admin.deleteUserを呼び200を返す", async () => {
    const serverMock = createServerMock({ id: "user-1" });
    mockCreateServerClient.mockResolvedValue(serverMock);

    const adminMock = createAdminMock({});
    mockCreateAdminClient.mockReturnValue(adminMock);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", {
      method: "DELETE",
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: null });
    expect(serverMock.auth.signOut).toHaveBeenCalledTimes(1);
    expect(adminMock.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("auth.admin.deleteUserがerrorを返した場合、500とlogError呼び出し", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock({ id: "user-1" }));

    const adminMock = createAdminMock({
      deleteUserError: { message: "Failed to delete" },
    });
    mockCreateAdminClient.mockReturnValue(adminMock);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", {
      method: "DELETE",
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("アカウント削除に失敗しました");
    expect(mockLogError).toHaveBeenCalledWith("ユーザー認証情報の削除に失敗", {
      message: "Failed to delete",
    });
  });

  it("admin呼び出しがthrowした場合、catchで500を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock({ id: "user-1" }));

    const adminMock = createAdminMock({
      deleteUserThrow: new Error("network down"),
    });
    mockCreateAdminClient.mockReturnValue(adminMock);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", {
      method: "DELETE",
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("アカウント削除に失敗しました");
  });
});
