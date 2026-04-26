import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

vi.mock("@/lib/api-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-utils")>();
  return {
    ...actual,
    checkRateLimit: vi.fn().mockResolvedValue(null),
    getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  };
});

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: (...args: unknown[]) => mockCustomersCreate(...args) },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  }),
  STRIPE_PRICES: { pro_monthly: "price_test_123" },
}));

vi.mock("@/lib/utils", () => ({
  getBaseUrl: () => "http://localhost:3000",
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupAuthSuccess(user = { id: "user_1", email: "test@example.com" }) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

function setupAuthFailure(error = { message: "Not authenticated" }) {
  mockGetUser.mockResolvedValue({ data: { user: null }, error });
}

function setupWorkspaceFound(workspace: Record<string, unknown>) {
  mockSingle.mockResolvedValue({ data: workspace, error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
}

function setupWorkspaceNotFound(error = { message: "Not found" }) {
  mockSingle.mockResolvedValue({ data: null, error });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/stripe/checkout", () => {
  it("認証エラーで401を返す", async () => {
    setupAuthFailure();

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("ユーザーがnullの場合401を返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("ワークスペースが見つからない場合404を返す", async () => {
    setupAuthSuccess();
    setupWorkspaceNotFound();

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Workspace not found");
  });

  it("ワークスペースエラーの場合404を返す", async () => {
    setupAuthSuccess();
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Workspace not found");
  });

  it("既存のstripe_customer_idがある場合、新規顧客を作成せずcheckoutセッションを作成する", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: "cus_existing",
    });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.url).toBe("https://checkout.stripe.com/session_123");
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_existing",
      mode: "subscription",
      line_items: [{ price: "price_test_123", quantity: 1 }],
      success_url: "http://localhost:3000/dashboard/settings?success=true",
      cancel_url: "http://localhost:3000/dashboard/settings?canceled=true",
    });
  });

  it("stripe_customer_idがない場合、新規顧客を作成してワークスペースを更新する", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: null,
    });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_456",
    });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.url).toBe("https://checkout.stripe.com/session_456");
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "test@example.com",
      metadata: { workspace_id: "ws_1", user_id: "user_1" },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      stripe_customer_id: "cus_new_123",
    });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "ws_1");
  });

  it("ワークスペースのstripe_customer_id更新に失敗した場合500を返す", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: null,
    });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    mockUpdateEq.mockResolvedValue({ error: { message: "Update failed" } });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to update workspace");
  });

  it("checkoutセッションのURLがnullの場合500を返す", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: "cus_existing",
    });
    mockCheckoutSessionsCreate.mockResolvedValue({ url: null });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to create checkout session");
  });

  it("予期しないエラーが発生した場合500を返す", async () => {
    mockGetUser.mockRejectedValue(new Error("Unexpected error"));

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = makeRequest("http://localhost/api/stripe/checkout", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });
});
