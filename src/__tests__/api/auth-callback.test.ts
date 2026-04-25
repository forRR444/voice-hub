import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockCreateServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

// ---------------------------------------------------------------------------
// Helper: build a chainable mock that resolves when awaited
// ---------------------------------------------------------------------------

function chainable(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "gte", "order", "limit"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
  return builder;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("GET /api/auth/callback", () => {
  it("codeがない場合は/login?error=authにリダイレクトする", async () => {
    const { GET } = await import("@/app/api/auth/callback/route");

    const request = makeRequest("http://localhost/api/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth");
  });

  it("onboarding未完了の場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        chainable({
          data: { onboarding_completed: false },
          error: null,
        })
      ),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/callback/route");

    const request = makeRequest(
      "http://localhost/api/auth/callback?code=test-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/onboarding");
  });

  it("onboarding完了の場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        chainable({
          data: { onboarding_completed: true },
          error: null,
        })
      ),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/callback/route");

    const request = makeRequest(
      "http://localhost/api/auth/callback?code=test-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
  });

  it("userがnullの場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/callback/route");

    const request = makeRequest(
      "http://localhost/api/auth/callback?code=test-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
  });

  it("exchangeCodeForSession失敗の場合は/login?error=authにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: "Invalid" } }),
      },
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/callback/route");

    const request = makeRequest(
      "http://localhost/api/auth/callback?code=bad-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth");
  });

  it("workspaceがnullの場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        chainable({
          data: [null],
          error: null,
        })
      ),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/callback/route");

    const request = makeRequest(
      "http://localhost/api/auth/callback?code=test-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/onboarding");
  });
});
