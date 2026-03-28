import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import {
  createMockSupabase,
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

const mockCreateSupabaseClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateSupabaseClient(...args),
}));

const mockGetStripe = vi.fn();
vi.mock("@/lib/stripe", () => ({
  getStripe: () => mockGetStripe(),
  STRIPE_PRICES: { pro_monthly: "price_test_123" },
}));

vi.mock("@/lib/utils", () => ({
  getBaseUrl: () => "http://localhost:3000",
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/lib/api-utils", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  handleApiError: vi.fn((_error: unknown, message = "サーバーエラーが発生しました", headers?: Record<string, string>) => {
    return NextResponse.json({ error: message }, { status: 500, ...(headers ? { headers } : {}) });
  }),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ========================
// POST /api/testimonials
// ========================
describe("POST /api/testimonials", () => {
  const validBody = {
    form_id: "form-123",
    rating: 5,
    content: "Great product!",
    name: "Taro Yamada",
    permission_granted: true,
  };

  it("有効な送信で200を返す", async () => {
    const mockSupa = createMockSupabase({
      forms: { data: { id: "form-123", workspace_id: "ws-1" }, error: null },
      testimonials: { data: null, error: null },
    });
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockSupa.from).toHaveBeenCalledWith("forms");
    expect(mockSupa.from).toHaveBeenCalledWith("testimonials");
  });

  it("不正なデータで400を返す", async () => {
    mockCreateServerClient.mockResolvedValue(createMockSupabase());

    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: { rating: "not-a-number" },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("入力内容に不備があります");
    expect(json.details).toBeDefined();
  });

  it("フォームが見つからない場合404を返す", async () => {
    const mockSupa = createMockSupabase({
      forms: { data: null, error: { message: "not found" } },
    });
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { POST } = await import("@/app/api/testimonials/route");

    const request = makeRequest("http://localhost/api/testimonials", {
      method: "POST",
      body: validBody,
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("フォームが見つかりません");
  });
});

// ========================
// GET /api/forms/[slug]
// ========================
describe("GET /api/forms/[slug]", () => {
  it("有効なslugでフォームデータを返す", async () => {
    const formData = {
      id: "form-123",
      slug: "my-form",
      title: "Feedback Form",
      workspace_id: "ws-1",
    };
    const mockSupa = createMockSupabase({
      forms: { data: formData, error: null },
    });
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/forms/[slug]/route");

    const request = new Request("http://localhost/api/forms/my-form");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "my-form" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(formData);
  });

  it("存在しないslugで404を返す", async () => {
    const mockSupa = createMockSupabase({
      forms: { data: null, error: { message: "not found" } },
    });
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/forms/[slug]/route");

    const request = new Request("http://localhost/api/forms/nonexistent");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("フォームが見つかりません");
  });
});

// ========================
// GET /api/widgets/[widgetId]
// ========================
describe("GET /api/widgets/[widgetId]", () => {
  const widgetData = {
    id: "widget-1",
    workspace_id: "ws-1",
    type: "carousel",
    filter_min_rating: 3,
    only_featured: false,
    theme: { maxItems: 5 },
  };

  const testimonialsList = [
    {
      id: "t-1",
      name: "Taro",
      rating: 5,
      content: "Great!",
      submitted_at: "2026-01-01",
    },
  ];

  function setupWidgetMock(
    widgetResult: QueryResult,
    workspaceResult?: QueryResult,
    testimonialsResult?: QueryResult
  ) {
    const mockSupa = {
      from: vi.fn((table: string) => {
        if (table === "widgets") return createMockQueryBuilder(widgetResult);
        if (table === "workspaces")
          return createMockQueryBuilder(
            workspaceResult ?? {
              data: { subscription_status: "free" },
              error: null,
            }
          );
        if (table === "testimonials")
          return createMockQueryBuilder(
            testimonialsResult ?? { data: testimonialsList, error: null }
          );
        return createMockQueryBuilder({ data: null, error: null });
      }),
    };
    mockCreateSupabaseClient.mockReturnValue(mockSupa);
    return mockSupa;
  }

  it("ウィジェットデータとテスティモニアルを返す", async () => {
    setupWidgetMock({ data: widgetData, error: null });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    const { workspace_id: _, ...expectedWidget } = widgetData;
    expect(json.widget).toEqual(expectedWidget);
    expect(json.testimonials).toEqual(testimonialsList);
    expect(json.showBadge).toBe(true);
  });

  it("存在しないウィジェットで404を返す", async () => {
    setupWidgetMock({ data: null, error: { message: "not found" } });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/bad-id");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "bad-id" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Widget not found");
  });

  it("CORSヘッダーがレスポンスに含まれる", async () => {
    setupWidgetMock({ data: widgetData, error: null });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, OPTIONS"
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type"
    );
  });

  it("キャッシュヘッダーがレスポンスに含まれる", async () => {
    setupWidgetMock({ data: widgetData, error: null });

    const { GET } = await import("@/app/api/widgets/[widgetId]/route");

    const request = new Request("http://localhost/api/widgets/widget-1");
    const response = await GET(request as never, {
      params: Promise.resolve({ widgetId: "widget-1" }),
    });

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600"
    );
  });

  it("OPTIONSリクエストでCORSヘッダー付き204を返す", async () => {
    const { OPTIONS } = await import("@/app/api/widgets/[widgetId]/route");

    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

// ========================
// Stripe認証チェック
// ========================
describe("Stripe認証チェック", () => {
  it.each([
    ["POST /api/stripe/checkout", () => import("@/app/api/stripe/checkout/route")],
    ["POST /api/stripe/portal", () => import("@/app/api/stripe/portal/route")],
  ])("%s - 未認証で401を返す", async (_label, importRoute) => {
    const mockSupa = createMockSupabase({}, undefined);
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { POST } = await importRoute();
    const request = makeRequest("http://localhost/api/stripe", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});
