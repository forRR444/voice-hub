import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPostAuthRedirect } from "@/lib/auth-redirect";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  return builder;
}

function createSupabase(result: { data: unknown; error: unknown }) {
  return {
    from: vi.fn(() => chainable(result)),
  };
}

const user = { id: "user-1" };
const baseUrl = "https://example.com";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPostAuthRedirect", () => {
  it("workspace が null の場合は /onboarding にリダイレクトする", async () => {
    const supabase = createSupabase({ data: null, error: null });

    // @ts-expect-error: partial mock satisfies only the surface the function uses at runtime
    const url = await getPostAuthRedirect(supabase, user, baseUrl);

    expect(url).toBe(`${baseUrl}/onboarding`);
  });

  it("onboarding_completed=false の場合は /onboarding にリダイレクトする", async () => {
    const supabase = createSupabase({
      data: { onboarding_completed: false },
      error: null,
    });

    // @ts-expect-error: partial mock satisfies only the surface the function uses at runtime
    const url = await getPostAuthRedirect(supabase, user, baseUrl);

    expect(url).toBe(`${baseUrl}/onboarding`);
  });

  it("onboarding_completed=true の場合は /dashboard にリダイレクトする", async () => {
    const supabase = createSupabase({
      data: { onboarding_completed: true },
      error: null,
    });

    // @ts-expect-error: partial mock satisfies only the surface the function uses at runtime
    const url = await getPostAuthRedirect(supabase, user, baseUrl);

    expect(url).toBe(`${baseUrl}/dashboard`);
  });
});
