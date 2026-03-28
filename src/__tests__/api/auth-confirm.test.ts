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
  it("token_hashがない場合は/login?error=authにリダイレクトする", async () => {
    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(makeRequest("http://localhost/api/auth/confirm"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth");
  });

  it("recovery typeの場合は/update-passwordにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        chainable({ data: { onboarding_completed: true }, error: null })
      ),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=recovery")
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/update-password");
  });

  it("signup typeでonboarding未完了の場合は/onboardingにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        chainable({ data: { onboarding_completed: false }, error: null })
      ),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=signup")
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/onboarding");
  });

  it("signup typeでonboarding完了の場合は/dashboardにリダイレクトする", async () => {
    const mockSupa = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() =>
        chainable({ data: { onboarding_completed: true }, error: null })
      ),
    };
    mockCreateServerClient.mockResolvedValue(mockSupa);

    const { GET } = await import("@/app/api/auth/confirm/route");
    const response = await GET(
      makeRequest("http://localhost/api/auth/confirm?token_hash=abc&type=signup")
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
  });

  it("OTP検証失敗の場合は/login?error=authにリダイレクトする", async () => {
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
