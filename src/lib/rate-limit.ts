import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash Redis が設定されていればグローバルレート制限を使用
// 未設定の場合はインメモリのフォールバック（開発環境向け）
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(windowMs: number, limit: number): Ratelimit {
  const key = `${windowMs}:${limit}`;
  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(
      key,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: false,
      })
    );
  }
  return upstashLimiters.get(key)!;
}

// インメモリフォールバック（開発環境用）
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore) {
      if (v.resetAt < now) memoryStore.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  if (redis) {
    const limiter = getUpstashLimiter(windowMs, limit);
    const result = await limiter.limit(key);
    return { success: result.success, remaining: result.remaining };
  }
  return memoryRateLimit(key, limit, windowMs);
}

// 同期版（後方互換性のため維持、インメモリのみ）
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  return memoryRateLimit(key, limit, windowMs);
}
