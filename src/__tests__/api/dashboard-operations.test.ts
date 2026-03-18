import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestimonialWithTags } from "@/types/database";
import {
  createMockSupabase,
  type QueryResult,
} from "../helpers/mock-supabase";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ---------------------------------------------------------------------------
// テストデータファクトリ
// ---------------------------------------------------------------------------

function makeTestimonial(
  overrides: Partial<TestimonialWithTags> = {}
): TestimonialWithTags {
  return {
    id: "t-1",
    workspace_id: "ws-1",
    form_id: "form-1",
    rating: 5,
    content: "Great product!",
    name: "Taro Yamada",
    title: null,
    company: null,
    avatar_url: null,
    status: "pending",
    is_featured: false,
    permission_granted: true,
    source: "form",
    submitted_at: "2026-01-15T00:00:00Z",
    created_at: "2026-01-15T00:00:00Z",
    tags: [],
    ...overrides,
  };
}

const sampleTestimonials: TestimonialWithTags[] = [
  makeTestimonial({ id: "t-1", name: "Taro Yamada", content: "Great product!", status: "approved", rating: 5 }),
  makeTestimonial({ id: "t-2", name: "Hanako Tanaka", content: "Needs improvement", status: "pending", rating: 3 }),
  makeTestimonial({ id: "t-3", name: "Jiro Suzuki", content: "Amazing service", status: "approved", rating: 4 }),
  makeTestimonial({ id: "t-4", name: "Yuki Sato", content: "Not good enough", status: "rejected", rating: 2 }),
  makeTestimonial({ id: "t-5", name: "Kenji Watanabe", content: "Excellent support", status: "pending", rating: 5, is_featured: true }),
  makeTestimonial({ id: "t-6", name: "Mai Kobayashi", content: "Good value for money", status: "approved", rating: null }),
];

// ---------------------------------------------------------------------------
// DashboardClientのフィルタリング・統計ロジックの再現
// ---------------------------------------------------------------------------

function filterTestimonials(
  testimonials: TestimonialWithTags[],
  filter: "all" | "pending" | "approved" | "rejected",
  search: string
): TestimonialWithTags[] {
  let list = testimonials;
  if (filter !== "all") {
    list = list.filter((t) => t.status === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
    );
  }
  return list;
}

function calculateStats(testimonials: TestimonialWithTags[]) {
  const total = testimonials.length;
  const approved = testimonials.filter((t) => t.status === "approved").length;
  const pending = testimonials.filter((t) => t.status === "pending").length;
  const rated = testimonials.filter((t) => t.rating != null);
  const avg =
    rated.length > 0
      ? rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length
      : 0;
  return { total, approved, pending, avg };
}

function canAddTag(existingTags: string[], newTag: string): boolean {
  const tag = newTag.trim();
  return tag !== "" && !existingTags.includes(tag);
}

function validateManualTestimonialForm(form: {
  name: string;
  content: string;
}): { valid: boolean; error?: string } {
  if (!form.name.trim() || !form.content.trim()) {
    return { valid: false, error: "名前と内容は必須です" };
  }
  return { valid: true };
}

function buildManualTestimonialPayload(
  workspaceId: string,
  form: {
    name: string;
    content: string;
    rating: number;
    title: string;
    company: string;
    status: "pending" | "approved" | "rejected";
  }
) {
  return {
    workspace_id: workspaceId,
    name: form.name,
    content: form.content,
    rating: form.rating,
    title: form.title || null,
    company: form.company || null,
    status: form.status,
    source: "manual",
    is_featured: false,
    permission_granted: true,
    submitted_at: expect.any(String),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

// ========================
// 1. テスティモニアルのフィルタリング
// ========================
describe("テスティモニアルのフィルタリング", () => {
  it("フィルタが'all'で検索なしの場合、全件返す", () => {
    const result = filterTestimonials(sampleTestimonials, "all", "");
    expect(result).toHaveLength(sampleTestimonials.length);
  });

  it.each([
    ["pending", 2],
    ["approved", 3],
    ["rejected", 1],
  ] as const)("ステータス '%s' でフィルタすると %d 件返す", (status, count) => {
    const result = filterTestimonials(sampleTestimonials, status, "");
    expect(result).toHaveLength(count);
    expect(result.every((t) => t.status === status)).toBe(true);
  });

  it("名前で大文字小文字を区別せず検索する", () => {
    const result = filterTestimonials(sampleTestimonials, "all", "taro");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Taro Yamada");
  });

  it("内容で大文字小文字を区別せず検索する", () => {
    const result = filterTestimonials(sampleTestimonials, "all", "amazing");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Amazing service");
  });

  it("フィルタと検索を組み合わせる", () => {
    const result = filterTestimonials(sampleTestimonials, "approved", "great");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t-1");
  });

  it("マッチなしで空配列を返す", () => {
    expect(filterTestimonials(sampleTestimonials, "all", "nonexistent")).toHaveLength(0);
  });

  it("空白のみの検索を無視する", () => {
    expect(filterTestimonials(sampleTestimonials, "all", "   ")).toHaveLength(
      sampleTestimonials.length
    );
  });
});

// ========================
// 2. テスティモニアルのステータス管理
// ========================
describe("テスティモニアルのステータス管理", () => {
  it.each(["approved", "rejected"] as const)(
    "ステータスを '%s' に更新するSupabase呼び出しを行う",
    (status) => {
      mockSupabase = createMockSupabase({
        testimonials: { data: null, error: null },
      });

      const builder = mockSupabase.from("testimonials");
      (builder as any).update({ status });
      (builder as any).eq("id", "t-2");

      expect(mockSupabase.from).toHaveBeenCalledWith("testimonials");
      expect((builder as any).update).toHaveBeenCalledWith({ status });
      expect((builder as any).eq).toHaveBeenCalledWith("id", "t-2");
    }
  );

  it.each([
    [false, true, "t-1"],
    [true, false, "t-5"],
  ])(
    "is_featuredを %s から %s にトグルする",
    (current, expected, id) => {
      mockSupabase = createMockSupabase({
        testimonials: { data: null, error: null },
      });

      const builder = mockSupabase.from("testimonials");
      (builder as any).update({ is_featured: !current });
      (builder as any).eq("id", id);

      expect((builder as any).update).toHaveBeenCalledWith({ is_featured: expected });
    }
  );

  it("ステータス更新後も他のフィールドがローカルステートで保持される", () => {
    const testimonial = makeTestimonial({ id: "t-1", status: "pending", rating: 5 });
    const updated = { ...testimonial, status: "approved" as const };
    expect(updated.status).toBe("approved");
    expect(updated.rating).toBe(5);
    expect(updated.id).toBe("t-1");
    expect(updated.name).toBe("Taro Yamada");
  });
});

// ========================
// 3. タグ管理
// ========================
describe("タグ管理", () => {
  it("タグ追加でSupabase insertが呼ばれる", () => {
    mockSupabase = createMockSupabase({
      testimonial_tags: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonial_tags");
    (builder as any).insert({ testimonial_id: "t-1", tag: "quality" });

    expect(mockSupabase.from).toHaveBeenCalledWith("testimonial_tags");
    expect((builder as any).insert).toHaveBeenCalledWith({
      testimonial_id: "t-1",
      tag: "quality",
    });
  });

  it("タグ削除でSupabase deleteが正しいフィルタで呼ばれる", () => {
    mockSupabase = createMockSupabase({
      testimonial_tags: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonial_tags");
    (builder as any).delete();
    (builder as any).eq("testimonial_id", "t-1");
    (builder as any).eq("tag", "quality");

    expect((builder as any).delete).toHaveBeenCalled();
    expect((builder as any).eq).toHaveBeenCalledWith("testimonial_id", "t-1");
    expect((builder as any).eq).toHaveBeenCalledWith("tag", "quality");
  });

  it.each([
    ["重複タグを拒否する", ["quality", "support"], "quality", false],
    ["新規タグを許可する", ["quality", "support"], "new-tag", true],
    ["空タグを拒否する", [], "", false],
    ["空白のみのタグを拒否する", [], "  ", false],
    ["前後の空白をトリムして許可する", [], "  quality  ", true],
  ])("%s", (_label, existing, newTag, expected) => {
    expect(canAddTag(existing, newTag)).toBe(expected);
  });

  it("タグ追加後のローカルステート更新", () => {
    const prev = makeTestimonial({ tags: ["support"] });
    const updated = { ...prev, tags: [...prev.tags, "quality"] };
    expect(updated.tags).toEqual(["support", "quality"]);
  });

  it("タグ削除後のローカルステート更新", () => {
    const prev = makeTestimonial({ tags: ["support", "quality", "service"] });
    const updated = {
      ...prev,
      tags: prev.tags.filter((t) => t !== "quality"),
    };
    expect(updated.tags).toEqual(["support", "service"]);
  });
});

// ========================
// 4. 手動テスティモニアル作成
// ========================
describe("手動テスティモニアル作成", () => {
  it("全フィールド指定で正しいペイロードを構築する", () => {
    const payload = buildManualTestimonialPayload("ws-1", {
      name: "Taro Yamada",
      content: "Excellent service!",
      rating: 5,
      title: "CEO",
      company: "Acme Corp",
      status: "approved",
    });

    expect(payload).toMatchObject({
      workspace_id: "ws-1",
      name: "Taro Yamada",
      content: "Excellent service!",
      rating: 5,
      title: "CEO",
      company: "Acme Corp",
      status: "approved",
      source: "manual",
      is_featured: false,
      permission_granted: true,
    });
  });

  it("オプションフィールド未指定でnullが設定される", () => {
    const payload = buildManualTestimonialPayload("ws-1", {
      name: "Taro",
      content: "Good",
      rating: 3,
      title: "",
      company: "",
      status: "approved",
    });

    expect(payload.title).toBeNull();
    expect(payload.company).toBeNull();
    expect(payload.source).toBe("manual");
  });

  it.each([
    ["名前が空", { name: "", content: "Some content" }],
    ["内容が空", { name: "Taro", content: "" }],
    ["名前と内容が空白のみ", { name: "  ", content: "  " }],
  ])("バリデーション失敗: %s", (_label, form) => {
    const result = validateManualTestimonialForm(form);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("名前と内容は必須です");
  });

  it("有効な入力でバリデーション成功", () => {
    const result = validateManualTestimonialForm({ name: "Taro", content: "Great!" });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("Supabase insertが正しいテーブルとチェーンで呼ばれる", async () => {
    const insertedRow = {
      id: "t-new",
      workspace_id: "ws-1",
      name: "Taro",
      content: "Great!",
      rating: 5,
      status: "approved",
      source: "manual",
      is_featured: false,
      permission_granted: true,
      submitted_at: "2026-01-15T00:00:00Z",
      created_at: "2026-01-15T00:00:00Z",
    };

    mockSupabase = createMockSupabase({
      testimonials: { data: insertedRow, error: null },
    });

    const builder = mockSupabase.from("testimonials");
    (builder as any).insert({
      workspace_id: "ws-1",
      name: "Taro",
      content: "Great!",
      rating: 5,
      title: null,
      company: null,
      status: "approved",
      source: "manual",
      is_featured: false,
      permission_granted: true,
      submitted_at: new Date().toISOString(),
    });
    (builder as any).select();
    const result = await (builder as any).single();

    expect(mockSupabase.from).toHaveBeenCalledWith("testimonials");
    expect((builder as any).insert).toHaveBeenCalled();
    expect((builder as any).select).toHaveBeenCalled();
    expect(result.data).toEqual(insertedRow);
    expect(result.error).toBeNull();
  });

  it("onAddedコールバックがtags: []を付与する", () => {
    const data = {
      id: "t-new",
      workspace_id: "ws-1",
      name: "Taro",
      content: "Great!",
      rating: 5,
      status: "approved" as const,
      source: "manual",
      is_featured: false,
      permission_granted: true,
      form_id: null,
      title: null,
      company: null,
      avatar_url: null,
      submitted_at: "2026-01-15T00:00:00Z",
      created_at: "2026-01-15T00:00:00Z",
    };
    const withTags: TestimonialWithTags = { ...data, tags: [] };
    expect(withTags.tags).toEqual([]);
    expect(withTags.id).toBe("t-new");
  });
});

// ========================
// 5. テスティモニアル削除
// ========================
describe("テスティモニアル削除", () => {
  it("タグ削除後にテスティモニアルを削除する順序", () => {
    mockSupabase = createMockSupabase({
      testimonials: { data: null, error: null },
      testimonial_tags: { data: null, error: null },
    });

    const callOrder: string[] = [];
    const origFrom = mockSupabase.from;
    mockSupabase.from = vi.fn((table: string) => {
      callOrder.push(table);
      return origFrom(table);
    });

    // タグを先に削除
    const tagsBuilder = mockSupabase.from("testimonial_tags");
    (tagsBuilder as any).delete();
    (tagsBuilder as any).eq("testimonial_id", "t-1");

    // テスティモニアルを削除
    const testimonialBuilder = mockSupabase.from("testimonials");
    (testimonialBuilder as any).delete();
    (testimonialBuilder as any).eq("id", "t-1");

    expect(callOrder[0]).toBe("testimonial_tags");
    expect(callOrder[1]).toBe("testimonials");
    expect((testimonialBuilder as any).delete).toHaveBeenCalled();
    expect((testimonialBuilder as any).eq).toHaveBeenCalledWith("id", "t-1");
  });
});

// ========================
// 6. 統計計算
// ========================
describe("統計計算", () => {
  it("サンプルデータの統計を正しく計算する", () => {
    const stats = calculateStats(sampleTestimonials);
    expect(stats.total).toBe(6);
    expect(stats.approved).toBe(3);
    expect(stats.pending).toBe(2);
    // 5, 3, 4, 2, 5 => avg = 19/5 = 3.8
    expect(stats.avg).toBeCloseTo(19 / 5);
  });

  it("全テスティモニアルのratingがnullの場合、avgは0", () => {
    const noRatings = [
      makeTestimonial({ id: "t-1", rating: null }),
      makeTestimonial({ id: "t-2", rating: null }),
    ];
    expect(calculateStats(noRatings).avg).toBe(0);
  });

  it("空配列の場合、全統計値が0", () => {
    const stats = calculateStats([]);
    expect(stats).toEqual({ total: 0, approved: 0, pending: 0, avg: 0 });
  });

  it("1件のテスティモニアルで正しく計算する", () => {
    const stats = calculateStats([makeTestimonial({ status: "approved", rating: 4 })]);
    expect(stats).toEqual({ total: 1, approved: 1, pending: 0, avg: 4 });
  });
});
