import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @supabase/ssr
const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn(() => ({
  auth: { getUser: mockGetUser },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

// Mock NextResponse
const mockRedirect = vi.fn((url: URL) => ({
  type: "redirect",
  url: url.toString(),
}));
const mockNext = vi.fn((opts?: { request: unknown }) => {
  const response = {
    type: "next",
    request: opts?.request,
    cookies: {
      set: vi.fn(),
    },
  };
  return response;
});

vi.mock("next/server", () => ({
  NextResponse: {
    next: (...args: unknown[]) => mockNext(...args),
    redirect: (...args: unknown[]) => mockRedirect(...args),
  },
}));

function makeNextRequest(pathname: string) {
  const url = new URL(`http://localhost:3001${pathname}`);
  return {
    nextUrl: {
      pathname,
      clone: () => ({ ...url, pathname, toString: () => url.toString() }),
    },
    cookies: {
      getAll: () => [],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateSession middleware", () => {
  // ─── Public paths ────────────────────────────────────────────────

  it.each(["/", "/terms", "/privacy"])(
    "公開ページ %s はauth checkをスキップする",
    async (path) => {
      const { updateSession } = await import("@/lib/supabase/middleware");
      await updateSession(makeNextRequest(path) as never);

      expect(mockGetUser).not.toHaveBeenCalled();
    }
  );

  // ─── Protected routes (unauthenticated) ──────────────────────────

  it.each(["/dashboard", "/dashboard/forms", "/dashboard/widgets", "/dashboard/settings"])(
    "未認証で %s にアクセスすると/loginにリダイレクトする",
    async (path) => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { updateSession } = await import("@/lib/supabase/middleware");
      await updateSession(makeNextRequest(path) as never);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/login");
    }
  );

  it("未認証で/onboardingにアクセスすると/loginにリダイレクトする", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest("/onboarding") as never);

    expect(mockRedirect).toHaveBeenCalled();
    const redirectUrl = mockRedirect.mock.calls[0][0];
    expect(redirectUrl.pathname).toBe("/login");
  });

  it("未認証で/update-passwordにアクセスすると/loginにリダイレクトする", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest("/update-password") as never);

    expect(mockRedirect).toHaveBeenCalled();
    const redirectUrl = mockRedirect.mock.calls[0][0];
    expect(redirectUrl.pathname).toBe("/login");
  });

  // ─── Auth pages (authenticated) ──────────────────────────────────

  it.each(["/login", "/signup", "/reset-password"])(
    "認証済みで %s にアクセスすると/dashboardにリダイレクトする",
    async (path) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

      const { updateSession } = await import("@/lib/supabase/middleware");
      await updateSession(makeNextRequest(path) as never);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/dashboard");
    }
  );

  // ─── Allowed access ──────────────────────────────────────────────

  it("未認証で/signupにアクセスできる", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest("/signup") as never);

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("未認証で/reset-passwordにアクセスできる", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest("/reset-password") as never);

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("認証済みで/update-passwordにアクセスできる（リダイレクトされない）", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest("/update-password") as never);

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("認証済みで/dashboardにアクセスできる", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest("/dashboard") as never);

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
