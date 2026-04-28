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

  it.each(["/", "/terms", "/privacy"])("公開ページ %s はauth checkをスキップする", async (path) => {
    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(makeNextRequest(path) as never);

    expect(mockGetUser).not.toHaveBeenCalled();
  });

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

// ─── cookies handler (createServerClient options) ──────────────────

type CookieEntry = { name: string; value: string };
type CookieSetEntry = { name: string; value: string; options?: Record<string, unknown> };
type CookiesHandler = {
  getAll: () => CookieEntry[];
  setAll: (cookies: CookieSetEntry[]) => void;
};

function isCookiesHandler(value: unknown): value is CookiesHandler {
  if (typeof value !== "object" || value === null) return false;
  if (!("getAll" in value) || !("setAll" in value)) return false;
  return typeof value.getAll === "function" && typeof value.setAll === "function";
}

function getCreateServerClientCallArgs(): unknown[] {
  const calls: unknown = mockCreateServerClient.mock.calls;
  if (!Array.isArray(calls) || calls.length === 0) {
    throw new Error("createServerClient was not called");
  }
  const first: unknown = calls[0];
  if (!Array.isArray(first)) {
    throw new Error("createServerClient call args are not an array");
  }
  return first;
}

function hasCookiesProperty(value: unknown): value is { cookies: unknown } {
  return typeof value === "object" && value !== null && "cookies" in value;
}

function getCookiesHandler(): CookiesHandler {
  const args = getCreateServerClientCallArgs();
  const thirdArg = args[2];
  if (!hasCookiesProperty(thirdArg)) {
    throw new Error("createServerClient was not called with an options object");
  }
  const { cookies } = thirdArg;
  if (!isCookiesHandler(cookies)) {
    throw new Error("cookies handler is missing or malformed");
  }
  return cookies;
}

function makeNextRequestWithCookies(pathname: string, initialCookies: CookieEntry[] = []) {
  const url = new URL(`http://localhost:3001${pathname}`);
  return {
    nextUrl: {
      pathname,
      clone: () => ({ ...url, pathname, toString: () => url.toString() }),
    },
    cookies: {
      getAll: vi.fn(() => initialCookies),
      set: vi.fn(),
    },
  };
}

describe("updateSession cookies handler", () => {
  it("cookies.getAll はrequest.cookies.getAllの結果を返す", async () => {
    const initial: CookieEntry[] = [{ name: "sb-access", value: "abc" }];
    const request = makeNextRequestWithCookies("/", initial);

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(request as never);

    const cookies = getCookiesHandler();
    const result = cookies.getAll();

    expect(result).toEqual(initial);
    expect(request.cookies.getAll).toHaveBeenCalled();
  });

  it("cookies.setAll は各cookieをrequest.cookiesにsetする", async () => {
    const request = makeNextRequestWithCookies("/");

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(request as never);

    const cookies = getCookiesHandler();
    cookies.setAll([
      { name: "a", value: "1", options: { httpOnly: true } },
      { name: "b", value: "2", options: { path: "/" } },
    ]);

    expect(request.cookies.set).toHaveBeenCalledTimes(2);
    expect(request.cookies.set).toHaveBeenNthCalledWith(1, "a", "1");
    expect(request.cookies.set).toHaveBeenNthCalledWith(2, "b", "2");
  });

  it("cookies.setAll はNextResponse.nextを再度呼ぶ", async () => {
    const request = makeNextRequestWithCookies("/");

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(request as never);

    const callsBefore = mockNext.mock.calls.length;

    const cookies = getCookiesHandler();
    cookies.setAll([{ name: "x", value: "y", options: {} }]);

    expect(mockNext.mock.calls.length).toBe(callsBefore + 1);
    // setAll内の再代入でも request オブジェクトが渡されていることを確認
    const lastCall = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(lastCall).toEqual({ request });
  });

  it("cookies.setAll はsupabaseResponseのcookiesにoptionsつきでsetする", async () => {
    const request = makeNextRequestWithCookies("/");

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(request as never);

    const nextCallsBefore = mockNext.mock.results.length;

    const cookies = getCookiesHandler();
    const options1 = { httpOnly: true, sameSite: "lax" };
    const options2 = { path: "/", secure: true };
    cookies.setAll([
      { name: "a", value: "1", options: options1 },
      { name: "b", value: "2", options: options2 },
    ]);

    // setAll内で新しく生成された supabaseResponse を取得
    const newResponse = mockNext.mock.results[nextCallsBefore].value;
    expect(newResponse.cookies.set).toHaveBeenCalledTimes(2);
    expect(newResponse.cookies.set).toHaveBeenNthCalledWith(1, "a", "1", options1);
    expect(newResponse.cookies.set).toHaveBeenNthCalledWith(2, "b", "2", options2);
  });

  it("空配列をsetAllに渡してもクラッシュせず、request.cookies.setは呼ばれない", async () => {
    const request = makeNextRequestWithCookies("/");

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(request as never);

    const cookies = getCookiesHandler();

    expect(() => cookies.setAll([])).not.toThrow();
    expect(request.cookies.set).not.toHaveBeenCalled();
  });

  it("createServerClient にenv変数（URL/ANON_KEY）が渡されている", async () => {
    const request = makeNextRequestWithCookies("/");

    const { updateSession } = await import("@/lib/supabase/middleware");
    await updateSession(request as never);

    const args = getCreateServerClientCallArgs();
    expect(args[0]).toBe(process.env.NEXT_PUBLIC_SUPABASE_URL);
    expect(args[1]).toBe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });
});
