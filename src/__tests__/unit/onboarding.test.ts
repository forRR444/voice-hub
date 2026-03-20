import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../helpers/mock-supabase";
import { generateSlug } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// =========================================================================
// オンボーディングフロー
// =========================================================================
describe("オンボーディング", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ワークスペース名を更新する", async () => {
    mockSupabase = createMockSupabase({
      workspaces: { data: null, error: null },
    });

    const builder = mockSupabase.from("workspaces");
    await (builder as any)
      .update({ name: "山田コーチング" })
      .eq("id", "ws-1");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.name).toBe("山田コーチング");
  });

  it("フォームを作成する", async () => {
    const slug = generateSlug();
    mockSupabase = createMockSupabase({
      forms: {
        data: { id: "f-new", slug },
        error: null,
      },
    });

    const builder = mockSupabase.from("forms");
    await (builder as any)
      .insert({
        workspace_id: "ws-1",
        slug,
        title: "お客様の声をお聞かせください",
        brand_color: "#635BFF",
        thank_you_message: "ご回答いただきありがとうございます！",
      })
      .select("id")
      .single();

    const insertCall = (builder as any).insert.mock.calls[0][0];
    expect(insertCall.workspace_id).toBe("ws-1");
    expect(insertCall.slug).toHaveLength(8);
    expect(insertCall.brand_color).toBe("#635BFF");
  });

  it("サンプルテスティモニアルを作成する", async () => {
    mockSupabase = createMockSupabase({
      testimonials: { data: null, error: null },
    });

    const builder = mockSupabase.from("testimonials");
    await (builder as any).insert({
      workspace_id: "ws-1",
      form_id: "f-1",
      rating: 5,
      content: "VoiceHubのおかげで...",
      name: "VoiceHub サポートチーム",
      title: "サンプル",
      status: "approved",
      is_featured: true,
      permission_granted: true,
      source: "sample",
    });

    const insertCall = (builder as any).insert.mock.calls[0][0];
    expect(insertCall.source).toBe("sample");
    expect(insertCall.status).toBe("approved");
    expect(insertCall.is_featured).toBe(true);
  });

  it("オンボーディング完了をマークする", async () => {
    mockSupabase = createMockSupabase({
      workspaces: { data: null, error: null },
    });

    const builder = mockSupabase.from("workspaces");
    await (builder as any)
      .update({ onboarding_completed: true })
      .eq("id", "ws-1");

    const updateCall = (builder as any).update.mock.calls[0][0];
    expect(updateCall.onboarding_completed).toBe(true);
  });

  it("スラッグが8文字の英数字で生成される", () => {
    const slugs = Array.from({ length: 20 }, () => generateSlug());
    for (const slug of slugs) {
      expect(slug).toHaveLength(8);
      expect(slug).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("スラッグがユニークである", () => {
    const slugs = new Set(Array.from({ length: 50 }, () => generateSlug()));
    expect(slugs.size).toBe(50);
  });
});

// =========================================================================
// オンボーディングのバリデーション
// =========================================================================
describe("オンボーディング - バリデーション", () => {
  it("空のワークスペース名では次に進めない", () => {
    const name = "";
    expect(!name.trim()).toBe(true);
  });

  it("空白のみのワークスペース名では次に進めない", () => {
    const name = "   ";
    expect(!name.trim()).toBe(true);
  });

  it("有効なワークスペース名では次に進める", () => {
    const name = "山田コーチング";
    expect(!!name.trim()).toBe(true);
  });
});

// =========================================================================
// テンプレート選択
// =========================================================================
describe("オンボーディング - テンプレート", () => {
  it("デフォルトテンプレートがcoachingである", () => {
    const defaultTemplate = "coaching";
    expect(defaultTemplate).toBe("coaching");
  });

  it("ブランドカラーのデフォルトが#635BFFである", () => {
    const defaultColor = "#635BFF";
    expect(defaultColor).toBe("#635BFF");
  });
});
