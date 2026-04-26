import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockQueryBuilder,
  type QueryResult,
} from "../helpers/mock-supabase";
import { getPlanLimits } from "@/lib/plan";
import { DEFAULT_FORM_QUESTIONS } from "@/lib/default-questions";

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

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, getPlanLimits: vi.fn(actual.getPlanLimits) };
});

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

type AuthResult = { data: { user: unknown }; error: unknown };

type FormsMockOptions = {
  auth?: AuthResult;
  workspace?: QueryResult;
  formsCount?: { count: number | null; error: unknown };
  formsInsert?: QueryResult;
  formsUpdate?: QueryResult;
  formsDelete?: { error: unknown };
};

type CountBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
};

type DeleteBuilder = {
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
};

function createCountBuilder(countResult: {
  count: number | null;
  error: unknown;
}): CountBuilder {
  const builder: CountBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({
      count: countResult.count,
      error: countResult.error,
    }),
  };
  return builder;
}

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
  formsCountBuilder: CountBuilder | null;
  formsInsertBuilder: ReturnType<typeof createMockQueryBuilder> | null;
  formsUpdateBuilder: ReturnType<typeof createMockQueryBuilder> | null;
  formsDeleteBuilder: DeleteBuilder | null;
};

function setupFormsMock(options: FormsMockOptions = {}): ReturnedSupabase {
  const {
    auth,
    workspace,
    formsCount,
    formsInsert,
    formsUpdate,
    formsDelete,
  } = options;

  const workspaceBuilder = workspace ? createMockQueryBuilder(workspace) : null;
  const formsCountBuilder = formsCount ? createCountBuilder(formsCount) : null;
  const formsInsertBuilder = formsInsert
    ? createMockQueryBuilder(formsInsert)
    : null;
  const formsUpdateBuilder = formsUpdate
    ? createMockQueryBuilder(formsUpdate)
    : null;
  const formsDeleteBuilder = formsDelete
    ? createDeleteBuilder(formsDelete)
    : null;

  let formsCallCount = 0;

  const from = vi.fn((table: string) => {
    if (table === "workspaces") {
      return workspaceBuilder ?? createMockQueryBuilder({ data: null, error: null });
    }
    if (table === "forms") {
      formsCallCount += 1;
      // POST path: 1st call = count, 2nd call = insert
      if (formsCountBuilder && formsCallCount === 1) {
        return formsCountBuilder;
      }
      if (formsInsertBuilder && (formsCallCount === 2 || !formsCountBuilder)) {
        return formsInsertBuilder;
      }
      if (formsUpdateBuilder) {
        return formsUpdateBuilder;
      }
      if (formsDeleteBuilder) {
        return formsDeleteBuilder;
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
    formsCountBuilder,
    formsInsertBuilder,
    formsUpdateBuilder,
    formsDeleteBuilder,
  };
}

const authedUser: AuthResult = {
  data: { user: { id: "user-1" } },
  error: null,
};

const workspaceRow: QueryResult = {
  data: { id: "ws-1", subscription_status: "free" },
  error: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// =========================================================================
// POST /api/forms
// =========================================================================
describe("POST /api/forms", () => {
  const validBody = {
    slug: "my-form",
    title: "フィードバック",
    description: "お客様の声を聞かせてください",
    brand_color: "#6366F1",
    thank_you_message: "ありがとうございました",
    questions: DEFAULT_FORM_QUESTIONS,
  };

  it("有効なbodyで200とinsert後のdataを返す", async () => {
    const insertedForm = {
      id: "form-1",
      workspace_id: "ws-1",
      slug: validBody.slug,
      title: validBody.title,
    };
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsCount: { count: 0, error: null },
      formsInsert: { data: insertedForm, error: null },
    });

    const { POST } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: insertedForm });
    expect(mock.supabase.from).toHaveBeenNthCalledWith(1, "workspaces");
    expect(mock.supabase.from).toHaveBeenNthCalledWith(2, "forms");
    expect(mock.supabase.from).toHaveBeenNthCalledWith(3, "forms");
    expect(mock.formsInsertBuilder?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "ws-1",
        slug: validBody.slug,
        title: validBody.title,
        description: validBody.description,
        questions: validBody.questions,
        brand_color: validBody.brand_color,
        thank_you_message: validBody.thank_you_message,
      })
    );
  });

  it("未認証で401を返す", async () => {
    setupFormsMock({});

    const { POST } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { POST } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ ok: false, error: "Workspace not found", code: "NOT_FOUND" });
  });

  it("プラン上限到達時に403を返す（getPlanLimitsを有限値でモック）", async () => {
    vi.mocked(getPlanLimits).mockReturnValueOnce({
      testimonials: Infinity,
      forms: 1,
      widgets: Infinity,
      dashboardTestimonials: 10,
      displayTestimonials: 5,
      showBadge: true,
    });

    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsCount: { count: 1, error: null },
      formsInsert: { data: { id: "should-not-be-called" }, error: null },
    });

    const { POST } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      ok: false,
      error: "フォーム数が上限に達しています",
      code: "PLAN_LIMIT",
    });
    expect(mock.formsInsertBuilder?.insert).not.toHaveBeenCalled();
  });

  it("バリデーション失敗で400を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsCount: { count: 0, error: null },
      formsInsert: { data: null, error: null },
    });

    const { POST } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "POST",
      body: { ...validBody, slug: "INVALID_UPPER" },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "入力内容に不備があります",
      code: "VALIDATION_ERROR",
    });
  });

  it("insertがDBエラー（slug重複等）で500を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsCount: { count: 0, error: null },
      formsInsert: {
        data: null,
        error: { message: "duplicate key value violates unique constraint" },
      },
    });

    const { POST } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "フォームの作成に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });
});

// =========================================================================
// PATCH /api/forms
// =========================================================================
describe("PATCH /api/forms", () => {
  const validPatchBody = {
    id: "form-1",
    title: "更新後タイトル",
    description: "更新後の説明",
  };

  it("有効なbodyで200とupdate後のdataを返す", async () => {
    const updatedForm = {
      id: "form-1",
      workspace_id: "ws-1",
      title: validPatchBody.title,
      description: validPatchBody.description,
    };
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsUpdate: { data: updatedForm, error: null },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: updatedForm });
    expect(mock.formsUpdateBuilder?.update).toHaveBeenCalledWith({
      title: validPatchBody.title,
      description: validPatchBody.description,
    });
    // 所有権ガード: id と workspace_id の両方で絞っているか
    expect(mock.formsUpdateBuilder?.eq).toHaveBeenCalledWith("id", "form-1");
    expect(mock.formsUpdateBuilder?.eq).toHaveBeenCalledWith(
      "workspace_id",
      "ws-1"
    );
  });

  it("未認証で401を返す", async () => {
    setupFormsMock({});

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ ok: false, error: "Workspace not found", code: "NOT_FOUND" });
  });

  it("id欠落で400 \"IDが必要です\"を返す", async () => {
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsUpdate: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: { title: "更新" },
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "IDが必要です",
      code: "VALIDATION_ERROR",
    });
    expect(mock.formsUpdateBuilder?.update).not.toHaveBeenCalled();
  });

  it("idが文字列でない場合400を返す", async () => {
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsUpdate: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: { id: 123, title: "更新" },
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "IDが必要です",
      code: "VALIDATION_ERROR",
    });
    expect(mock.formsUpdateBuilder?.update).not.toHaveBeenCalled();
  });

  it("バリデーション失敗で400を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsUpdate: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: { id: "form-1", title: "" },
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "入力内容に不備があります",
      code: "VALIDATION_ERROR",
    });
  });

  it("updateがDBエラーで500を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsUpdate: {
        data: null,
        error: { message: "update failed" },
      },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "フォームの更新に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });

  it("他workspaceのformへのPATCH試行で500を返す（RLS不ヒット想定）", async () => {
    // 所有権ガードの意味論: .eq('workspace_id', ws.id) で RLS 的に絞り込み、
    // 見つからなければ .single() が PGRST116 を返す → 500
    setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsUpdate: {
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      },
    });

    const { PATCH } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "フォームの更新に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });
});

// =========================================================================
// DELETE /api/forms
// =========================================================================
describe("DELETE /api/forms", () => {
  const validDeleteBody = { id: "form-1" };

  it("有効なidで200と{ok:true,data:null}を返す", async () => {
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
    expect(mock.formsDeleteBuilder?.delete).toHaveBeenCalled();
    expect(mock.formsDeleteBuilder?.eq).toHaveBeenCalledWith("id", "form-1");
    expect(mock.formsDeleteBuilder?.eq).toHaveBeenCalledWith(
      "workspace_id",
      "ws-1"
    );
  });

  it("未認証で401を返す", async () => {
    setupFormsMock({});

    const { DELETE } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { DELETE } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ ok: false, error: "Workspace not found", code: "NOT_FOUND" });
  });

  it("id欠落で400を返す", async () => {
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: {},
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "IDが必要です",
      code: "VALIDATION_ERROR",
    });
    expect(mock.formsDeleteBuilder?.delete).not.toHaveBeenCalled();
  });

  it("idが空文字で400を返す", async () => {
    const mock = setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: { id: "" },
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "IDが必要です",
      code: "VALIDATION_ERROR",
    });
    expect(mock.formsDeleteBuilder?.delete).not.toHaveBeenCalled();
  });

  it("deleteがDBエラーで500を返す", async () => {
    setupFormsMock({
      auth: authedUser,
      workspace: workspaceRow,
      formsDelete: { error: { message: "delete failed" } },
    });

    const { DELETE } = await import("@/app/api/forms/route");
    const request = makeNextRequest("http://localhost/api/forms", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "削除に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });
});
