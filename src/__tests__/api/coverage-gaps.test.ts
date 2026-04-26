import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import {
  createMockSupabase,
  createMockQueryBuilder,
  createMockRpcSupabase,
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

const mockCreateAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

const mockCreateSupabaseClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateSupabaseClient(...args),
}));

vi.mock("@/lib/utils", () => ({
  getBaseUrl: () => "http://localhost:3000",
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock rate limiting - allow controlling whether rate limit triggers
const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn().mockReturnValue("127.0.0.1");
const mockHandleApiError = vi.fn();
vi.mock("@/lib/api-utils", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
  handleApiError: (...args: unknown[]) => mockHandleApiError(...args),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  // Default: rate limit passes
  mockCheckRateLimit.mockResolvedValue(null);
  // Default: handleApiError returns a 500 response
  mockHandleApiError.mockImplementation(
    (
      _error: unknown,
      message = "サーバーエラーが発生しました",
      headers?: Record<string, string>
    ) => {
      return NextResponse.json(
        { error: message },
        { status: 500, ...(headers ? { headers } : {}) }
      );
    }
  );
});

// ========================
// DELETE /api/account - catch block (lines 63-64)
// ========================
describe("DELETE /api/account - catch block", () => {
  it("予期しない例外発生時に500を返す", async () => {
    // Make createClient throw an exception to trigger the outer catch
    mockCreateServerClient.mockRejectedValue(new Error("Unexpected crash"));

    const { DELETE } = await import("@/app/api/account/route");
    const request = makeRequest("http://localhost/api/account", { method: "DELETE" });
    const response = await DELETE(request as any);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("アカウント削除に失敗しました");
  });
});

// ========================
// GET /api/forms/[slug] - rate limit (line 13)
// ========================
describe("GET /api/forms/[slug] - rate limit", () => {
  it("レートリミット超過時に429を返す", async () => {
    const { NextResponse } = await import("next/server");
    const rateLimitResponse = NextResponse.json(
      { error: "リクエスト数の制限に達しました。" },
      { status: 429 }
    );
    mockCheckRateLimit.mockResolvedValue(rateLimitResponse);

    const { GET } = await import("@/app/api/forms/[slug]/route");

    const request = new Request("http://localhost/api/forms/my-form");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "my-form" }),
    });

    expect(response.status).toBe(429);
  });
});

// ========================
// POST /api/testimonials - honeypot, insert error, catch block (lines 14, 70-71, 79)
// ========================
describe("POST /api/testimonials - uncovered branches", () => {
  const validBody = {
    form_id: "form-123",
    rating: 5,
    content: "Great product!",
    name: "Taro Yamada",
    permission_granted: true,
  };

  it("レートリミット超過時に429を返す", async () => {
    const { NextResponse } = await import("next/server");
    const rateLimitResponse = NextResponse.json(
      { error: "リクエスト数の制限に達しました。" },
      { status: 429 }
    );
    mockCheckRateLimit.mockResolvedValue(rateLimitResponse);

    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  it("rating/content/nameがundefinedの場合にnullishフォールバックが適用される", async () => {
    const mockSupa = createMockSupabase({
      forms: { data: { id: "form-123", workspace_id: "ws-1" }, error: null },
      testimonials: { data: null, error: null },
    });
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { POST } = await import("@/app/api/testimonials/route");

    // Submit with minimal fields - no rating, no content, no name
    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: {
        form_id: "form-123",
        permission_granted: true,
      },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, data: null });
  });

  it("ハニーポットフィールド(website)がある場合、静かに成功を返す", async () => {
    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: { ...validBody, website: "http://spam.example.com" },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    // Supabase should NOT have been called
    expect(mockCreateServerClient).not.toHaveBeenCalled();
  });

  it("ハニーポットフィールド(url)がある場合、静かに成功を返す", async () => {
    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: { ...validBody, url: "http://spam.example.com" },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it("ハニーポットフィールド(email_confirm)がある場合、静かに成功を返す", async () => {
    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: { ...validBody, email_confirm: "bot@example.com" },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it("テスティモニアル挿入エラー時に500を返す", async () => {
    const mockSupa = createMockSupabase({
      forms: { data: { id: "form-123", workspace_id: "ws-1" }, error: null },
    });
    // Override testimonials to return insert error
    const originalFrom = mockSupa.from;
    mockSupa.from = vi.fn((table: string) => {
      if (table === "testimonials") {
        return createMockQueryBuilder({
          data: null,
          error: { message: "insert failed" },
        });
      }
      return originalFrom(table);
    });
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("送信に失敗しました。もう一度お試しください。");
  });

  it("予期しない例外発生時にhandleApiErrorを呼ぶ", async () => {
    // Make request.json() throw to trigger the catch block
    const { POST } = await import("@/app/api/testimonials/route");

    const badRequest = {
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      headers: new Headers(),
    } as unknown as Request;

    const response = await POST(badRequest);

    expect(response.status).toBe(500);
    expect(mockHandleApiError).toHaveBeenCalled();
  });
});

// ========================
// GET /api/widgets/[widgetId] - only_featured, testimonials error, catch block (lines 61, 70, 87)
// ========================
describe("GET /api/widgets/[widgetId] - uncovered branches", () => {
  function setupRpcMock(rpcResult: QueryResult) {
    const mockSupa = createMockRpcSupabase(rpcResult);
    mockCreateSupabaseClient.mockReturnValue(mockSupa);
    return mockSupa;
  }

  it("only_featuredがtrueの場合でも200を返す", async () => {
    const publicWidget = {
      id: "widget-1",
      type: "carousel",
      filter_min_rating: 1,
      only_featured: true,
      theme: { maxItems: 5 },
    };
    setupRpcMock({
      data: {
        widget: publicWidget,
        subscription_status: "pro",
        testimonials: [{ id: "t-1", name: "Featured", rating: 5 }],
      },
      error: null,
    });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.widget.only_featured).toBe(true);
    expect(json.data.showBadge).toBe(false); // pro subscription
  });

  it("RPCエラー時に500を返す", async () => {
    setupRpcMock({ data: null, error: { message: "DB error" } });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to fetch testimonials");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("filter_min_ratingがnullの場合でも200を返す", async () => {
    const publicWidget = {
      id: "widget-1",
      type: "carousel",
      filter_min_rating: null,
      only_featured: false,
      theme: { maxItems: 5 },
    };
    setupRpcMock({
      data: {
        widget: publicWidget,
        subscription_status: "free",
        testimonials: [{ id: "t-1" }],
      },
      error: null,
    });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });

    expect(response.status).toBe(200);
  });

  it("themeがnullの場合でも200を返す", async () => {
    const publicWidget = {
      id: "widget-1",
      type: "carousel",
      filter_min_rating: 3,
      only_featured: false,
      theme: null,
    };
    setupRpcMock({
      data: {
        widget: publicWidget,
        subscription_status: "free",
        testimonials: [{ id: "t-1" }],
      },
      error: null,
    });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });

    expect(response.status).toBe(200);
  });

  it("testimonialsが空配列の場合に空配列が返される", async () => {
    const publicWidget = {
      id: "widget-1",
      type: "carousel",
      filter_min_rating: 1,
      only_featured: false,
      theme: { maxItems: 5 },
    };
    setupRpcMock({
      data: {
        widget: publicWidget,
        subscription_status: "free",
        testimonials: [],
      },
      error: null,
    });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.testimonials).toEqual([]);
  });

  it("予期しない例外発生時にhandleApiErrorを呼ぶ", async () => {
    // Make createClient throw to trigger catch block
    mockCreateSupabaseClient.mockImplementation(() => {
      throw new Error("Connection failed");
    });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });

    expect(response.status).toBe(500);
    expect(mockHandleApiError).toHaveBeenCalled();
  });
});
