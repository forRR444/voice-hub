// Simple in-memory rate limiter.
// NOTE: On serverless (Vercel), each instance has its own memory,
// so this only provides per-instance throttling, not global rate limiting.
// For production-grade rate limiting, migrate to Upstash Redis.

const globalStore = globalThis as unknown as {
  __rateLimitMap?: Map<string, { count: number; resetAt: number }>;
};

if (!globalStore.__rateLimitMap) {
  globalStore.__rateLimitMap = new Map();
}

const rateLimitMap = globalStore.__rateLimitMap;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
