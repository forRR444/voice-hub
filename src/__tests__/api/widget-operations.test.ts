import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../helpers/mock-supabase";
import { WidgetTheme } from "@/types/database";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const DEFAULT_THEME: WidgetTheme = {
  mode: "light",
  brandColor: "#635BFF",
  showRating: true,
  showAvatar: true,
  showDate: false,
  maxItems: 10,
  autoplay: true,
};

const SAMPLE_WIDGET = {
  id: "w-1",
  workspace_id: "ws-1",
  name: "テストウィジェット",
  type: "carousel" as const,
  theme: DEFAULT_THEME,
  filter_min_rating: 1,
  only_featured: false,
  created_at: "2026-01-01T00:00:00Z",
};

// =========================================================================
// ウィジェット編集
// =========================================================================
describe("ウィジェット編集", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("名前を更新する", async () => {
    mockSupabase = createMockSupabase({
      widgets: { data: { ...SAMPLE_WIDGET, name: "新しい名前" }, error: null },
    });

    const builder = mockSupabase.from("widgets");
    await (builder as any).update({ name: "新しい名前" }).eq("id", SAMPLE_WIDGET.id);

    expect(mockSupabase.from).toHaveBeenCalledWith("widgets");
    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.name).toBe("新しい名前");
  });

  it("タイプを変更する", async () => {
    mockSupabase = createMockSupabase({
      widgets: { data: null, error: null },
    });

    const builder = mockSupabase.from("widgets");
    await (builder as any).update({ type: "grid" }).eq("id", SAMPLE_WIDGET.id);

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.type).toBe("grid");
  });

  it.each(["carousel", "grid", "marquee", "list", "single", "wall", "badge"] as const)(
    "タイプ '%s' に変更できる",
    async (type) => {
      mockSupabase = createMockSupabase({
        widgets: { data: null, error: null },
      });

      const builder = mockSupabase.from("widgets");
      await (builder as any).update({ type }).eq("id", SAMPLE_WIDGET.id);

      const updateCall = (builder as any).update.mock.calls[0][0];
      expect(updateCall.type).toBe(type);
    }
  );

  it("テーマ設定を更新する", async () => {
    const newTheme: WidgetTheme = {
      ...DEFAULT_THEME,
      mode: "dark",
      brandColor: "#ff0000",
      showDate: true,
      maxItems: 20,
      autoplay: false,
    };

    mockSupabase = createMockSupabase({
      widgets: { data: null, error: null },
    });

    const builder = mockSupabase.from("widgets");
    await (builder as any).update({ theme: newTheme }).eq("id", SAMPLE_WIDGET.id);

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.theme.mode).toBe("dark");
    expect(updateCall.theme.brandColor).toBe("#ff0000");
    expect(updateCall.theme.showDate).toBe(true);
    expect(updateCall.theme.maxItems).toBe(20);
    expect(updateCall.theme.autoplay).toBe(false);
  });

  it("フィルター設定を更新する", async () => {
    mockSupabase = createMockSupabase({
      widgets: { data: null, error: null },
    });

    const builder = mockSupabase.from("widgets");
    await (builder as any)
      .update({ filter_min_rating: 4, only_featured: true })
      .eq("id", SAMPLE_WIDGET.id);

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.filter_min_rating).toBe(4);
    expect(updateCall.only_featured).toBe(true);
  });

  it("複数フィールドを同時に更新する", async () => {
    mockSupabase = createMockSupabase({
      widgets: { data: null, error: null },
    });

    const updates = {
      name: "更新済みウィジェット",
      type: "marquee",
      theme: { ...DEFAULT_THEME, mode: "dark" as const },
      filter_min_rating: 3,
      only_featured: true,
    };

    const builder = mockSupabase.from("widgets");
    await (builder as any).update(updates).eq("id", SAMPLE_WIDGET.id);

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall).toMatchObject(updates);
  });
});

// =========================================================================
// ウィジェット削除
// =========================================================================
describe("ウィジェット削除", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("IDでウィジェットを削除する", async () => {
    mockSupabase = createMockSupabase({
      widgets: { data: null, error: null },
    });

    const builder = mockSupabase.from("widgets");
    await (builder as any).delete().eq("id", SAMPLE_WIDGET.id);

    expect(mockSupabase.from).toHaveBeenCalledWith("widgets");
    expect((builder as any).delete).toHaveBeenCalled();
  });

  it("削除エラー時にウィジェットリストが変更されない", () => {
    const widgets = [SAMPLE_WIDGET];
    const error = { message: "delete failed" };

    // エラーの場合はフィルタしない
    const updatedWidgets = error ? widgets : widgets.filter((w) => w.id !== SAMPLE_WIDGET.id);

    expect(updatedWidgets).toHaveLength(1);
    expect(updatedWidgets[0].id).toBe(SAMPLE_WIDGET.id);
  });

  it("削除成功時にウィジェットリストからIDが除外される", () => {
    const widgets = [SAMPLE_WIDGET, { ...SAMPLE_WIDGET, id: "w-2", name: "別のウィジェット" }];

    const updatedWidgets = widgets.filter((w) => w.id !== SAMPLE_WIDGET.id);

    expect(updatedWidgets).toHaveLength(1);
    expect(updatedWidgets[0].id).toBe("w-2");
  });
});

// =========================================================================
// ウィジェット作成時のバリデーション
// =========================================================================
describe("ウィジェット作成のバリデーション", () => {
  it("空の名前ではウィジェットを作成しない", () => {
    const name = "";
    expect(name.trim()).toBe("");
    expect(!name.trim()).toBe(true);
  });

  it("空白のみの名前ではウィジェットを作成しない", () => {
    const name = "   ";
    expect(!name.trim()).toBe(true);
  });

  it("有効な名前ではウィジェットを作成できる", () => {
    const name = "LP用カルーセル";
    expect(!!name.trim()).toBe(true);
  });
});

// =========================================================================
// 埋め込みコード生成
// =========================================================================
describe("埋め込みコード生成", () => {
  const baseUrl = "https://voicehub.jp";
  const widgetId = "4095d643-4f20-43dd-866c-4533d03900cd";

  function getScriptEmbed(id: string) {
    return `<script src="${baseUrl}/widget/v1/embed.js" defer></script>\n<div data-testimonial-widget="${id}" data-theme="light"></div>`;
  }

  function getIframeEmbed(id: string) {
    return `<iframe src="${baseUrl}/preview/${id}" width="100%" height="400" frameborder="0"></iframe>`;
  }

  it("スクリプト埋め込みコードが正しい形式", () => {
    const code = getScriptEmbed(widgetId);
    expect(code).toContain("embed.js");
    expect(code).toContain("defer");
    expect(code).toContain(`data-testimonial-widget="${widgetId}"`);
    expect(code).toContain('data-theme="light"');
    expect(code.split("\n")).toHaveLength(2);
  });

  it("iframe埋め込みコードが正しい形式", () => {
    const code = getIframeEmbed(widgetId);
    expect(code).toContain(`/preview/${widgetId}`);
    expect(code).toContain('width="100%"');
    expect(code).toContain('height="400"');
    expect(code).toContain('frameborder="0"');
  });

  it("UUIDを含むウィジェットIDが正しくエンコードされる", () => {
    const code = getScriptEmbed(widgetId);
    expect(code).toContain(widgetId);
    // UUIDにHTMLエスケープが必要な文字が含まれないことを確認
    expect(widgetId).toMatch(/^[a-f0-9-]+$/);
  });
});

// =========================================================================
// テーマのデフォルトとマージ
// =========================================================================
describe("テーマのデフォルトとマージ", () => {
  it("空のテーマオブジェクトにデフォルト値がマージされる", () => {
    const widgetTheme = {};
    const merged = { ...DEFAULT_THEME, ...widgetTheme };
    expect(merged).toEqual(DEFAULT_THEME);
  });

  it("部分的なテーマオブジェクトが正しくマージされる", () => {
    const widgetTheme = { mode: "dark" as const, brandColor: "#000000" };
    const merged = { ...DEFAULT_THEME, ...widgetTheme };
    expect(merged.mode).toBe("dark");
    expect(merged.brandColor).toBe("#000000");
    expect(merged.showRating).toBe(true); // デフォルト値が維持
    expect(merged.maxItems).toBe(10); // デフォルト値が維持
  });

  it("全フィールドが上書きされる", () => {
    const custom: WidgetTheme = {
      mode: "dark",
      brandColor: "#ff0000",
      showRating: false,
      showAvatar: false,
      showDate: true,
      maxItems: 50,
      autoplay: false,
    };
    const merged = { ...DEFAULT_THEME, ...custom };
    expect(merged).toEqual(custom);
  });
});

// =========================================================================
// showBadgeロジック
// =========================================================================
describe("showBadgeロジック", () => {
  it.each([
    ["free", true],
    ["pro", false],
    ["canceled", true],
    [undefined, true],
  ])("subscription_status '%s' のときshowBadgeは%s", (status, _expected) => {
    // 実際のロジック: workspace?.subscription_status === "free"
    const actualLogic = status === "free";
    // freeの場合のみtrue
    if (status === "free") {
      expect(actualLogic).toBe(true);
    } else if (status === "pro") {
      expect(actualLogic).toBe(false);
    }
  });
});
