import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Chainable Supabase mock query builder
// ---------------------------------------------------------------------------

export type QueryResult = { data: unknown; error: unknown };

export function createMockQueryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "not",
    "gte",
    "order",
    "limit",
    "single",
  ];
  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  // `single` terminates the chain and resolves the result
  builder.single = vi.fn().mockResolvedValue(result);
  // Allow awaiting the builder directly (for chains that don't end with .single())
  builder.then = vi.fn((resolve: (v: QueryResult) => void) => resolve(result));
  return builder;
}

/**
 * Creates a mock Supabase client with `.from()` and optionally `.auth.getUser()`.
 * Each table name maps to the query result it should return.
 */
export function createMockSupabase(
  tableResults: Record<string, QueryResult> = {},
  authResult?: { data: { user: unknown }; error: unknown }
) {
  return {
    from: vi.fn((table: string) => {
      const result = tableResults[table] ?? { data: null, error: null };
      return createMockQueryBuilder(result);
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authResult ?? {
          data: { user: null },
          error: { message: "Not authenticated" },
        }
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Mock Supabase client that exposes only `.rpc()`
// ---------------------------------------------------------------------------

export function createMockRpcSupabase(rpcResult: QueryResult) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

// ---------------------------------------------------------------------------
// Helper to build a Request object for API route tests
// ---------------------------------------------------------------------------

export function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, headers = {} } = options;
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}
