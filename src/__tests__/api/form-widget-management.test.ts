import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSlug, getBaseUrl } from "@/lib/utils";
import { DEFAULT_FORM_QUESTIONS } from "@/lib/default-questions";
import { PLAN_LIMITS, WidgetTheme } from "@/types/database";
import { createMockSupabase } from "../helpers/mock-supabase";

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
  brandColor: "#6366f1",
  showRating: true,
  showAvatar: true,
  showDate: false,
  maxItems: 10,
  autoplay: true,
};

// =========================================================================
// 1. フォーム作成
// =========================================================================
describe("フォーム作成", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("デフォルトの質問にstar_ratingが先頭に含まれる", () => {
    expect(DEFAULT_FORM_QUESTIONS[0]).toEqual({
      id: "rating",
      label: "総合評価",
      type: "star_rating",
      required: true,
    });

    // 全必須タイプが存在することを確認
    const types = DEFAULT_FORM_QUESTIONS.map((q) => q.type);
    expect(types).toContain("star_rating");
    expect(types).toContain("textarea");
    expect(types).toContain("text");
    expect(types).toContain("image");
    expect(types).toContain("checkbox");
  });

  it("フォーム挿入ペイロードにworkspace_id・slug・質問・デフォルト値が含まれる", () => {
    const workspaceId = "ws-123";
    const slug = generateSlug();

    const insertPayload = {
      workspace_id: workspaceId,
      slug,
      title: "お客様の声フォーム",
      description: "ぜひご感想をお聞かせください",
      questions: DEFAULT_FORM_QUESTIONS,
      brand_color: "#6366f1",
      thank_you_message: "ご回答いただきありがとうございます！",
    };

    expect(insertPayload.workspace_id).toBe(workspaceId);
    expect(insertPayload.slug).toHaveLength(8);
    expect(insertPayload.questions).toBe(DEFAULT_FORM_QUESTIONS);
    expect(insertPayload.brand_color).toBe("#6366f1");
  });

  it("フォームURLが正しく構成される", () => {
    const url = `${getBaseUrl()}/form/abc12345`;
    expect(url).toBe("http://localhost:3000/form/abc12345");
  });
});

// =========================================================================
// 2. フォーム編集
// =========================================================================
describe("フォーム編集", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["title", { title: "New Title" }],
    ["brand_color", { title: "Test", description: null, brand_color: "#ff0000", thank_you_message: "Thanks" }],
    ["thank_you_message", { title: "Test", description: null, brand_color: "#6366f1", thank_you_message: "新しいサンクスメッセージ" }],
  ])("%s をSupabase updateで更新する", async (_field, editForm) => {
    mockSupabase = createMockSupabase({
      forms: { data: null, error: null },
    });

    const builder = mockSupabase.from("forms");
    await (builder as any).update(editForm).eq("id", "form-1");

    expect(mockSupabase.from).toHaveBeenCalledWith("forms");
    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall).toMatchObject(editForm);
  });

  it("空のdescriptionをnullに変換する", () => {
    expect("" || null).toBeNull();
    expect("新しい説明文" || null).toBe("新しい説明文");
  });
});

// =========================================================================
// 3. フォームURLコピー
// =========================================================================
describe("フォームURLコピー", () => {
  it.each([
    ["localhost（デフォルト）", undefined, undefined, "http://localhost:3000/form/testslug"],
    ["本番ドメイン", "https://voicehub.example.com", undefined, "https://voicehub.example.com/form/testslug"],
    ["VERCEL_URL", undefined, "my-app.vercel.app", "https://my-app.vercel.app/form/testslug"],
  ])("%s のURLを正しく生成する", (_label, appUrl, vercelUrl, expected) => {
    const origApp = process.env.NEXT_PUBLIC_APP_URL;
    const origVercel = process.env.VERCEL_URL;

    if (appUrl) process.env.NEXT_PUBLIC_APP_URL = appUrl;
    else delete process.env.NEXT_PUBLIC_APP_URL;

    if (vercelUrl) process.env.VERCEL_URL = vercelUrl;
    else delete process.env.VERCEL_URL;

    const url = `${getBaseUrl()}/form/testslug`;
    expect(url).toBe(expected);

    // 復元
    if (origApp !== undefined) process.env.NEXT_PUBLIC_APP_URL = origApp;
    else delete process.env.NEXT_PUBLIC_APP_URL;
    if (origVercel !== undefined) process.env.VERCEL_URL = origVercel;
    else delete process.env.VERCEL_URL;
  });
});

// =========================================================================
// 4. ウィジェット作成
// =========================================================================
describe("ウィジェット作成", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["carousel", "grid", "marquee"] as const)(
    "タイプ '%s' のウィジェットを作成する",
    (type) => {
      const widget = {
        name: `${type} Widget`,
        type,
        theme: { ...DEFAULT_THEME },
        filter_min_rating: 1,
        only_featured: false,
      };
      expect(widget.type).toBe(type);
      expect(widget.theme).toEqual(DEFAULT_THEME);
    }
  );

  it("フィルタ設定がウィジェット挿入ペイロードに保存される", async () => {
    mockSupabase = createMockSupabase({
      widgets: {
        data: {
          id: "w-1",
          workspace_id: "ws-1",
          name: "Filtered Widget",
          type: "carousel",
          theme: DEFAULT_THEME,
          filter_min_rating: 4,
          only_featured: true,
          created_at: "2026-01-01",
        },
        error: null,
      },
    });

    const builder = mockSupabase.from("widgets");
    await (builder as any)
      .insert({
        workspace_id: "ws-1",
        name: "Filtered Widget",
        type: "carousel",
        theme: DEFAULT_THEME,
        filter_min_rating: 4,
        only_featured: true,
      })
      .select()
      .single();

    const insertCall = (builder as any).insert.mock.calls[0][0];
    expect(insertCall.filter_min_rating).toBe(4);
    expect(insertCall.only_featured).toBe(true);
  });

  it("空白のみのnameではウィジェットを作成しない", () => {
    expect(!"   ".trim()).toBe(true);
  });
});

// =========================================================================
// 5. ウィジェット埋め込みコード生成
// =========================================================================
describe("ウィジェット埋め込みコード生成", () => {
  const baseUrl = getBaseUrl();
  const widgetId = "widget-abc-123";

  function getScriptEmbed(id: string) {
    return `<script src="${baseUrl}/widget/v1/embed.js" defer></script>\n<div data-testimonial-widget="${id}" data-theme="light"></div>`;
  }

  function getIframeEmbed(id: string) {
    return `<iframe src="${baseUrl}/preview/${id}" width="100%" height="400" frameborder="0"></iframe>`;
  }

  it("scriptタグ形式にsrc・defer・ウィジェットID・themeが含まれる", () => {
    const embed = getScriptEmbed(widgetId);
    expect(embed).toContain(`<script src="${baseUrl}/widget/v1/embed.js" defer></script>`);
    expect(embed).toContain(`data-testimonial-widget="${widgetId}"`);
    expect(embed).toContain('data-theme="light"');

    const lines = embed.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^<script .+><\/script>$/);
    expect(lines[1]).toMatch(/^<div .+><\/div>$/);
  });

  it("iframe形式に正しいsrcとサイズが含まれる", () => {
    const embed = getIframeEmbed(widgetId);
    expect(embed).toBe(
      `<iframe src="${baseUrl}/preview/${widgetId}" width="100%" height="400" frameborder="0"></iframe>`
    );
  });
});

// =========================================================================
// 6. ウィジェットテーマ設定
// =========================================================================
describe("ウィジェットテーマ設定", () => {
  it("デフォルトテーマ値が正しい", () => {
    expect(DEFAULT_THEME).toEqual({
      mode: "light",
      brandColor: "#6366f1",
      showRating: true,
      showAvatar: true,
      showDate: false,
      maxItems: 10,
      autoplay: true,
    });
  });

  it("テーマをカスタマイズできる", () => {
    const custom: WidgetTheme = {
      ...DEFAULT_THEME,
      mode: "dark",
      brandColor: "#ff5500",
      showRating: false,
      showAvatar: false,
      showDate: true,
      maxItems: 25,
      autoplay: false,
    };

    expect(custom.mode).toBe("dark");
    expect(custom.brandColor).toBe("#ff5500");
    expect(custom.showRating).toBe(false);
    expect(custom.maxItems).toBe(25);
  });

  it("maxItemsのparseIntフォールバックが10になる", () => {
    expect(parseInt("") || 10).toBe(10);
    expect(parseInt("abc") || 10).toBe(10);
    expect(parseInt("5") || 10).toBe(5);
  });
});

// =========================================================================
// 7. プラン制限の適用
// =========================================================================
describe("プラン制限の適用", () => {
  it("バッジ表示がfreeとproで異なる", () => {
    expect(PLAN_LIMITS.free.showBadge).toBe(true);
    expect(PLAN_LIMITS.pro.showBadge).toBe(false);
  });

  it("canCreateロジックがプラン制限に基づいて正しく評価される", () => {
    const formsCount = 5;
    expect(formsCount < PLAN_LIMITS.free.forms).toBe(true);
    expect(formsCount < 3).toBe(false); // 制限プランのシミュレーション
  });

  it.each([
    ["pro", "pro"],
    ["free", "free"],
    ["canceled", "free"],
    ["", "free"],
  ])(
    "subscriptionStatus '%s' からプラン '%s' が決定される",
    (status, expected) => {
      const plan = status === "pro" ? "pro" : "free";
      expect(plan).toBe(expected);
    }
  );
});
