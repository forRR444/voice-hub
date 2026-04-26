import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockQueryBuilder,
  type QueryResult,
} from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Local request factory returning NextRequest (the route handler signature)
// ---------------------------------------------------------------------------

function makeNextRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
): NextRequest {
  const { method = "GET", body } = options;
  const headers: Record<string, string> = {};
  let serializedBody: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    serializedBody = JSON.stringify(body);
  }
  return new NextRequest(url, {
    method,
    headers,
    body: serializedBody,
  });
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockCreateServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

type AuthResult = { data: { user: unknown }; error: unknown };

type TestimonialsDeleteMockOptions = {
  auth?: AuthResult;
  workspace?: QueryResult;
  testimonialsDelete?: { error: unknown };
};

type DeleteBuilder = {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
};

function createDeleteBuilder(result: { error: unknown }): DeleteBuilder {
  const builder: DeleteBuilder = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn(),
  };
  // The route calls .delete().eq('id', ...).eq('workspace_id', ...)
  // First eq() returns the builder, second eq() resolves the promise.
  let eqCallCount = 0;
  builder.eq = vi.fn(() => {
    eqCallCount += 1;
    if (eqCallCount >= 2) {
      return Promise.resolve({ error: result.error });
    }
    return builder;
  });
  return builder;
}

type ReturnedSupabase = {
  supabase: {
    from: ReturnType<typeof vi.fn>;
    auth: { getUser: ReturnType<typeof vi.fn> };
  };
  workspaceBuilder: ReturnType<typeof createMockQueryBuilder> | null;
  testimonialsDeleteBuilder: DeleteBuilder | null;
};

function setupTestimonialsMock(
  options: TestimonialsDeleteMockOptions = {}
): ReturnedSupabase {
  const { auth, workspace, testimonialsDelete } = options;

  const workspaceBuilder = workspace ? createMockQueryBuilder(workspace) : null;
  const testimonialsDeleteBuilder = testimonialsDelete
    ? createDeleteBuilder(testimonialsDelete)
    : null;

  const from = vi.fn((table: string) => {
    if (table === "workspaces") {
      return (
        workspaceBuilder ?? createMockQueryBuilder({ data: null, error: null })
      );
    }
    if (table === "testimonials") {
      if (testimonialsDeleteBuilder) {
        return testimonialsDeleteBuilder;
      }
      return createMockQueryBuilder({ data: null, error: null });
    }
    return createMockQueryBuilder({ data: null, error: null });
  });

  const supabase = {
    from,
    auth: {
      getUser: vi.fn().mockResolvedValue(
        auth ?? {
          data: { user: null },
          error: { message: "Not authenticated" },
        }
      ),
    },
  };

  mockCreateServerClient.mockResolvedValue(supabase);

  return {
    supabase,
    workspaceBuilder,
    testimonialsDeleteBuilder,
  };
}

const authedUser: AuthResult = {
  data: { user: { id: "user-1" } },
  error: null,
};

const workspaceRow: QueryResult = {
  data: { id: "ws-1" },
  error: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// =========================================================================
// DELETE /api/testimonials
// =========================================================================
describe("DELETE /api/testimonials", () => {
  const validDeleteBody = { id: "testimonial-1" };

  it("有効なidで200と{success:true}を返す", async () => {
    const mock = setupTestimonialsMock({
      auth: authedUser,
      workspace: workspaceRow,
      testimonialsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/testimonials/route");
    const request = makeNextRequest("http://localhost/api/testimonials", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
    expect(mock.testimonialsDeleteBuilder?.delete).toHaveBeenCalled();
    expect(mock.testimonialsDeleteBuilder?.eq).toHaveBeenCalledWith(
      "id",
      "testimonial-1"
    );
    expect(mock.testimonialsDeleteBuilder?.eq).toHaveBeenCalledWith(
      "workspace_id",
      "ws-1"
    );
  });

  it("未認証で401を返す", async () => {
    setupTestimonialsMock({});

    const { DELETE } = await import("@/app/api/testimonials/route");
    const request = makeNextRequest("http://localhost/api/testimonials", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupTestimonialsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { DELETE } = await import("@/app/api/testimonials/route");
    const request = makeNextRequest("http://localhost/api/testimonials", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ ok: false, error: "Workspace not found", code: "NOT_FOUND" });
  });

  it("id欠落で400を返す", async () => {
    const mock = setupTestimonialsMock({
      auth: authedUser,
      workspace: workspaceRow,
      testimonialsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/testimonials/route");
    const request = makeNextRequest("http://localhost/api/testimonials", {
      method: "DELETE",
      body: {},
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ ok: false, error: "IDが必要です", code: "VALIDATION_ERROR" });
    expect(mock.testimonialsDeleteBuilder?.delete).not.toHaveBeenCalled();
  });

  it("idが空文字で400を返す", async () => {
    const mock = setupTestimonialsMock({
      auth: authedUser,
      workspace: workspaceRow,
      testimonialsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/testimonials/route");
    const request = makeNextRequest("http://localhost/api/testimonials", {
      method: "DELETE",
      body: { id: "" },
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ ok: false, error: "IDが必要です", code: "VALIDATION_ERROR" });
    expect(mock.testimonialsDeleteBuilder?.delete).not.toHaveBeenCalled();
  });

  it("deleteがDBエラーで500を返す", async () => {
    setupTestimonialsMock({
      auth: authedUser,
      workspace: workspaceRow,
      testimonialsDelete: { error: { message: "delete failed" } },
    });

    const { DELETE } = await import("@/app/api/testimonials/route");
    const request = makeNextRequest("http://localhost/api/testimonials", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ ok: false, error: "削除に失敗しました", code: "INTERNAL_ERROR" });
  });
});
