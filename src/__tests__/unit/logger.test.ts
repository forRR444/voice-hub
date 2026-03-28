import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("logError は常にconsole.errorを呼ぶ", async () => {
    const { logError } = await import("@/lib/logger");
    logError("test error", { detail: 1 });
    expect(console.error).toHaveBeenCalledWith("test error", { detail: 1 });
  });

  it("logWarn は開発環境でconsole.warnを呼ぶ", async () => {
    process.env.NODE_ENV = "development";
    const { logWarn } = await import("@/lib/logger");
    logWarn("test warn", "extra");
    expect(console.warn).toHaveBeenCalledWith("test warn", "extra");
  });

  it("logWarn は本番環境でconsole.warnを呼ばない", async () => {
    process.env.NODE_ENV = "production";
    const { logWarn } = await import("@/lib/logger");
    logWarn("test warn");
    expect(console.warn).not.toHaveBeenCalled();
  });
});
