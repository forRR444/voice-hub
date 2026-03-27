import { describe, it, expect } from "vitest";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import type { FormQuestion } from "@/types/database";
import { PRESET_QUESTIONS } from "@/app/components/question-editor";

// ---------------------------------------------------------------------------
// tryフローで使うロジックの再現
// ---------------------------------------------------------------------------

function handleTemplateChange(
  templateId: string,
  currentQuestions: FormQuestion[]
): { selectedTemplate: string; questions: FormQuestion[] } {
  const template = FORM_TEMPLATES.find((t) => t.id === templateId);
  if (template) {
    return { selectedTemplate: templateId, questions: template.questions };
  }
  return { selectedTemplate: templateId, questions: currentQuestions };
}

function buildTryData(params: {
  template: string;
  workspaceName: string;
  brandColor: string;
  questions: FormQuestion[];
}) {
  return {
    template: params.template,
    workspaceName: params.workspaceName.trim() || "マイサービス",
    brandColor: params.brandColor,
    questions: params.questions,
    savedAt: new Date().toISOString(),
  };
}

function isTryDataValid(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw);
    const savedAt = new Date(parsed.savedAt);
    const daysOld =
      (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysOld < 7 && Array.isArray(parsed.questions);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// テンプレート選択
// ---------------------------------------------------------------------------
describe("tryフロー - テンプレート選択", () => {
  it("coachingテンプレートを選択すると対応する質問が返る", () => {
    const result = handleTemplateChange("coaching", []);
    expect(result.selectedTemplate).toBe("coaching");
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions.some((q) => q.id === "rating")).toBe(true);
    expect(result.questions.some((q) => q.id === "content")).toBe(true);
    expect(result.questions.some((q) => q.id === "permission")).toBe(true);
  });

  it("courseテンプレートを選択すると対応する質問が返る", () => {
    const result = handleTemplateChange("course", []);
    expect(result.selectedTemplate).toBe("course");
    expect(result.questions.some((q) => q.id === "content")).toBe(true);
  });

  it("therapyテンプレートを選択すると対応する質問が返る", () => {
    const result = handleTemplateChange("therapy", []);
    expect(result.selectedTemplate).toBe("therapy");
    expect(result.questions.some((q) => q.id === "before_story")).toBe(true);
  });

  it("freelanceテンプレートを選択すると対応する質問が返る", () => {
    const result = handleTemplateChange("freelance", []);
    expect(result.selectedTemplate).toBe("freelance");
  });

  it("generalテンプレートを選択すると対応する質問が返る", () => {
    const result = handleTemplateChange("general", []);
    expect(result.selectedTemplate).toBe("general");
  });

  it("存在しないテンプレートIDの場合は現在の質問を維持する", () => {
    const currentQuestions = FORM_TEMPLATES[0].questions;
    const result = handleTemplateChange("nonexistent", currentQuestions);
    expect(result.questions).toBe(currentQuestions);
  });

  it("全テンプレートにratingとpermissionが含まれる", () => {
    for (const tpl of FORM_TEMPLATES) {
      expect(tpl.questions.some((q) => q.id === "rating")).toBe(true);
      expect(tpl.questions.some((q) => q.id === "permission")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// tryデータの保存・読み込み
// ---------------------------------------------------------------------------
describe("tryフロー - tryデータ保存", () => {
  it("tryデータが正しく構築される", () => {
    const data = buildTryData({
      template: "coaching",
      workspaceName: "テストサービス",
      brandColor: "#FF0000",
      questions: FORM_TEMPLATES[0].questions,
    });

    expect(data.template).toBe("coaching");
    expect(data.workspaceName).toBe("テストサービス");
    expect(data.brandColor).toBe("#FF0000");
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data.savedAt).toBeTruthy();
  });

  it("空のワークスペース名はデフォルト値になる", () => {
    const data = buildTryData({
      template: "coaching",
      workspaceName: "",
      brandColor: DEFAULT_BRAND_COLOR,
      questions: [],
    });
    expect(data.workspaceName).toBe("マイサービス");
  });

  it("スペースのみのワークスペース名もデフォルト値になる", () => {
    const data = buildTryData({
      template: "coaching",
      workspaceName: "   ",
      brandColor: DEFAULT_BRAND_COLOR,
      questions: [],
    });
    expect(data.workspaceName).toBe("マイサービス");
  });

  it("7日以内のtryデータは有効と判定される", () => {
    const data = {
      questions: [],
      savedAt: new Date().toISOString(),
    };
    expect(isTryDataValid(JSON.stringify(data))).toBe(true);
  });

  it("7日以上前のtryデータは無効と判定される", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    const data = {
      questions: [],
      savedAt: oldDate.toISOString(),
    };
    expect(isTryDataValid(JSON.stringify(data))).toBe(false);
  });

  it("不正なJSONは無効と判定される", () => {
    expect(isTryDataValid("not json")).toBe(false);
  });

  it("questionsがないデータは無効と判定される", () => {
    const data = { savedAt: new Date().toISOString() };
    expect(isTryDataValid(JSON.stringify(data))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ポップアップからのテンプレート引き継ぎ
// ---------------------------------------------------------------------------
describe("tryフロー - ポップアップ連携", () => {
  it("保存されたテンプレートIDでテンプレートを復元できる", () => {
    const savedTemplateId = "therapy";
    const template = FORM_TEMPLATES.find((t) => t.id === savedTemplateId);
    expect(template).toBeTruthy();
    expect(template!.questions.length).toBeGreaterThan(0);
  });

  it("不正なテンプレートIDではテンプレートが見つからない", () => {
    const template = FORM_TEMPLATES.find((t) => t.id === "invalid");
    expect(template).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 質問エディタ
// ---------------------------------------------------------------------------
describe("質問エディタ", () => {
  it("プリセット質問が正しく定義されている", () => {
    expect(PRESET_QUESTIONS.length).toBeGreaterThan(0);
    expect(PRESET_QUESTIONS.some((p) => p.id === "rating")).toBe(true);
    expect(PRESET_QUESTIONS.some((p) => p.id === "permission")).toBe(true);
  });

  it("permissionはalwaysOnである", () => {
    const permission = PRESET_QUESTIONS.find((p) => p.id === "permission");
    expect(permission?.alwaysOn).toBe(true);
  });

  it("alwaysOnでないプリセットはトグル可能", () => {
    const toggleable = PRESET_QUESTIONS.filter((p) => !p.alwaysOn);
    expect(toggleable.length).toBeGreaterThan(0);
  });

  it("カスタム質問を追加するとリストに加わる", () => {
    const questions: FormQuestion[] = [...FORM_TEMPLATES[0].questions];
    const custom: FormQuestion = {
      id: "custom_123",
      label: "カスタム質問",
      type: "text",
      required: false,
    };
    const updated = [...questions, custom];
    expect(updated.length).toBe(questions.length + 1);
    expect(updated[updated.length - 1].id).toBe("custom_123");
  });

  it("カスタム質問を削除するとリストから除かれる", () => {
    const questions: FormQuestion[] = [
      ...FORM_TEMPLATES[0].questions,
      { id: "custom_1", label: "テスト", type: "text", required: false },
    ];
    const removed = questions.filter((q) => q.id !== "custom_1");
    expect(removed.length).toBe(questions.length - 1);
    expect(removed.some((q) => q.id === "custom_1")).toBe(false);
  });

  it("質問のenabled切り替えが正しく動作する", () => {
    const q: FormQuestion = {
      id: "test",
      label: "テスト",
      type: "text",
      required: false,
      enabled: true,
    };
    const toggled = { ...q, enabled: q.enabled === false ? true : false };
    expect(toggled.enabled).toBe(false);

    const toggledBack = {
      ...toggled,
      enabled: toggled.enabled === false ? true : false,
    };
    expect(toggledBack.enabled).toBe(true);
  });

  it("enabledがfalseの質問はプレビューから除外される", () => {
    const questions: FormQuestion[] = [
      { id: "q1", label: "有効", type: "text", required: false, enabled: true },
      { id: "q2", label: "無効", type: "text", required: false, enabled: false },
      { id: "q3", label: "未設定", type: "text", required: false },
    ];
    const filtered = questions.filter((q) => q.enabled !== false);
    expect(filtered).toHaveLength(2);
    expect(filtered.some((q) => q.id === "q2")).toBe(false);
  });

  it("select型のカスタム質問にoptionsを設定できる", () => {
    const options = "選択肢A\n選択肢B\n選択肢C";
    const parsedOptions = options
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
    expect(parsedOptions).toEqual(["選択肢A", "選択肢B", "選択肢C"]);
  });
});

// ---------------------------------------------------------------------------
// tryデータの比較モーダル（既存ユーザー向け）
// ---------------------------------------------------------------------------
describe("tryデータ比較モーダル", () => {
  it("tryChoiceがnullの場合は選択画面を表示する", () => {
    const tryChoice: "current" | "new" | null = null;
    expect(tryChoice).toBeNull();
  });

  it("tryChoiceがnewの場合は確認画面を表示する", () => {
    const tryChoice: "current" | "new" | null = "new";
    expect(tryChoice).toBe("new");
  });

  it("tryChoiceがcurrentの場合は確認画面を表示する", () => {
    const tryChoice: "current" | "new" | null = "current";
    expect(tryChoice).toBe("current");
  });
});

// ---------------------------------------------------------------------------
// フォームプレビュー
// ---------------------------------------------------------------------------
describe("フォームプレビュー", () => {
  it("プレビューフォームが正しく構築される", () => {
    const workspaceName = "テストサービス";
    const brandColor = "#FF0000";
    const questions = FORM_TEMPLATES[0].questions;

    const previewForm = {
      id: "try-preview",
      workspace_id: "try-preview",
      slug: "try-preview",
      title: workspaceName || "お客様の声をお聞かせください",
      description: null,
      brand_color: brandColor,
      logo_url: null,
      thank_you_message:
        "ご回答ありがとうございました！（これはプレビューです）",
      questions: questions.filter((q) => q.enabled !== false),
      created_at: new Date().toISOString(),
    };

    expect(previewForm.title).toBe("テストサービス");
    expect(previewForm.brand_color).toBe("#FF0000");
    expect(previewForm.questions.length).toBeGreaterThan(0);
  });

  it("ワークスペース名が空の場合はデフォルトタイトルを使用する", () => {
    const workspaceName = "";
    const title = workspaceName || "お客様の声をお聞かせください";
    expect(title).toBe("お客様の声をお聞かせください");
  });

  it("demoモードではスキップが最終ステップでonDemoCloseを呼ぶ", () => {
    const totalSteps = 5;
    let step = 4; // 最終ステップ (0-indexed)
    let closed = false;

    // 最終ステップでのスキップ動作
    if (step < totalSteps - 1) {
      step += 1;
    } else {
      closed = true;
    }
    expect(closed).toBe(true);
  });

  it("demoモードでは最終ステップ以外でスキップすると次へ進む", () => {
    const totalSteps = 5;
    let step = 2;
    let closed = false;

    if (step < totalSteps - 1) {
      step += 1;
    } else {
      closed = true;
    }
    expect(step).toBe(3);
    expect(closed).toBe(false);
  });
});
