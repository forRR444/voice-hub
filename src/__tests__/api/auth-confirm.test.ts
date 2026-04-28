import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../helpers/mock-supabase";

const mockCreateServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

function chainable(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "gte", "order", "limit"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("GET /api/auth/confirm", () => {
  // ─── パラメータなし ──────────────────────────────────────────────
  it("codeもtoken_hashもない場合は/login?error=authにリダイレクトする", async () => {
    const mockSupa = { auth: {} };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth");
  });

  // ─── PKCEフロー（code） ──────────────────────────────────────────

  it("PKCE code: onboarding未完了の場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: { onboarding_completed: false }, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm?code=test-code"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/onboarding");
  });

  it("PKCE code: onboarding完了の場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: { onboarding_completed: true }, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm?code=test-code"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("PKCE code + recovery typeの場合は/update-passwordにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: { onboarding_completed: true }, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?code=test-code&type=recovery")
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/update-password");
  });

  it("PKCE code: exchangeCodeForSession失敗の場合は/login?error=authにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: "Invalid code" } }),
      },
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm?code=bad-code"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth");
  });

  it("PKCE code: workspaceが存在しない場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: null, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm?code=test-code"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/onboarding");
  });

  it("PKCE code: userがnullの場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm?code=test-code"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/dashboard");
  });

  // ─── Legacyフロー（token_hash） ──────────────────────────────────

  it("token_hash: recovery typeの場合は/update-passwordにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: { onboarding_completed: true }, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=recovery")
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/update-password");
  });

  it("token_hash: signup + onboarding未完了の場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: { onboarding_completed: false }, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=signup")
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/onboarding");
  });

  it("token_hash: signup + onboarding完了の場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: { onboarding_completed: true }, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=signup")
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("token_hash: signup + userがnullの場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=signup")
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("token_hash: workspaceが存在しない場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => chainable({ data: null, error: null })),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=signup")
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/onboarding");
  });

  it("token_hash: OTP検証失敗の場合は/login?error=authにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: { message: "Invalid" } }),
      },
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=bad&type=signup")
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth");
  });
});
