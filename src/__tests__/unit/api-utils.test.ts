import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the module under test
vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { getClientIp, checkRateLimit, handleApiError } from "@/lib/api-utils";
import { rateLimitAsync } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("x-forwarded-for の最初のIPを返す", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("x-forwarded-for がない場合 x-real-ip を返す", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(request)).toBe("9.8.7.6");
  });

  it("どちらもない場合 'unknown' を返す", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });
});

// ─── checkRateLimit ───────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("レート制限内の場合 null を返す", async () => {
    vi.mocked(rateLimitAsync).mockResolvedValue({ success: true, remaining: 9 });
    const result = await checkRateLimit("test-key", 10, 60000);
    expect(result).toBeNull();
  });

  it("レート制限超過の場合 429レスポンスを返す", async () => {
    vi.mocked(rateLimitAsync).mockResolvedValue({ success: false, remaining: 0 });
    const result = await checkRateLimit("test-key", 10, 60000);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    const body = await result!.json();
    expect(body.error).toContain("リクエスト数の制限");
  });
});

// ─── handleApiError ───────────────────────────────────────────────────────────

describe("handleApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("デフォルトメッセージで500レスポンスを返す", async () => {
    const error = new Error("something broke");
    const result = handleApiError(error);
    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe("サーバーエラーが発生しました");
    expect(logError).toHaveBeenCalledWith("サーバーエラーが発生しました", error);
  });

  it("カスタムメッセージで500レスポンスを返す", async () => {
    const result = handleApiError("err", "カスタムエラー");
    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe("カスタムエラー");
  });

  it("headersが指定された場合レスポンスに含まれる", async () => {
    const result = handleApiError("err", "エラー", { "X-Custom": "value" });
    expect(result.status).toBe(500);
    expect(result.headers.get("X-Custom")).toBe("value");
  });

  it("headersが未指定の場合でも正常に動作する", async () => {
    const result = handleApiError("err");
    expect(result.status).toBe(500);
  });
});
