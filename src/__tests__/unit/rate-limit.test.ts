import { describe, it, expect, vi, beforeEach } from "vitest";

// Upstash Redis パス（L6-12 初期化分岐, L17-28 limiterキャッシュ, L62-66 rateLimitAsync の Redis 経路）用のモック。
// in-memory フォールバックパスのテストでは env 未設定により実コードで参照されないため、
// 両 describe で共通のモックを使える。
// vi.fn().mockImplementation(...) は `new` 演算子で呼べないため、本物の class を使う。
const upstashMocks = vi.hoisted(() => {
  const limitFn = vi.fn();
  const slidingWindowFn = vi.fn().mockReturnValue({ __tag: "sliding-window" });
  const redisCalls: Array<unknown> = [];
  const ratelimitCalls: Array<unknown> = [];

  class RedisMock {
    constructor(opts: unknown) {
      redisCalls.push(opts);
    }
  }
  class RatelimitMock {
    limit: typeof limitFn;
    constructor(opts: unknown) {
      ratelimitCalls.push(opts);
      this.limit = limitFn;
    }
    static slidingWindow = slidingWindowFn;
  }

  return {
    limitFn,
    slidingWindowFn,
    RedisMock,
    RatelimitMock,
    redisCalls,
    ratelimitCalls,
  };
});

vi.mock("@upstash/redis", () => ({
  Redis: upstashMocks.RedisMock,
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: upstashMocks.RatelimitMock,
}));

// We need to test the in-memory fallback path (no Redis).
// The module reads env vars at import time, so we ensure they're unset.

describe("rate-limit (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  async function loadModule() {
    return import("@/lib/rate-limit");
  }

  it("最初のリクエストは成功する", async () => {
    const { rateLimit } = await loadModule();
    const result = rateLimit("test-key-1", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("制限内のリクエストは成功する", async () => {
    const { rateLimit } = await loadModule();
    const key = "test-key-2";
    rateLimit(key, 3, 60000);
    rateLimit(key, 3, 60000);
    const result = rateLimit(key, 3, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("制限超過のリクエストは失敗する", async () => {
    const { rateLimit } = await loadModule();
    const key = "test-key-3";
    rateLimit(key, 2, 60000);
    rateLimit(key, 2, 60000);
    const result = rateLimit(key, 2, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("ウィンドウ期限切れ後はリセットされる", async () => {
    const { rateLimit } = await loadModule();
    const key = "test-key-4";

    // Use a very short window
    rateLimit(key, 1, 1); // 1ms window

    // Advance time past the window
    vi.useFakeTimers();
    vi.advanceTimersByTime(10);

    const result = rateLimit(key, 1, 1);
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });

  it("rateLimitAsync はインメモリフォールバックを使う（Redis未設定時）", async () => {
    const { rateLimitAsync } = await loadModule();
    const result = await rateLimitAsync("async-key-1", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("rateLimitAsync で制限超過時は失敗する", async () => {
    const { rateLimitAsync } = await loadModule();
    const key = "async-key-2";
    await rateLimitAsync(key, 1, 60000);
    const result = await rateLimitAsync(key, 1, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("メモリストアが10000エントリ超でクリーンアップされる", async () => {
    const { rateLimit } = await loadModule();

    // Fill the store with >10000 entries using expired windows
    vi.useFakeTimers({ now: 1000 });
    for (let i = 0; i < 10001; i++) {
      rateLimit(`cleanup-key-${i}`, 100, 1); // 1ms window - will expire immediately
    }

    // Advance time so all entries are expired
    vi.advanceTimersByTime(100);

    // This call should trigger cleanup (memoryStore.size > 10000)
    const result = rateLimit("cleanup-trigger", 5, 60000);
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });
});

// Upstash Redis パス（L6-12 初期化分岐, L17-28 limiterキャッシュ, L62-66 rateLimitAsync の Redis 経路）を検証する。
// @upstash/redis / @upstash/ratelimit を vi.mock で差し替え、ネットワーク呼び出しは発生させない。
describe("rate-limit (Upstash Redis)", () => {
  beforeEach(() => {
    vi.resetModules();
    upstashMocks.limitFn.mockReset();
    upstashMocks.slidingWindowFn.mockClear();
    upstashMocks.redisCalls.length = 0;
    upstashMocks.ratelimitCalls.length = 0;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  async function loadModuleWithRedis() {
    return import("@/lib/rate-limit");
  }

  it("env が両方セットされていれば Redis と Ratelimit が初期化される", async () => {
    await loadModuleWithRedis();
    // Redis コンストラクタが URL/TOKEN と共に呼ばれている
    expect(upstashMocks.redisCalls).toHaveLength(1);
    expect(upstashMocks.redisCalls[0]).toEqual({
      url: "https://example.upstash.io",
      token: "test-token",
    });
    // この時点では Ratelimit コンストラクタはまだ呼ばれない（lazy: getUpstashLimiter 時）
    expect(upstashMocks.ratelimitCalls).toHaveLength(0);
  });

  it("rateLimitAsync が Upstash 経由で成功結果を返す", async () => {
    upstashMocks.limitFn.mockResolvedValueOnce({
      success: true,
      remaining: 4,
      limit: 5,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    });
    const { rateLimitAsync } = await loadModuleWithRedis();
    const result = await rateLimitAsync("upstash-key-1", 5, 60000);

    expect(result).toEqual({ success: true, remaining: 4 });
    // limiter.limit に正しい key が渡されている
    expect(upstashMocks.limitFn).toHaveBeenCalledTimes(1);
    expect(upstashMocks.limitFn).toHaveBeenCalledWith("upstash-key-1");
    // Ratelimit コンストラクタが slidingWindow と共に初期化された
    expect(upstashMocks.ratelimitCalls).toHaveLength(1);
    expect(upstashMocks.slidingWindowFn).toHaveBeenCalledWith(5, "60000 ms");
  });

  it("rateLimitAsync が Upstash 経由で失敗結果を返す", async () => {
    upstashMocks.limitFn.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 3,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    });
    const { rateLimitAsync } = await loadModuleWithRedis();
    const result = await rateLimitAsync("upstash-key-fail", 3, 60000);

    expect(result).toEqual({ success: false, remaining: 0 });
    expect(upstashMocks.limitFn).toHaveBeenCalledWith("upstash-key-fail");
  });

  it("getUpstashLimiter は同じ (windowMs, limit) でインスタンスをキャッシュする", async () => {
    upstashMocks.limitFn.mockResolvedValue({
      success: true,
      remaining: 4,
      limit: 5,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    });
    const { rateLimitAsync } = await loadModuleWithRedis();

    await rateLimitAsync("k1", 5, 60000);
    await rateLimitAsync("k2", 5, 60000);

    // 同じ (windowMs=60000, limit=5) なのでコンストラクタは1回だけ
    expect(upstashMocks.ratelimitCalls).toHaveLength(1);
    // limit 呼び出しは2回、それぞれ異なるキーで
    expect(upstashMocks.limitFn).toHaveBeenNthCalledWith(1, "k1");
    expect(upstashMocks.limitFn).toHaveBeenNthCalledWith(2, "k2");
  });

  it("getUpstashLimiter は異なる (windowMs, limit) で別インスタンスを作る", async () => {
    upstashMocks.limitFn.mockResolvedValue({
      success: true,
      remaining: 1,
      limit: 5,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    });
    const { rateLimitAsync } = await loadModuleWithRedis();

    await rateLimitAsync("k1", 5, 60000);
    await rateLimitAsync("k2", 10, 30000);

    // 異なるキーなので2つのインスタンスが作られる
    expect(upstashMocks.ratelimitCalls).toHaveLength(2);
    expect(upstashMocks.slidingWindowFn).toHaveBeenNthCalledWith(1, 5, "60000 ms");
    expect(upstashMocks.slidingWindowFn).toHaveBeenNthCalledWith(2, 10, "30000 ms");
  });

  it("URL のみセットで TOKEN 未設定なら in-memory フォールバックになる", async () => {
    vi.resetModules();
    upstashMocks.redisCalls.length = 0;
    upstashMocks.ratelimitCalls.length = 0;
    upstashMocks.limitFn.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { rateLimitAsync } = await import("@/lib/rate-limit");
    const result = await rateLimitAsync("fallback-url-only", 5, 60000);

    // Redis/Ratelimit は一切触られない
    expect(upstashMocks.redisCalls).toHaveLength(0);
    expect(upstashMocks.ratelimitCalls).toHaveLength(0);
    expect(upstashMocks.limitFn).not.toHaveBeenCalled();
    // in-memory パスなので 1回目は success / remaining=limit-1
    expect(result).toEqual({ success: true, remaining: 4 });
  });

  it("TOKEN のみセットで URL 未設定でも in-memory フォールバックになる", async () => {
    vi.resetModules();
    upstashMocks.redisCalls.length = 0;
    upstashMocks.ratelimitCalls.length = 0;
    upstashMocks.limitFn.mockReset();
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const { rateLimitAsync } = await import("@/lib/rate-limit");
    const result = await rateLimitAsync("fallback-token-only", 3, 60000);

    expect(upstashMocks.redisCalls).toHaveLength(0);
    expect(upstashMocks.ratelimitCalls).toHaveLength(0);
    expect(upstashMocks.limitFn).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, remaining: 2 });
  });
});
