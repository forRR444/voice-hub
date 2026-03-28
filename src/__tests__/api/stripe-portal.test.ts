import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

vi.mock("@/lib/api-utils", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

const mockBillingPortalSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    billingPortal: {
      sessions: {
        create: (...args: unknown[]) =>
          mockBillingPortalSessionsCreate(...args),
      },
    },
  }),
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
  mockFrom.mockReturnValue({ select: mockSelect });
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

describe("POST /api/stripe/portal", () => {
  it("認証エラーで401を返す", async () => {
    setupAuthFailure();

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("ユーザーがnullの場合401を返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("ワークスペースが見つからない場合404を返す", async () => {
    setupAuthSuccess();
    setupWorkspaceNotFound();

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
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

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Workspace not found");
  });

  it("stripe_customer_idがない場合400を返す", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: null,
    });

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe(
      "No billing account found. Please subscribe first."
    );
  });

  it("stripe_customer_idが空文字の場合400を返す", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: "",
    });

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe(
      "No billing account found. Please subscribe first."
    );
  });

  it("正常にポータルセッションを作成してURLを返す", async () => {
    setupAuthSuccess();
    setupWorkspaceFound({
      id: "ws_1",
      user_id: "user_1",
      stripe_customer_id: "cus_existing",
    });
    mockBillingPortalSessionsCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session_789",
    });

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBe("https://billing.stripe.com/session_789");
    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_existing",
      return_url: "http://localhost:3000/dashboard/settings",
    });
  });

  it("予期しないエラーが発生した場合500を返す", async () => {
    mockGetUser.mockRejectedValue(new Error("Unexpected error"));

    const { POST } = await import("@/app/api/stripe/portal/route");
    const request = makeRequest("http://localhost/api/stripe/portal", { method: "POST" });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });
});
