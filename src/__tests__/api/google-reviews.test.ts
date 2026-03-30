import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeRequest } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn().mockReturnValue("127.0.0.1");
vi.mock("@/lib/api-utils", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GUEST_AUTH = { data: { user: null }, error: null };
const USER_AUTH = { data: { user: { id: "user-123" } }, error: null };

function rateLimitedResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 429 });
}

function placesApiResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/google-reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = "test-api-key";
    mockGetUser.mockResolvedValue(GUEST_AUTH);
    mockCheckRateLimit.mockResolvedValue(null); // 制限なし（デフォルト）
  });

  // --- 共通エラー ---

  it("APIキー未設定で500を返す", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("APIキー");
  });

  it("actionなしで400を返す", async () => {
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews") as never);
    expect(res.status).toBe(400);
  });

  // --- レートリミット: 未ログイン ---

  it("未ログイン - 時間制限超過で429を返し適切なメッセージを含む", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(
      rateLimitedResponse("1時間あたりの利用上限に達しました。")
    );
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("1時間あたりの利用上限に達しました。");
  });

  it("未ログイン - 日次制限超過で429を返し適切なメッセージを含む", async () => {
    mockCheckRateLimit
      .mockResolvedValueOnce(null) // hourly: OK
      .mockResolvedValueOnce(
        rateLimitedResponse("本日の利用上限に達しました。")
      );
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("本日の利用上限に達しました。");
  });

  // --- レートリミット: ログイン済み ---

  it("ログイン済み - 日次制限超過で429を返し適切なメッセージを含む", async () => {
    mockGetUser.mockResolvedValue(USER_AUTH);
    mockCheckRateLimit.mockResolvedValueOnce(
      rateLimitedResponse("本日の利用上限に達しました。")
    );
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("本日の利用上限に達しました。");
  });

  // --- レートリミットキーの確認 ---

  it("未ログイン - IPベースのキーでレートリミットを呼ぶ", async () => {
    mockFetch.mockResolvedValue(placesApiResponse({ places: [] }));
    const { GET } = await import("@/app/api/google-reviews/route");
    await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("guest"),
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
    );
  });

  it("ログイン済み - ユーザーIDベースのキーでレートリミットを呼ぶ", async () => {
    mockGetUser.mockResolvedValue(USER_AUTH);
    mockFetch.mockResolvedValue(placesApiResponse({ places: [] }));
    const { GET } = await import("@/app/api/google-reviews/route");
    await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("user-123"),
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
    );
  });

  // --- search ---

  it("search - 正常なリクエストで場所一覧を返す", async () => {
    const places = [{ id: "p1", displayName: { text: "テスト歯科" }, formattedAddress: "東京都..." }];
    mockFetch.mockResolvedValue(placesApiResponse({ places }));
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=テスト歯科") as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.places).toEqual(places);
  });

  it("search - queryなしで400を返す", async () => {
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search") as never);
    expect(res.status).toBe(400);
  });

  it("search - Places APIエラー時にエラーを返す", async () => {
    mockFetch.mockResolvedValue(placesApiResponse({ error: { message: "API error" } }, false));
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=search&query=test") as never);
    expect(res.status).toBe(400);
  });

  // --- reviews ---

  it("reviews - 正常なリクエストで口コミ一覧を返す", async () => {
    const reviews = [{ name: "r1", rating: 5, text: { text: "良かった" }, publishTime: "2024-01-01" }];
    mockFetch.mockResolvedValue(placesApiResponse({ reviews, displayName: { text: "テスト歯科" } }));
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=reviews&placeId=place-123") as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reviews).toEqual(reviews);
    expect(json.placeName).toBe("テスト歯科");
  });

  it("reviews - placeIdなしで400を返す", async () => {
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=reviews") as never);
    expect(res.status).toBe(400);
  });

  it("reviews - 口コミなし時は空配列を返す", async () => {
    mockFetch.mockResolvedValue(placesApiResponse({ displayName: { text: "テスト" } }));
    const { GET } = await import("@/app/api/google-reviews/route");
    const res = await GET(makeRequest("http://localhost/api/google-reviews?action=reviews&placeId=place-123") as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reviews).toEqual([]);
  });
});
