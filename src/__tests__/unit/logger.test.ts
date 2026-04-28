import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("logError は常にconsole.errorを呼ぶ", async () => {
    const { logError } = await import("@/lib/logger");
    logError("test error", { detail: 1 });
    expect(console.error).toHaveBeenCalledWith("test error", { detail: 1 });
  });

  it("logWarn は開発環境でconsole.warnを呼ぶ", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { logWarn } = await import("@/lib/logger");
    logWarn("test warn", "extra");
    expect(console.warn).toHaveBeenCalledWith("test warn", "extra");
  });

  it("logWarn は本番環境でconsole.warnを呼ばない", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logWarn } = await import("@/lib/logger");
    logWarn("test warn");
    expect(console.warn).not.toHaveBeenCalled();
  });

  describe("sanitize", () => {
    it("プレーンオブジェクトの機微キーをREDACTEDに置換する", async () => {
      const { sanitize } = await import("@/lib/logger");
      const out = sanitize({
        password: "secret123",
        token: "abc",
        api_key: "k",
        email: "x@example.com",
        name: "alice",
      });
      expect(out).toEqual({
        password: "[REDACTED]",
        token: "[REDACTED]",
        api_key: "[REDACTED]",
        email: "[REDACTED]",
        name: "alice",
      });
    });

    it("ネストしたオブジェクトの機微キーも再帰的にREDACTEDになる", async () => {
      const { sanitize } = await import("@/lib/logger");
      const out = sanitize({
        user: { id: 1, password: "p", profile: { jwt: "j" } },
      });
      expect(out).toEqual({
        user: { id: 1, password: "[REDACTED]", profile: { jwt: "[REDACTED]" } },
      });
    });

    it("配列の中の機微キーも再帰的にREDACTEDになる", async () => {
      const { sanitize } = await import("@/lib/logger");
      const out = sanitize([
        { name: "a", access_token: "1" },
        { name: "b", access_token: "2" },
      ]);
      expect(out).toEqual([
        { name: "a", access_token: "[REDACTED]" },
        { name: "b", access_token: "[REDACTED]" },
      ]);
    });

    it("Errorインスタンスはname/message/stackのプレーンオブジェクトに変換される", async () => {
      const { sanitize } = await import("@/lib/logger");
      const err = new Error("boom");
      const out = sanitize(err) as { name: string; message: string; stack: unknown };
      expect(out.name).toBe("Error");
      expect(out.message).toBe("boom");
      expect(typeof out.stack).toBe("string");
    });

    it("循環参照を [Circular] に置換する", async () => {
      const { sanitize } = await import("@/lib/logger");
      type Cyc = { a: number; self?: Cyc };
      const obj: Cyc = { a: 1 };
      obj.self = obj;
      const out = sanitize(obj) as { a: number; self: unknown };
      expect(out.a).toBe(1);
      expect(out.self).toBe("[Circular]");
    });

    it("MAX_DEPTH を超える深いネストは [Truncated] になる", async () => {
      const { sanitize } = await import("@/lib/logger");
      const deep = { a: { b: { c: { d: { e: { f: { g: "x" } } } } } } };
      const out = sanitize(deep) as Record<string, unknown>;
      let cur: unknown = out;
      for (const k of ["a", "b", "c", "d", "e"]) {
        cur = (cur as Record<string, unknown>)[k];
      }
      expect(cur).toEqual({ f: "[Truncated]" });
    });

    it("プリミティブ値はそのまま返る", async () => {
      const { sanitize } = await import("@/lib/logger");
      expect(sanitize("plain")).toBe("plain");
      expect(sanitize(42)).toBe(42);
      expect(sanitize(true)).toBe(true);
      expect(sanitize(null)).toBeNull();
      expect(sanitize(undefined)).toBeUndefined();
    });

    it("logError は機微キーをサニタイズして渡す", async () => {
      const { logError } = await import("@/lib/logger");
      logError("err", { user: "alice", password: "p", token: "t" });
      expect(console.error).toHaveBeenCalledWith("err", {
        user: "alice",
        password: "[REDACTED]",
        token: "[REDACTED]",
      });
    });
  });
});
