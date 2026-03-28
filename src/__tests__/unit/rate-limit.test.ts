import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
