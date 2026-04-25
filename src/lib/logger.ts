const isDev = process.env.NODE_ENV !== "production";

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "jwt",
  "access_token",
  "refresh_token",
  "client_secret",
  "signature",
  "stripe-signature",
  "email",
  "phone",
  "stripe_customer_id",
  "stripe_subscription_id",
] as const;

const MAX_DEPTH = 5;
const REDACTED = "[REDACTED]";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => lower.includes(s));
}

export function sanitize(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
  depth = 0,
): unknown {
  if (depth > MAX_DEPTH) return "[Truncated]";
  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === "bigint") {
    return value;
  }
  if (t === "function" || t === "symbol") return String(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    return value.map((v) => sanitize(v, seen, depth + 1));
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    try {
      const result: Record<string, unknown> = {};
      for (const [key, v] of Object.entries(value)) {
        result[key] = isSensitiveKey(key)
          ? REDACTED
          : sanitize(v, seen, depth + 1);
      }
      return result;
    } catch {
      return "[Unserializable]";
    }
  }

  // 非プレーンオブジェクト（クラスインスタンス等）はそのまま返す
  return value;
}

function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => sanitize(arg));
}

export function logError(message: string, ...args: unknown[]) {
  console.error(message, ...sanitizeArgs(args));
}

export function logWarn(message: string, ...args: unknown[]) {
  if (isDev) {
    console.warn(message, ...sanitizeArgs(args));
  }
}
