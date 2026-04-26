import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockQueryBuilder,
  type QueryResult,
} from "../helpers/mock-supabase";
import { getPlanLimits } from "@/lib/plan";

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

type WidgetsMockOptions = {
  auth?: AuthResult;
  workspace?: QueryResult;
  widgetsCount?: { count: number | null; error: unknown };
  widgetsInsert?: QueryResult;
  widgetsUpdate?: QueryResult;
  widgetsDelete?: { error: unknown };
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
  widgetsCountBuilder: CountBuilder | null;
  widgetsInsertBuilder: ReturnType<typeof createMockQueryBuilder> | null;
  widgetsUpdateBuilder: ReturnType<typeof createMockQueryBuilder> | null;
  widgetsDeleteBuilder: DeleteBuilder | null;
};

function setupWidgetsMock(options: WidgetsMockOptions = {}): ReturnedSupabase {
  const {
    auth,
    workspace,
    widgetsCount,
    widgetsInsert,
    widgetsUpdate,
    widgetsDelete,
  } = options;

  const workspaceBuilder = workspace ? createMockQueryBuilder(workspace) : null;
  const widgetsCountBuilder = widgetsCount
    ? createCountBuilder(widgetsCount)
    : null;
  const widgetsInsertBuilder = widgetsInsert
    ? createMockQueryBuilder(widgetsInsert)
    : null;
  const widgetsUpdateBuilder = widgetsUpdate
    ? createMockQueryBuilder(widgetsUpdate)
    : null;
  const widgetsDeleteBuilder = widgetsDelete
    ? createDeleteBuilder(widgetsDelete)
    : null;

  let widgetsCallCount = 0;

  const from = vi.fn((table: string) => {
    if (table === "workspaces") {
      return workspaceBuilder ?? createMockQueryBuilder({ data: null, error: null });
    }
    if (table === "widgets") {
      widgetsCallCount += 1;
      // POST path: 1st call = count, 2nd call = insert
      if (widgetsCountBuilder && widgetsCallCount === 1) {
        return widgetsCountBuilder;
      }
      if (
        widgetsInsertBuilder &&
        (widgetsCallCount === 2 || !widgetsCountBuilder)
      ) {
        return widgetsInsertBuilder;
      }
      if (widgetsUpdateBuilder) {
        return widgetsUpdateBuilder;
      }
      if (widgetsDeleteBuilder) {
        return widgetsDeleteBuilder;
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
    widgetsCountBuilder,
    widgetsInsertBuilder,
    widgetsUpdateBuilder,
    widgetsDeleteBuilder,
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
// POST /api/widgets
// =========================================================================
describe("POST /api/widgets", () => {
  const validBody = {
    name: "トップページ用カルーセル",
    type: "carousel",
    theme: {
      mode: "light",
      brandColor: "#6366F1",
      showRating: true,
      showAvatar: false,
      showDate: false,
      maxItems: 10,
      autoplay: true,
    },
    filter_min_rating: 4,
    only_featured: false,
  };

  it("有効なbodyで200とinsert後のdataを返す", async () => {
    const insertedWidget = {
      id: "widget-1",
      workspace_id: "ws-1",
      name: validBody.name,
      type: validBody.type,
    };
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsCount: { count: 0, error: null },
      widgetsInsert: { data: insertedWidget, error: null },
    });

    const { POST } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: insertedWidget });
    expect(mock.supabase.from).toHaveBeenNthCalledWith(1, "workspaces");
    expect(mock.supabase.from).toHaveBeenNthCalledWith(2, "widgets");
    expect(mock.supabase.from).toHaveBeenNthCalledWith(3, "widgets");
    expect(mock.widgetsInsertBuilder?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "ws-1",
        name: validBody.name,
        type: validBody.type,
        theme: validBody.theme,
        filter_min_rating: validBody.filter_min_rating,
        only_featured: validBody.only_featured,
      })
    );
  });

  it("未認証で401を返す", async () => {
    setupWidgetsMock({});

    const { POST } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { POST } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
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
      forms: Infinity,
      widgets: 1,
      dashboardTestimonials: 10,
      displayTestimonials: 5,
      showBadge: true,
    });

    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsCount: { count: 1, error: null },
      widgetsInsert: { data: { id: "should-not-be-called" }, error: null },
    });

    const { POST } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      ok: false,
      error: "ウィジェット数が上限に達しています",
      code: "PLAN_LIMIT",
    });
    expect(mock.widgetsInsertBuilder?.insert).not.toHaveBeenCalled();
  });

  it("バリデーション失敗で400を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsCount: { count: 0, error: null },
      widgetsInsert: { data: null, error: null },
    });

    const { POST } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "POST",
      body: { ...validBody, type: "INVALID_TYPE" },
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

  it("insertがDBエラー（制約違反等）で500を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsCount: { count: 0, error: null },
      widgetsInsert: {
        data: null,
        error: { message: "duplicate key value violates unique constraint" },
      },
    });

    const { POST } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "ウィジェットの作成に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });
});

// =========================================================================
// PATCH /api/widgets
// =========================================================================
describe("PATCH /api/widgets", () => {
  const validPatchBody = {
    id: "widget-1",
    name: "更新後のウィジェット名",
    filter_min_rating: 5,
  };

  it("有効なbodyで200とupdate後のdataを返す", async () => {
    const updatedWidget = {
      id: "widget-1",
      workspace_id: "ws-1",
      name: validPatchBody.name,
      filter_min_rating: validPatchBody.filter_min_rating,
    };
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsUpdate: { data: updatedWidget, error: null },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: updatedWidget });
    // widgetUpdateSchema は partial だが、create スキーマ由来の default 値
    // （例: only_featured=false）が parsed.data に混ざる可能性があるため、
    // 提供済みフィールドが確実に含まれていることだけを検証する
    expect(mock.widgetsUpdateBuilder?.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPatchBody.name,
        filter_min_rating: validPatchBody.filter_min_rating,
      })
    );
    // 所有権ガード: id と workspace_id の両方で絞っているか
    expect(mock.widgetsUpdateBuilder?.eq).toHaveBeenCalledWith(
      "id",
      "widget-1"
    );
    expect(mock.widgetsUpdateBuilder?.eq).toHaveBeenCalledWith(
      "workspace_id",
      "ws-1"
    );
  });

  it("未認証で401を返す", async () => {
    setupWidgetsMock({});

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ ok: false, error: "Workspace not found", code: "NOT_FOUND" });
  });

  it("id欠落で400 \"IDが必要です\"を返す", async () => {
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsUpdate: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: { name: "更新" },
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "IDが必要です",
      code: "VALIDATION_ERROR",
    });
    expect(mock.widgetsUpdateBuilder?.update).not.toHaveBeenCalled();
  });

  it("idが文字列でない場合400を返す", async () => {
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsUpdate: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: { id: 123, name: "更新" },
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: "IDが必要です",
      code: "VALIDATION_ERROR",
    });
    expect(mock.widgetsUpdateBuilder?.update).not.toHaveBeenCalled();
  });

  it("バリデーション失敗で400を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsUpdate: { data: null, error: null },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: { id: "widget-1", type: "INVALID_TYPE" },
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
    setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsUpdate: {
        data: null,
        error: { message: "update failed" },
      },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "ウィジェットの更新に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });

  it("他workspaceのwidgetへのPATCH試行で500を返す（RLS不ヒット想定）", async () => {
    // 所有権ガードの意味論: .eq('workspace_id', ws.id) で RLS 的に絞り込み、
    // 見つからなければ .single() が PGRST116 を返す → 500
    setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsUpdate: {
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      },
    });

    const { PATCH } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "PATCH",
      body: validPatchBody,
    });
    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: "ウィジェットの更新に失敗しました",
      code: "INTERNAL_ERROR",
    });
  });
});

// =========================================================================
// DELETE /api/widgets
// =========================================================================
describe("DELETE /api/widgets", () => {
  const validDeleteBody = { id: "widget-1" };

  it("有効なidで200と{ok:true,data:null}を返す", async () => {
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
    expect(mock.widgetsDeleteBuilder?.delete).toHaveBeenCalled();
    expect(mock.widgetsDeleteBuilder?.eq).toHaveBeenCalledWith(
      "id",
      "widget-1"
    );
    expect(mock.widgetsDeleteBuilder?.eq).toHaveBeenCalledWith(
      "workspace_id",
      "ws-1"
    );
  });

  it("未認証で401を返す", async () => {
    setupWidgetsMock({});

    const { DELETE } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("workspaceが無い場合404を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: { data: null, error: null },
    });

    const { DELETE } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
      method: "DELETE",
      body: validDeleteBody,
    });
    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ ok: false, error: "Workspace not found", code: "NOT_FOUND" });
  });

  it("id欠落で400を返す", async () => {
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
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
    expect(mock.widgetsDeleteBuilder?.delete).not.toHaveBeenCalled();
  });

  it("idが空文字で400を返す", async () => {
    const mock = setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsDelete: { error: null },
    });

    const { DELETE } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
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
    expect(mock.widgetsDeleteBuilder?.delete).not.toHaveBeenCalled();
  });

  it("deleteがDBエラーで500を返す", async () => {
    setupWidgetsMock({
      auth: authedUser,
      workspace: workspaceRow,
      widgetsDelete: { error: { message: "delete failed" } },
    });

    const { DELETE } = await import("@/app/api/widgets/route");
    const request = makeNextRequest("http://localhost/api/widgets", {
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
