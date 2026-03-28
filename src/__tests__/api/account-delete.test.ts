import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("@/lib/api-utils", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helper: テーブルごとの操作を記録するadmin mockを作成
// ---------------------------------------------------------------------------

function createAdminMock(opts: {
  workspace: { data: unknown; error: unknown };
  testimonials: { data: unknown; error: unknown };
  deleteUserError?: { message: string } | null;
}) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];

  function trackable(table: string, result: { data: unknown; error: unknown }) {
    const builder: Record<string, any> = {};
    for (const m of ["select", "insert", "update", "delete", "eq", "in"]) {
      builder[m] = vi.fn((...args: unknown[]) => {
        calls.push({ table, method: m, args });
        return builder;
      });
    }
    builder.single = vi.fn().mockResolvedValue(result);
    builder.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
    return builder;
  }

  const admin = {
    from: vi.fn((table: string) => {
      if (table === "workspaces") return trackable(table, opts.workspace);
      if (table === "testimonials") return trackable(table, opts.testimonials);
      return trackable(table, { data: null, error: null });
    }),
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({
          error: opts.deleteUserError ?? null,
        }),
      },
    },
  };

  return { admin, calls };
}

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
    const request = makeRequest("http://localhost/api/account", { method: "DELETE" });
    const response = await DELETE(request as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("認証が必要です");
  });

  it("認証済みの場合、全テーブルを削除してユーザーを削除する", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock({ id: "user-1" }));

    const { admin, calls } = createAdminMock({
      workspace: { data: { id: "ws-1" }, error: null },
      testimonials: { data: [{ id: "t-1" }, { id: "t-2" }], error: null },
    });
    mockCreateAdminClient.mockReturnValue(admin);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", { method: "DELETE" });
    const response = await DELETE(request as any);

    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);

    // 各テーブルにアクセスしたことを確認
    const tablesAccessed = [...new Set(calls.map((c) => c.table))];
    expect(tablesAccessed).toContain("workspaces");
    expect(tablesAccessed).toContain("testimonials");
    expect(tablesAccessed).toContain("testimonial_tags");
    expect(tablesAccessed).toContain("forms");
    expect(tablesAccessed).toContain("widgets");

    // 各テーブルでdeleteが呼ばれたことを確認
    const deleteCalls = calls.filter((c) => c.method === "delete");
    const deletedTables = deleteCalls.map((c) => c.table);
    expect(deletedTables).toContain("testimonial_tags");
    expect(deletedTables).toContain("testimonials");
    expect(deletedTables).toContain("forms");
    expect(deletedTables).toContain("widgets");
    expect(deletedTables).toContain("workspaces");

    // タグ削除で.in()がテスティモニアルIDで呼ばれたことを確認
    const tagInCalls = calls.filter((c) => c.table === "testimonial_tags" && c.method === "in");
    expect(tagInCalls.length).toBe(1);
    expect(tagInCalls[0].args).toEqual(["testimonial_id", ["t-1", "t-2"]]);

    // Supabase Authのユーザー削除が正しいIDで呼ばれたことを確認
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("テスティモニアルがない場合、タグ削除をスキップする", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock({ id: "user-1" }));

    const { admin, calls } = createAdminMock({
      workspace: { data: { id: "ws-1" }, error: null },
      testimonials: { data: [], error: null },
    });
    mockCreateAdminClient.mockReturnValue(admin);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", { method: "DELETE" });
    const response = await DELETE(request as any);

    expect(response.status).toBe(200);

    // タグ削除は呼ばれない
    const tagDeleteCalls = calls.filter((c) => c.table === "testimonial_tags" && c.method === "delete");
    expect(tagDeleteCalls.length).toBe(0);

    // 他のテーブルは削除される
    const deletedTables = calls.filter((c) => c.method === "delete").map((c) => c.table);
    expect(deletedTables).toContain("testimonials");
    expect(deletedTables).toContain("forms");
    expect(deletedTables).toContain("widgets");
    expect(deletedTables).toContain("workspaces");
  });

  it("ワークスペースがない場合、ユーザーのみ削除する", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock({ id: "user-1" }));

    const { admin, calls } = createAdminMock({
      workspace: { data: null, error: null },
      testimonials: { data: null, error: null },
    });
    mockCreateAdminClient.mockReturnValue(admin);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", { method: "DELETE" });
    const response = await DELETE(request as any);

    expect(response.status).toBe(200);

    // テーブル削除は呼ばれない（ワークスペースの取得のみ）
    const deleteCalls = calls.filter((c) => c.method === "delete");
    expect(deleteCalls.length).toBe(0);

    // ユーザー削除は呼ばれる
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("Auth削除に失敗した場合は500を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createServerMock({ id: "user-1" }));

    const { admin } = createAdminMock({
      workspace: { data: { id: "ws-1" }, error: null },
      testimonials: { data: [], error: null },
      deleteUserError: { message: "Failed to delete" },
    });
    mockCreateAdminClient.mockReturnValue(admin);

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", { method: "DELETE" });
    const response = await DELETE(request as any);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("アカウント削除に失敗しました");
  });
});
