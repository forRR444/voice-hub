import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockQueryBuilder,
  makeRequest,
  type QueryResult,
} from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockCreateServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAuthedSupabase(
  user: { id: string } | null,
  workspaceResult?: QueryResult,
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
    },
    from: vi.fn(() =>
      createMockQueryBuilder(workspaceResult ?? { data: null, error: null }),
    ),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("requireUser", () => {
  it("getUser が null の場合 401 Unauthorized を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createAuthedSupabase(null));

    const { requireUser } = await import("@/lib/api-auth");
    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    const json = await result.response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("getUser が user を返す場合 ok:true を返す", async () => {
    mockCreateServerClient.mockResolvedValue(
      createAuthedSupabase({ id: "user-1" }),
    );

    const { requireUser } = await import("@/lib/api-auth");
    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("user-1");
    expect(result.supabase).toBeDefined();
  });
});

describe("requireAuthAndWorkspace", () => {
  it("getUser が null の場合 401 を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createAuthedSupabase(null));

    const { requireAuthAndWorkspace } = await import("@/lib/api-auth");
    const result = await requireAuthAndWorkspace();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("workspaces.select が null の場合 404 Workspace not found を返す", async () => {
    mockCreateServerClient.mockResolvedValue(
      createAuthedSupabase({ id: "user-1" }, { data: null, error: null }),
    );

    const { requireAuthAndWorkspace } = await import("@/lib/api-auth");
    const result = await requireAuthAndWorkspace();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(404);
    const json = await result.response.json();
    expect(json.error).toBe("Workspace not found");
  });

  it("正常系では ok:true と workspace.id を返す", async () => {
    mockCreateServerClient.mockResolvedValue(
      createAuthedSupabase(
        { id: "user-1" },
        { data: { id: "ws-1" }, error: null },
      ),
    );

    const { requireAuthAndWorkspace } = await import("@/lib/api-auth");
    const result = await requireAuthAndWorkspace();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.id).toBe("ws-1");
    expect(result.user.id).toBe("user-1");
  });
});

describe("requireAuthAndWorkspaceWithSubscription", () => {
  it("正常系では subscription_status を含む workspace を返す", async () => {
    mockCreateServerClient.mockResolvedValue(
      createAuthedSupabase(
        { id: "user-1" },
        {
          data: { id: "ws-1", subscription_status: "pro" },
          error: null,
        },
      ),
    );

    const { requireAuthAndWorkspaceWithSubscription } = await import(
      "@/lib/api-auth"
    );
    const result = await requireAuthAndWorkspaceWithSubscription();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.id).toBe("ws-1");
    expect(result.workspace.subscription_status).toBe("pro");
  });
});

describe("requireAuthAndWorkspaceFull", () => {
  it("正常系では全カラムの workspace を返す", async () => {
    const fullWorkspace = {
      id: "ws-1",
      user_id: "user-1",
      name: "My Workspace",
      onboarding_completed: true,
      subscription_status: "pro",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    mockCreateServerClient.mockResolvedValue(
      createAuthedSupabase(
        { id: "user-1" },
        { data: fullWorkspace, error: null },
      ),
    );

    const { requireAuthAndWorkspaceFull } = await import("@/lib/api-auth");
    const result = await requireAuthAndWorkspaceFull();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace).toEqual(fullWorkspace);
  });
});

describe("createWorkspaceDeleteHandler", () => {
  it("未認証の場合は 401 を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createAuthedSupabase(null));

    const { createWorkspaceDeleteHandler } = await import("@/lib/api-auth");
    const handler = createWorkspaceDeleteHandler("forms");

    const request = makeRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: { id: "form-1" },
    });
    // @ts-expect-error: `Request` is a runtime-compatible stand-in for `NextRequest` in tests
    const response = await handler(request);

    expect(response.status).toBe(401);
  });

  it("id が不足している場合は 400 を返す", async () => {
    mockCreateServerClient.mockResolvedValue(
      createAuthedSupabase(
        { id: "user-1" },
        { data: { id: "ws-1" }, error: null },
      ),
    );

    const { createWorkspaceDeleteHandler } = await import("@/lib/api-auth");
    const handler = createWorkspaceDeleteHandler("forms");

    const request = makeRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: {},
    });
    // @ts-expect-error: `Request` is a runtime-compatible stand-in for `NextRequest` in tests
    const response = await handler(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("IDが必要です");
  });

  it("正常系では success:true を返す", async () => {
    const workspaceBuilder = createMockQueryBuilder({
      data: { id: "ws-1" },
      error: null,
    });
    const formsBuilder = createMockQueryBuilder({ data: null, error: null });
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) =>
        table === "workspaces" ? workspaceBuilder : formsBuilder,
      ),
    };
    mockCreateServerClient.mockResolvedValue(supabase);

    const { createWorkspaceDeleteHandler } = await import("@/lib/api-auth");
    const handler = createWorkspaceDeleteHandler("forms");

    const request = makeRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: { id: "form-1" },
    });
    // @ts-expect-error: `Request` is a runtime-compatible stand-in for `NextRequest` in tests
    const response = await handler(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it("delete がエラーを返す場合は 500 を返す", async () => {
    const workspaceBuilder = createMockQueryBuilder({
      data: { id: "ws-1" },
      error: null,
    });
    const formsBuilder = createMockQueryBuilder({
      data: null,
      error: { message: "DB error" },
    });
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) =>
        table === "workspaces" ? workspaceBuilder : formsBuilder,
      ),
    };
    mockCreateServerClient.mockResolvedValue(supabase);

    const { createWorkspaceDeleteHandler } = await import("@/lib/api-auth");
    const handler = createWorkspaceDeleteHandler("forms");

    const request = makeRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: { id: "form-1" },
    });
    // @ts-expect-error: `Request` is a runtime-compatible stand-in for `NextRequest` in tests
    const response = await handler(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("削除に失敗しました");
  });
});
