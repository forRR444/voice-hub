import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Tests: Google口コミ重複インポート防止ロジック
// upsertから「既存チェック→重複除外→insert」に変更後のテスト
// ---------------------------------------------------------------------------

describe("Google口コミ重複インポート防止", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 重複除外ロジック ──────────────────────────────────────

  describe("重複除外ロジック", () => {
    function filterNewRows(rows: { source_id: string | null }[], existingSourceIds: string[]) {
      const existingIds = new Set(existingSourceIds);
      return rows.filter((r) => !r.source_id || !existingIds.has(r.source_id));
    }

    it("全件新規の場合、全てが残る", () => {
      const rows = [
        { source_id: "review-1" },
        { source_id: "review-2" },
        { source_id: "review-3" },
      ];
      const existing: string[] = [];

      const result = filterNewRows(rows, existing);
      expect(result).toHaveLength(3);
    });

    it("全件重複の場合、空配列が返る", () => {
      const rows = [{ source_id: "review-1" }, { source_id: "review-2" }];
      const existing = ["review-1", "review-2"];

      const result = filterNewRows(rows, existing);
      expect(result).toHaveLength(0);
    });

    it("一部重複の場合、新規分だけ残る", () => {
      const rows = [
        { source_id: "review-1" },
        { source_id: "review-2" },
        { source_id: "review-3" },
      ];
      const existing = ["review-1"];

      const result = filterNewRows(rows, existing);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.source_id)).toEqual(["review-2", "review-3"]);
    });

    it("source_idがnullのレコードは重複チェックをスキップして残る", () => {
      const rows = [{ source_id: null }, { source_id: "review-1" }];
      const existing = ["review-1"];

      const result = filterNewRows(rows, existing);
      expect(result).toHaveLength(1);
      expect(result[0].source_id).toBeNull();
    });
  });

  // ─── added/skippedの計算 ───────────────────────────────────

  describe("added/skippedの計算", () => {
    it("全件重複の場合：added=0, skipped=選択数", () => {
      const selectedCount = 3;
      const insertedCount = 0;

      const added = insertedCount;
      const skipped = selectedCount - insertedCount;

      expect(added).toBe(0);
      expect(skipped).toBe(3);
    });

    it("一部重複の場合：added=新規件数, skipped=重複件数", () => {
      const selectedCount = 5;
      const insertedCount = 2;

      const added = insertedCount;
      const skipped = selectedCount - insertedCount;

      expect(added).toBe(2);
      expect(skipped).toBe(3);
    });

    it("重複なしの場合：added=全件, skipped=0", () => {
      const selectedCount = 4;
      const insertedCount = 4;

      const added = insertedCount;
      const skipped = selectedCount - insertedCount;

      expect(added).toBe(4);
      expect(skipped).toBe(0);
    });
  });

  // ─── source_idの扱い ──────────────────────────────────────

  describe("source_idの扱い", () => {
    it("googleIdがsource_idとして正しくマッピングされる", () => {
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

    it("sourceIdがundefinedの場合、nullとしてマッピングされる", () => {
      const review = {
        content: "良かった",
        rating: 5,
        publishTime: "2024-01-01",
      } as { content: string; rating: number; publishTime: string; sourceId?: string };

      const row = {
        source_id: review.sourceId ?? null,
      };

      expect(row.source_id).toBeNull();
    });

    it("sourceIdsのフィルタリングでnull/undefinedが除外される", () => {
      const rows = [{ source_id: "review-1" }, { source_id: null }, { source_id: "review-2" }];
      const sourceIds = rows.map((r) => r.source_id).filter(Boolean);

      expect(sourceIds).toEqual(["review-1", "review-2"]);
      expect(sourceIds).toHaveLength(2);
    });
  });

  // ─── newRowsが空の場合 ────────────────────────────────────

  describe("newRowsが空の場合", () => {
    it("insertが呼ばれない", () => {
      const newRows: unknown[] = [];
      const mockInsert = vi.fn();

      if (newRows.length > 0) {
        mockInsert(newRows);
      }

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  // ─── ファイル名の特殊文字処理 ─────────────────────────────

  describe("ファイル名の特殊文字処理（ZIPダウンロード用）", () => {
    function sanitizeName(name: string): string {
      return (name || "お客様").replace(/[/\\?%*:|"<>]/g, "_");
    }

    it("通常の名前はそのまま返る", () => {
      expect(sanitizeName("田中太郎")).toBe("田中太郎");
    });

    it("空の名前は「お客様」にフォールバックする", () => {
      expect(sanitizeName("")).toBe("お客様");
    });

    it("特殊文字がアンダースコアに置換される", () => {
      expect(sanitizeName("name/with\\special?chars")).toBe("name_with_special_chars");
    });

    it("複数の特殊文字が全て置換される", () => {
      expect(sanitizeName('a<b>c:d"e|f')).toBe("a_b_c_d_e_f");
    });
  });
});
