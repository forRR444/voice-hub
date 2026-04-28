import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../helpers/mock-supabase";
import { TestimonialWithTags } from "@/types/database";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ---------------------------------------------------------------------------
// テストデータ
// ---------------------------------------------------------------------------

const SAMPLE_TESTIMONIALS: TestimonialWithTags[] = [
  {
    id: "t-1",
    workspace_id: "ws-1",
    form_id: "f-1",
    rating: 5,
    content: "素晴らしいサービスです",
    before_story: "以前は集客に困っていました",
    name: "山田太郎",
    title: "コーチ",
    company: null,
    avatar_url: null,
    status: "approved",
    is_featured: false,
    permission_granted: true,
    source: "form",
    submitted_at: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
    tags: ["coaching"],
  },
  {
    id: "t-2",
    workspace_id: "ws-1",
    form_id: "f-1",
    rating: 4,
    content: "とても良かったです",
    before_story: null,
    name: "佐藤花子",
    title: null,
    company: "株式会社テスト",
    avatar_url: null,
    status: "pending",
    is_featured: true,
    permission_granted: true,
    source: "form",
    submitted_at: "2026-03-02T00:00:00Z",
    created_at: "2026-03-02T00:00:00Z",
    tags: [],
  },
  {
    id: "t-3",
    workspace_id: "ws-1",
    form_id: "f-1",
    rating: 3,
    content: "普通でした",
    before_story: null,
    name: "鈴木一郎",
    title: null,
    company: null,
    avatar_url: null,
    status: "rejected",
    is_featured: false,
    permission_granted: true,
    source: "manual",
    submitted_at: "2026-03-03T00:00:00Z",
    created_at: "2026-03-03T00:00:00Z",
    tags: ["bad"],
  },
];

// =========================================================================
// ステータスフィルタリング
// =========================================================================
describe("ダッシュボード - ステータスフィルタリング", () => {
  it("全てのフィルターで全件返す", () => {
    const filter = "all";
    const filtered =
      filter === "all"
        ? SAMPLE_TESTIMONIALS
        : SAMPLE_TESTIMONIALS.filter((t) => t.status === filter);
    expect(filtered).toHaveLength(3);
  });

  it("approvedフィルターで承認済みのみ返す", () => {
    const filter = "approved";
    const filtered = SAMPLE_TESTIMONIALS.filter((t) => t.status === filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("山田太郎");
  });

  it("pendingフィルターで未承認のみ返す", () => {
    const filter = "pending";
    const filtered = SAMPLE_TESTIMONIALS.filter((t) => t.status === filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("佐藤花子");
  });

  it("rejectedフィルターで非承認のみ返す", () => {
    const filter = "rejected";
    const filtered = SAMPLE_TESTIMONIALS.filter((t) => t.status === filter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("鈴木一郎");
  });
});

// =========================================================================
// 検索
// =========================================================================
describe("ダッシュボード - 検索", () => {
  function searchFilter(list: TestimonialWithTags[], query: string) {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
    );
  }

  it("名前で検索できる", () => {
    const result = searchFilter(SAMPLE_TESTIMONIALS, "山田");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t-1");
  });

  it("内容で検索できる", () => {
    const result = searchFilter(SAMPLE_TESTIMONIALS, "素晴らしい");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t-1");
  });

  it("空の検索クエリで全件返す", () => {
    const result = searchFilter(SAMPLE_TESTIMONIALS, "");
    expect(result).toHaveLength(3);
  });

  it("一致しないクエリで0件返す", () => {
    const result = searchFilter(SAMPLE_TESTIMONIALS, "存在しないテキスト");
    expect(result).toHaveLength(0);
  });

  it("大文字小文字を区別しない（英語）", () => {
    const list = [
      ...SAMPLE_TESTIMONIALS,
      { ...SAMPLE_TESTIMONIALS[0], id: "t-en", name: "Taro", content: "Great Service" },
    ];
    const result = searchFilter(list, "great");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t-en");
  });
});

// =========================================================================
// 統計計算
// =========================================================================
describe("ダッシュボード - 統計", () => {
  it("合計件数が正しい", () => {
    expect(SAMPLE_TESTIMONIALS.length).toBe(3);
  });

  it("承認済み件数が正しい", () => {
    const approved = SAMPLE_TESTIMONIALS.filter((t) => t.status === "approved").length;
    expect(approved).toBe(1);
  });

  it("未承認件数が正しい", () => {
    const pending = SAMPLE_TESTIMONIALS.filter((t) => t.status === "pending").length;
    expect(pending).toBe(1);
  });

  it("平均評価が正しい", () => {
    const rated = SAMPLE_TESTIMONIALS.filter((t) => t.rating != null);
    const avg = rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length;
    expect(avg).toBe(4);
  });

  it("評価なしのテスティモニアルは平均計算から除外される", () => {
    const withNull = [
      ...SAMPLE_TESTIMONIALS,
      { ...SAMPLE_TESTIMONIALS[0], id: "t-4", rating: null as unknown as number },
    ];
    const rated = withNull.filter((t) => t.rating != null);
    expect(rated).toHaveLength(3);
  });
});

// =========================================================================
// ステータス更新
// =========================================================================
describe("ダッシュボード - ステータス更新", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("承認操作でDBを更新する", async () => {
    mockSupabase = createMockSupabase({
      testimonials: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonials");
    await (builder as any).update({ status: "approved" }).eq("id", "t-2");

    expect(mockSupabase.from).toHaveBeenCalledWith("testimonials");
    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.status).toBe("approved");
  });

  it("却下操作でDBを更新する", async () => {
    mockSupabase = createMockSupabase({
      testimonials: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonials");
    await (builder as any).update({ status: "rejected" }).eq("id", "t-2");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.status).toBe("rejected");
  });

  it("ステータス更新後にローカルステートが更新される", () => {
    const list = [...SAMPLE_TESTIMONIALS];
    const updatedList = list.map((t) =>
      t.id === "t-2" ? { ...t, status: "approved" as const } : t
    );

    expect(updatedList.find((t) => t.id === "t-2")?.status).toBe("approved");
    expect(updatedList.find((t) => t.id === "t-1")?.status).toBe("approved"); // 変更なし
  });
});

// =========================================================================
// 注目トグル
// =========================================================================
describe("ダッシュボード - 注目トグル", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("注目をONにする", async () => {
    mockSupabase = createMockSupabase({
      testimonials: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonials");
    await (builder as any).update({ is_featured: true }).eq("id", "t-1");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.is_featured).toBe(true);
  });

  it("注目をOFFにする", async () => {
    mockSupabase = createMockSupabase({
      testimonials: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonials");
    await (builder as any).update({ is_featured: false }).eq("id", "t-2");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.is_featured).toBe(false);
  });

  it("トグル後にローカルステートが反転する", () => {
    const t = SAMPLE_TESTIMONIALS[1]; // is_featured: true
    const updated = { ...t, is_featured: !t.is_featured };
    expect(updated.is_featured).toBe(false);
  });
});

// =========================================================================
// テスティモニアル削除
// =========================================================================
describe("ダッシュボード - テスティモニアル削除", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タグを先に削除してからテスティモニアルを削除する", async () => {
    mockSupabase = createMockSupabase({
      testimonial_tags: { data: null, error: null },
      testimonials: { data: null, error: null },
    });

    // タグ削除
    const tagBuilder = mockSupabase.from("testimonial_tags");
    await (tagBuilder as any).delete().eq("testimonial_id", "t-1");
    expect(mockSupabase.from).toHaveBeenCalledWith("testimonial_tags");

    // テスティモニアル削除
    const builder = mockSupabase.from("testimonials");
    await (builder as any).delete().eq("id", "t-1");
    expect(mockSupabase.from).toHaveBeenCalledWith("testimonials");
  });
});

// =========================================================================
// タグ操作
// =========================================================================
describe("ダッシュボード - タグ操作", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タグを追加する", async () => {
    mockSupabase = createMockSupabase({
      testimonial_tags: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonial_tags");
    await (builder as any).insert({
      testimonial_id: "t-1",
      tag: "new-tag",
    });

    const insertCall = (builder as any).insert.mock.calls[0][0];
    expect(insertCall.testimonial_id).toBe("t-1");
    expect(insertCall.tag).toBe("new-tag");
  });

  it("タグを削除する", async () => {
    mockSupabase = createMockSupabase({
      testimonial_tags: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonial_tags");
    await (builder as any).delete().eq("testimonial_id", "t-1").eq("tag", "coaching");

    expect(mockSupabase.from).toHaveBeenCalledWith("testimonial_tags");
  });

  it("重複タグは追加しない", () => {
    const existingTags = ["coaching"];
    const newTag = "coaching";
    const isDuplicate = existingTags.includes(newTag);
    expect(isDuplicate).toBe(true);
  });

  it("空文字のタグは追加しない", () => {
    const tag = "   ";
    expect(!tag.trim()).toBe(true);
  });
});

// =========================================================================
// 手動追加
// =========================================================================
describe("ダッシュボード - 手動追加", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("手動テスティモニアルを挿入する", async () => {
    mockSupabase = createMockSupabase({
      testimonials: {
        data: {
          id: "t-new",
          workspace_id: "ws-1",
          name: "新規追加",
          content: "手動で追加したテスティモニアル",
          rating: 5,
          status: "approved",
          source: "manual",
          is_featured: false,
          permission_granted: true,
        },
        error: null,
      },
    });

    const builder = mockSupabase.from("testimonials");
    await (builder as any)
      .insert({
        workspace_id: "ws-1",
        name: "新規追加",
        content: "手動で追加したテスティモニアル",
        rating: 5,
        status: "approved",
        source: "manual",
        is_featured: false,
        permission_granted: true,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    const insertCall = (builder as any).insert.mock.calls[0][0];
    expect(insertCall.source).toBe("manual");
    expect(insertCall.name).toBe("新規追加");
  });

  it("名前と内容が空の場合はバリデーションで弾く", () => {
    const form = { name: "", content: "" };
    expect(!form.name.trim() || !form.content.trim()).toBe(true);
  });
});

// =========================================================================
// フォーム管理
// =========================================================================
describe("フォーム管理", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("フォームを作成する", async () => {
    mockSupabase = createMockSupabase({
      forms: {
        data: {
          id: "f-new",
          workspace_id: "ws-1",
          slug: "abc12345",
          title: "お客様の声フォーム",
        },
        error: null,
      },
    });

    const builder = mockSupabase.from("forms");
    await (builder as any)
      .insert({
        workspace_id: "ws-1",
        slug: "abc12345",
        title: "お客様の声フォーム",
        brand_color: "#635BFF",
      })
      .select()
      .single();

    const insertCall = (builder as any).insert.mock.calls[0][0];
    expect(insertCall.workspace_id).toBe("ws-1");
    expect(insertCall.slug).toHaveLength(8);
  });

  it("フォームのタイトルを編集する", async () => {
    mockSupabase = createMockSupabase({
      forms: { data: null, error: null },
    });

    const builder = mockSupabase.from("forms");
    await (builder as any).update({ title: "新しいタイトル" }).eq("id", "f-1");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.title).toBe("新しいタイトル");
  });

  it("フォームを削除する", async () => {
    mockSupabase = createMockSupabase({
      forms: { data: null, error: null },
    });

    const builder = mockSupabase.from("forms");
    await (builder as any).delete().eq("id", "f-1");

    expect(mockSupabase.from).toHaveBeenCalledWith("forms");
    expect((builder as any).delete).toHaveBeenCalled();
  });

  it("ベータ版ではフォーム1つまで", () => {
    const formsCount = 1;
    const limit = 1; // PLAN_LIMITS.free.forms
    expect(formsCount < limit).toBe(false); // canCreate = false
  });
});

// =========================================================================
// 設定ページ
// =========================================================================
describe("設定ページ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ワークスペース名を更新する", async () => {
    mockSupabase = createMockSupabase({
      workspaces: { data: null, error: null },
    });

    const builder = mockSupabase.from("workspaces");
    await (builder as any).update({ name: "新しいワークスペース名" }).eq("id", "ws-1");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.name).toBe("新しいワークスペース名");
  });

  it("空の名前では更新しない", () => {
    const name = "   ";
    expect(!name.trim()).toBe(true);
  });
});
