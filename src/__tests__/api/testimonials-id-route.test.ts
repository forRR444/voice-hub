import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockQueryBuilder, type QueryResult } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Local request factory returning NextRequest
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

const mockRateLimitAsync = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: (...args: unknown[]) => mockRateLimitAsync(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AuthResult = { data: { user: unknown }; error: unknown };

type OwnerSelectBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

function createOwnerSelectBuilder(result: QueryResult): OwnerSelectBuilder {
  const builder: OwnerSelectBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return builder;
}

type UpdateBuilder = {
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
};

function createUpdateBuilder(result: { error: unknown }): UpdateBuilder {
  const builder: UpdateBuilder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn(),
  };
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

type DeleteBuilder = {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
};

function createDeleteBuilder(result: { error: unknown }): DeleteBuilder {
  const builder: DeleteBuilder = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn(),
  };
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

type SetupOptions = {
  auth?: AuthResult;
  workspace?: QueryResult;
  ownerSelect?: QueryResult;
  testimonialsUpdate?: { error: unknown };
  testimonialsDelete?: { error: unknown };
};

type ReturnedSupabase = {
  supabase: {
    from: ReturnType<typeof vi.fn>;
    auth: { getUser: ReturnType<typeof vi.fn> };
  };
  ownerSelectBuilder: OwnerSelectBuilder | null;
  updateBuilder: UpdateBuilder | null;
  deleteBuilder: DeleteBuilder | null;
};

function setupMock(options: SetupOptions = {}): ReturnedSupabase {
  const { auth, workspace, ownerSelect, testimonialsUpdate, testimonialsDelete } = options;

  const workspaceBuilder = workspace ? createMockQueryBuilder(workspace) : null;
  const ownerSelectBuilder = ownerSelect ? createOwnerSelectBuilder(ownerSelect) : null;
  const updateBuilder = testimonialsUpdate ? createUpdateBuilder(testimonialsUpdate) : null;
  const deleteBuilder = testimonialsDelete ? createDeleteBuilder(testimonialsDelete) : null;

  // testimonials テーブルへの呼び出しは:
  //   1回目: select(...).eq(...).maybeSingle() による ownership 検証 → ownerSelectBuilder
  //   2回目: update(...).eq(id).eq(workspace_id) または delete().eq(id).eq(workspace_id)
  let testimonialsCallCount = 0;

  const from = vi.fn((table: string) => {
    if (table === "workspaces") {
      return workspaceBuilder ?? createMockQueryBuilder({ data: null, error: null });
    }
    if (table === "testimonials") {
      testimonialsCallCount += 1;
      if (testimonialsCallCount === 1) {
        return ownerSelectBuilder ?? createOwnerSelectBuilder({ data: null, error: null });
      }
      if (updateBuilder) return updateBuilder;
      if (deleteBuilder) return deleteBuilder;
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
    ownerSelectBuilder,
    updateBuilder,
    deleteBuilder,
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

const validTestimonialId = "11111111-1111-4111-8111-111111111111";

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // デフォルトはレート制限通過
  mockRateLimitAsync.mockResolvedValue({ success: true });
});

// =========================================================================
// PATCH /api/testimonials/[id]
// =========================================================================
describe("PATCH /api/testimonials/[id]", () => {
  it("認証なしで401を返す", async () => {
    setupMock({});

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("レート制限超過で429を返す", async () => {
    mockRateLimitAsync.mockResolvedValue({ success: false });
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json.code).toBe("RATE_LIMITED");
  });

  it("不正なuuidで400を返す", async () => {
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest("http://localhost/api/testimonials/not-a-uuid", {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "not-a-uuid" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ ok: false, error: "IDが必要です", code: "VALIDATION_ERROR" });
  });

  it("不正なstatusで400を返す", async () => {
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "archived" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("別workspaceのtestimonialで404を返す", async () => {
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: { id: validTestimonialId, workspace_id: "ws-other" }, error: null },
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("存在しないtestimonialで404を返す", async () => {
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("status更新成功で200を返す", async () => {
    const mock = setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: { id: validTestimonialId, workspace_id: "ws-1" }, error: null },
      testimonialsUpdate: { error: null },
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
    expect(mock.updateBuilder?.update).toHaveBeenCalledWith({ status: "approved" });
    expect(mock.updateBuilder?.eq).toHaveBeenCalledWith("id", validTestimonialId);
    expect(mock.updateBuilder?.eq).toHaveBeenCalledWith("workspace_id", "ws-1");
  });

  it("is_featured更新成功で200を返す", async () => {
    const mock = setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: { id: validTestimonialId, workspace_id: "ws-1" }, error: null },
      testimonialsUpdate: { error: null },
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { is_featured: true },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
    expect(mock.updateBuilder?.update).toHaveBeenCalledWith({ is_featured: true });
  });

  it("更新でDBエラーが起きたら500を返す", async () => {
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: { id: validTestimonialId, workspace_id: "ws-1" }, error: null },
      testimonialsUpdate: { error: { message: "update failed" } },
    });

    const { PATCH } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: validTestimonialId }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ ok: false, error: "更新に失敗しました", code: "INTERNAL_ERROR" });
  });
});

// =========================================================================
// DELETE /api/testimonials/[id]
// =========================================================================
describe("DELETE /api/testimonials/[id]", () => {
  it("認証なしで401を返す", async () => {
    setupMock({});

    const { DELETE } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validTestimonialId }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("別workspaceのtestimonialで404を返す", async () => {
    setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: { id: validTestimonialId, workspace_id: "ws-other" }, error: null },
    });

    const { DELETE } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validTestimonialId }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("削除成功で200を返す", async () => {
    const mock = setupMock({
      auth: authedUser,
      workspace: workspaceRow,
      ownerSelect: { data: { id: validTestimonialId, workspace_id: "ws-1" }, error: null },
      testimonialsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/testimonials/[id]/route");
    const request = makeNextRequest(`http://localhost/api/testimonials/${validTestimonialId}`, {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validTestimonialId }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
    expect(mock.deleteBuilder?.delete).toHaveBeenCalled();
    expect(mock.deleteBuilder?.eq).toHaveBeenCalledWith("id", validTestimonialId);
    expect(mock.deleteBuilder?.eq).toHaveBeenCalledWith("workspace_id", "ws-1");
  });
});
