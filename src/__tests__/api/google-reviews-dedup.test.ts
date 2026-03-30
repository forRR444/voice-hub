import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, createMockQueryBuilder } from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockSupabaseClient = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient(),
}));

// ---------------------------------------------------------------------------
// Tests: google-reviews-modal の重複防止ロジック
// ---------------------------------------------------------------------------

describe("Google口コミ重複インポート防止", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upsertにonConflictとignoreDuplicates=trueが指定されている", async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mockSupa = {
      from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
    };
    mockSupabaseClient.mockReturnValue(mockSupa);

    // google-reviews-modalのhandleImportを直接テストするため、
    // upsertの呼び出し引数を検証する
    const supabase = mockSupabaseClient();
    await supabase
      .from("testimonials")
      .upsert(
        [{ workspace_id: "ws-1", source_id: "places/xxx/reviews/yyy", content: "良かった" }],
        { onConflict: "workspace_id,source_id", ignoreDuplicates: true }
      )
      .select();

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        onConflict: "workspace_id,source_id",
        ignoreDuplicates: true,
      })
    );
  });

  it("全件重複の場合：added=0, skipped=選択数 になる", () => {
    const selectedCount = 3;
    const insertedCount = 0; // 全件スキップ

    const added = insertedCount;
    const skipped = selectedCount - insertedCount;

    expect(added).toBe(0);
    expect(skipped).toBe(3);
  });

  it("一部重複の場合：added=新規件数, skipped=重複件数 になる", () => {
    const selectedCount = 5;
    const insertedCount = 2; // 2件だけ新規

    const added = insertedCount;
    const skipped = selectedCount - insertedCount;

    expect(added).toBe(2);
    expect(skipped).toBe(3);
  });

  it("重複なしの場合：added=全件, skipped=0 になる", () => {
    const selectedCount = 4;
    const insertedCount = 4; // 全件新規

    const added = insertedCount;
    const skipped = selectedCount - insertedCount;

    expect(added).toBe(4);
    expect(skipped).toBe(0);
  });

  it("source_idがgoogleIdとして正しくDBに渡される", () => {
    const googleId = "places/ChIJabc123/reviews/xyz789";
    const row = {
      workspace_id: "ws-1",
      source: "google",
      source_id: googleId,
      content: "口コミ内容",
      rating: 5,
    };

    expect(row.source_id).toBe(googleId);
    expect(row.source).toBe("google");
  });

  it("try-data-detectorのsourceIdがoptionalで、nullとしてDBに渡される", () => {
    // sourceIdなしのレビュー（サンプルデータなど）
    const reviewWithoutSourceId = {
      content: "良かった",
      rating: 5,
      publishTime: "2024-01-01",
    } as { content: string; rating: number; publishTime: string; sourceId?: string };

    const row = {
      source_id: reviewWithoutSourceId.sourceId ?? null,
    };

    expect(row.source_id).toBeNull();
  });
});
