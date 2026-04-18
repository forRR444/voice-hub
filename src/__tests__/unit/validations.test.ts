import {
  testimonialSubmitSchema,
  testimonialUpdateSchema,
  testimonialManualCreateSchema,
  widgetCreateSchema,
  widgetUpdateSchema,
  formUpdateSchema,
} from "@/lib/validations";
import { generateSlug, formatDate, getBaseUrl } from "@/lib/utils";
import { DEFAULT_FORM_QUESTIONS } from "@/lib/default-questions";
import { PLAN_LIMITS } from "@/types/database";

// ─── testimonialSubmitSchema ────────────────────────────────────────────────

describe("testimonialSubmitSchema", () => {
  const validInput = {
    form_id: "abc123",
    rating: 5,
    content: "Great product!",
    name: "John Doe",
    permission_granted: true,
  };

  it("必須フィールドのみで受理される", () => {
    const result = testimonialSubmitSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("オプションフィールドをすべて含めて受理される", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validInput,
      before_story: "I had issues before",
      title: "CEO",
      avatar_url: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(true);
  });

  it("avatar_urlがnullまたは未指定でも受理される", () => {
    expect(
      testimonialSubmitSchema.safeParse({ ...validInput, avatar_url: null })
        .success
    ).toBe(true);

    const result = testimonialSubmitSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar_url).toBeUndefined();
    }
  });

  it.each([
    ["空のform_id", { ...validInput, form_id: "" }],
    ["form_id欠落", (() => { const { form_id, ...rest } = validInput; return rest; })()],
    ["文字列のrating", { ...validInput, rating: "5" }],
    ["空のcontent", { ...validInput, content: "" }],
    ["5000文字超のcontent", { ...validInput, content: "a".repeat(5001) }],
    ["5000文字超のbefore_story", { ...validInput, before_story: "a".repeat(5001) }],
    ["100文字超のname", { ...validInput, name: "a".repeat(101) }],
    ["100文字超のtitle", { ...validInput, title: "a".repeat(101) }],
    ["不正なavatar_url", { ...validInput, avatar_url: "not-a-url" }],
    ["文字列のpermission_granted", { ...validInput, permission_granted: "yes" }],
    ["permission_granted欠落", (() => { const { permission_granted, ...rest } = validInput; return rest; })()],
  ])("不正な入力を拒否する: %s", (_label, input) => {
    expect(testimonialSubmitSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    ["ratingの下限値1", { ...validInput, rating: 1 }],
    ["ratingの上限値5", { ...validInput, rating: 5 }],
    ["contentの最大長5000", { ...validInput, content: "a".repeat(5000) }],
  ])("境界値を受理する: %s", (_label, input) => {
    expect(testimonialSubmitSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ["ratingの下限値未満0", { ...validInput, rating: 0 }],
    ["ratingの上限値超6", { ...validInput, rating: 6 }],
  ])("境界値外を拒否する: %s", (_label, input) => {
    expect(testimonialSubmitSchema.safeParse(input).success).toBe(false);
  });
});

// ─── testimonialUpdateSchema ────────────────────────────────────────────────

describe("testimonialUpdateSchema", () => {
  it("空オブジェクトを受理する（全フィールドオプション）", () => {
    expect(testimonialUpdateSchema.safeParse({}).success).toBe(true);
  });

  it.each(["pending", "approved", "rejected"] as const)(
    "有効なstatus '%s' を受理する",
    (status) => {
      expect(testimonialUpdateSchema.safeParse({ status }).success).toBe(true);
    }
  );

  it("不正なstatus値を拒否する", () => {
    expect(
      testimonialUpdateSchema.safeParse({ status: "archived" }).success
    ).toBe(false);
  });

  it.each([true, false])("is_featured=%s を受理する", (val) => {
    expect(
      testimonialUpdateSchema.safeParse({ is_featured: val }).success
    ).toBe(true);
  });

  it("is_featuredの文字列値を拒否する", () => {
    expect(
      testimonialUpdateSchema.safeParse({ is_featured: "true" }).success
    ).toBe(false);
  });

  it("tagsとして文字列配列を受理する", () => {
    expect(
      testimonialUpdateSchema.safeParse({ tags: ["tag1", "tag2"] }).success
    ).toBe(true);
    expect(testimonialUpdateSchema.safeParse({ tags: [] }).success).toBe(true);
  });

  it("tagsに非文字列要素が含まれると拒否する", () => {
    expect(testimonialUpdateSchema.safeParse({ tags: [1, 2] }).success).toBe(
      false
    );
  });
});

// ─── testimonialManualCreateSchema ──────────────────────────────────────────

describe("testimonialManualCreateSchema", () => {
  const validInput = {
    content: "Wonderful service!",
    name: "Jane Doe",
  };

  it("必須フィールドのみでデフォルト値が適用される", () => {
    const result = testimonialManualCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("approved");
      expect(result.data.source).toBe("manual");
      expect(result.data.rating).toBeUndefined();
    }
  });

  it("全オプションフィールドを含めて受理される", () => {
    const result = testimonialManualCreateSchema.safeParse({
      ...validInput,
      rating: 4,
      title: "Designer",
      company: "Acme Inc",
      avatar_url: "https://example.com/photo.jpg",
      status: "pending",
      source: "import",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
      expect(result.data.source).toBe("import");
    }
  });

  it("avatar_urlがnullでも受理される", () => {
    expect(
      testimonialManualCreateSchema.safeParse({ ...validInput, avatar_url: null })
        .success
    ).toBe(true);
  });

  it.each([
    ["rating下限未満0", { ...validInput, rating: 0 }],
    ["rating上限超6", { ...validInput, rating: 6 }],
    ["空のcontent", { ...validInput, content: "" }],
    ["5000文字超のcontent", { ...validInput, content: "x".repeat(5001) }],
    ["空のname", { ...validInput, name: "" }],
    ["100文字超のname", { ...validInput, name: "a".repeat(101) }],
    ["不正なstatus", { ...validInput, status: "unknown" }],
    ["不正なavatar_url", { ...validInput, avatar_url: "bad-url" }],
    ["100文字超のtitle", { ...validInput, title: "t".repeat(101) }],
    ["100文字超のcompany", { ...validInput, company: "c".repeat(101) }],
  ])("不正な入力を拒否する: %s", (_label, input) => {
    expect(testimonialManualCreateSchema.safeParse(input).success).toBe(false);
  });
});

// ─── widgetCreateSchema ─────────────────────────────────────────────────────

describe("widgetCreateSchema", () => {
  const validInput = {
    name: "My Widget",
    type: "carousel" as const,
  };

  it("必須フィールドのみでデフォルト値が適用される", () => {
    const result = widgetCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter_min_rating).toBe(1);
      expect(result.data.only_featured).toBe(false);
      expect(result.data.theme).toBeUndefined();
    }
  });

  it.each(["carousel", "grid", "marquee", "list", "single", "wall", "badge"] as const)(
    "ウィジェットタイプ '%s' を受理する",
    (type) => {
      expect(widgetCreateSchema.safeParse({ ...validInput, type }).success).toBe(
        true
      );
    }
  );

  it("不正なウィジェットタイプを拒否する", () => {
    expect(
      widgetCreateSchema.safeParse({ ...validInput, type: "invalid_type" }).success
    ).toBe(false);
  });

  it.each([
    ["空のname", { ...validInput, name: "" }],
    ["100文字超のname", { ...validInput, name: "n".repeat(101) }],
  ])("不正な入力を拒否する: %s", (_label, input) => {
    expect(widgetCreateSchema.safeParse(input).success).toBe(false);
  });

  it("空のthemeオブジェクトでデフォルト値が適用される", () => {
    const result = widgetCreateSchema.safeParse({ ...validInput, theme: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toEqual({
        mode: "light",
        brandColor: "#635BFF",
        showRating: true,
        showAvatar: false,
        showDate: false,
        maxItems: 10,
        autoplay: true,
      });
    }
  });

  it("カスタムtheme値を受理する", () => {
    const result = widgetCreateSchema.safeParse({
      ...validInput,
      theme: {
        mode: "dark",
        brandColor: "#ff0000",
        showRating: false,
        showAvatar: false,
        showDate: true,
        maxItems: 25,
        autoplay: false,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme!.mode).toBe("dark");
      expect(result.data.theme!.maxItems).toBe(25);
    }
  });

  it.each([
    ["maxItems下限未満0", { maxItems: 0 }],
    ["maxItems上限超51", { maxItems: 51 }],
    ["不正なmode", { mode: "auto" }],
  ])("不正なtheme値を拒否する: %s", (_label, theme) => {
    expect(
      widgetCreateSchema.safeParse({ ...validInput, theme }).success
    ).toBe(false);
  });

  it.each([1, 50])("theme.maxItemsの境界値 %d を受理する", (maxItems) => {
    expect(
      widgetCreateSchema.safeParse({ ...validInput, theme: { maxItems } })
        .success
    ).toBe(true);
  });

  it.each([1, 5])("filter_min_ratingの境界値 %d を受理する", (val) => {
    expect(
      widgetCreateSchema.safeParse({ ...validInput, filter_min_rating: val })
        .success
    ).toBe(true);
  });

  it.each([0, 6])("filter_min_ratingの境界値外 %d を拒否する", (val) => {
    expect(
      widgetCreateSchema.safeParse({ ...validInput, filter_min_rating: val })
        .success
    ).toBe(false);
  });
});

// ─── widgetUpdateSchema ─────────────────────────────────────────────────────

describe("widgetUpdateSchema", () => {
  it("空オブジェクトを受理する（全フィールドpartial）", () => {
    expect(widgetUpdateSchema.safeParse({}).success).toBe(true);
  });

  it.each([
    ["nameのみ", { name: "Updated" }],
    ["typeのみ", { type: "grid" }],
    ["only_featuredのみ", { only_featured: true }],
  ])("部分更新を受理する: %s", (_label, input) => {
    expect(widgetUpdateSchema.safeParse(input).success).toBe(true);
  });

  it("不正なtypeを拒否する", () => {
    expect(widgetUpdateSchema.safeParse({ type: "invalid" }).success).toBe(
      false
    );
  });
});

// ─── formUpdateSchema ───────────────────────────────────────────────────────

describe("formUpdateSchema", () => {
  it("空オブジェクトを受理する（全フィールドオプション）", () => {
    expect(formUpdateSchema.safeParse({}).success).toBe(true);
  });

  it.each([
    ["有効なtitle", { title: "My Form" }],
    ["200文字のtitle", { title: "t".repeat(200) }],
    ["1000文字のdescription", { description: "d".repeat(1000) }],
    ["空のdescription", { description: "" }],
    ["brand_color", { brand_color: "#ff0000" }],
    ["有効なlogo_url", { logo_url: "https://example.com/logo.png" }],
    ["nullのlogo_url", { logo_url: null }],
    ["500文字のthank_you_message", { thank_you_message: "m".repeat(500) }],
  ])("有効な入力を受理する: %s", (_label, input) => {
    expect(formUpdateSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ["空のtitle", { title: "" }],
    ["200文字超のtitle", { title: "t".repeat(201) }],
    ["1000文字超のdescription", { description: "d".repeat(1001) }],
    ["不正なlogo_url", { logo_url: "not-a-url" }],
    ["500文字超のthank_you_message", { thank_you_message: "m".repeat(501) }],
  ])("不正な入力を拒否する: %s", (_label, input) => {
    expect(formUpdateSchema.safeParse(input).success).toBe(false);
  });

  it("selectタイプの質問をoptionsつきで受理する", () => {
    const result = formUpdateSchema.safeParse({
      questions: [
        { id: "select_1", label: "満足度", type: "select", required: false, options: ["とても満足", "満足", "普通"] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("不正な質問タイプを拒否する", () => {
    const result = formUpdateSchema.safeParse({
      questions: [
        { id: "q1", label: "テスト", type: "invalid_type", required: false },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("selectタイプのoptionsが21個以上で拒否する", () => {
    const result = formUpdateSchema.safeParse({
      questions: [
        { id: "s1", label: "選択", type: "select", required: false, options: Array.from({ length: 21 }, (_, i) => `選択肢${i + 1}`) },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("selectタイプのoptionsが20個以内で受理する", () => {
    const result = formUpdateSchema.safeParse({
      questions: [
        { id: "s1", label: "選択", type: "select", required: false, options: Array.from({ length: 20 }, (_, i) => `選択肢${i + 1}`) },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("selectタイプの各optionが100文字超で拒否する", () => {
    const result = formUpdateSchema.safeParse({
      questions: [
        { id: "s1", label: "選択", type: "select", required: false, options: ["a".repeat(101)] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("enabled: falseの質問を受理する", () => {
    const result = formUpdateSchema.safeParse({
      questions: [
        { id: "rating", label: "総合評価", type: "star_rating", required: true, enabled: true },
        { id: "before_story", label: "利用前の悩み", type: "textarea", required: false, enabled: false },
        { id: "permission", label: "掲載許可", type: "checkbox", required: true },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("enabled未指定の質問はフィルタで表示対象になる", () => {
    const questions = [
      { id: "q1", label: "Q1", type: "text" as const, required: false },
      { id: "q2", label: "Q2", type: "text" as const, required: false, enabled: false },
      { id: "q3", label: "Q3", type: "text" as const, required: false, enabled: true },
    ];
    const visible = questions.filter((q) => q.enabled !== false);
    expect(visible.map((q) => q.id)).toEqual(["q1", "q3"]);
  });
});

// ─── ユーティリティ関数 ──────────────────────────────────────────────────────

describe("generateSlug", () => {
  it("デフォルト長8の文字列を返す", () => {
    expect(generateSlug()).toHaveLength(8);
  });

  it.each([1, 12])("指定長 %d の文字列を返す", (len) => {
    expect(generateSlug(len)).toHaveLength(len);
  });

  it("小文字英数字のみで構成される", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateSlug(32)).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("長さ0で空文字列を返す", () => {
    expect(generateSlug(0)).toBe("");
  });

  it("連続呼び出しで異なる値を返す（非決定的）", () => {
    const slugs = new Set(Array.from({ length: 50 }, () => generateSlug(16)));
    expect(slugs.size).toBeGreaterThan(1);
  });
});

describe("formatDate", () => {
  it.each([
    ["ISO日付文字列", "2024-01-15", ["2024", "1", "15"]],
    ["ISOフル日時文字列", "2023-12-25T10:30:00Z", ["2023", "12", "25"]],
  ])("%s を日本語ロケールでフォーマットする", (_label, input, expected) => {
    const result = formatDate(input);
    for (const part of expected) {
      expect(result).toContain(part);
    }
  });
});

describe("getBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    [
      "NEXT_PUBLIC_APP_URLが設定されている場合はそれを返す",
      { NEXT_PUBLIC_APP_URL: "https://myapp.com" },
      "https://myapp.com",
    ],
    [
      "VERCEL_URLのみの場合はhttps://VERCEL_URLを返す",
      { VERCEL_URL: "my-app.vercel.app" },
      "https://my-app.vercel.app",
    ],
    [
      "環境変数未設定の場合はlocalhostを返す",
      {},
      "http://localhost:3001",
    ],
  ])("%s", (_label, envVars, expected) => {
    Object.assign(process.env, envVars);
    expect(getBaseUrl()).toBe(expected);
  });

  it("NEXT_PUBLIC_APP_URLがVERCEL_URLより優先される", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://custom.com";
    process.env.VERCEL_URL = "my-app.vercel.app";
    expect(getBaseUrl()).toBe("https://custom.com");
  });
});

// ─── DEFAULT_FORM_QUESTIONS ─────────────────────────────────────────────────

describe("DEFAULT_FORM_QUESTIONS", () => {
  it("7つの質問を含む", () => {
    expect(DEFAULT_FORM_QUESTIONS).toHaveLength(7);
  });

  it("全質問にユニークなIDがある", () => {
    const ids = DEFAULT_FORM_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("全質問に必須フィールド（id, label, type, required）がある", () => {
    for (const q of DEFAULT_FORM_QUESTIONS) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("label");
      expect(q).toHaveProperty("type");
      expect(typeof q.required).toBe("boolean");
    }
  });

  it.each([
    ["star_rating", "rating", true],
    ["checkbox", "permission", true],
    ["image", "avatar", false],
  ])(
    "タイプ '%s' の質問（id=%s, required=%s）が存在する",
    (type, id, required) => {
      const q = DEFAULT_FORM_QUESTIONS.find((q) => q.id === id);
      expect(q).toBeDefined();
      expect(q!.type).toBe(type);
      expect(q!.required).toBe(required);
    }
  );

  it("有効な質問タイプのみ使用されている", () => {
    const validTypes = ["star_rating", "text", "textarea", "image", "checkbox"];
    for (const q of DEFAULT_FORM_QUESTIONS) {
      expect(validTypes).toContain(q.type);
    }
  });
});

// ─── PLAN_LIMITS ────────────────────────────────────────────────────────────

describe("PLAN_LIMITS", () => {
  it("pro プランのtestimonials/forms/widgetsがInfinityである", () => {
    expect(PLAN_LIMITS.pro.testimonials).toBe(Infinity);
    expect(PLAN_LIMITS.pro.forms).toBe(Infinity);
    expect(PLAN_LIMITS.pro.widgets).toBe(Infinity);
  });

  it("free プランの制限が正しい", () => {
    expect(PLAN_LIMITS.free.testimonials).toBe(Infinity);
    expect(PLAN_LIMITS.free.forms).toBe(Infinity);
    expect(PLAN_LIMITS.free.widgets).toBe(Infinity);
    expect(PLAN_LIMITS.free.dashboardTestimonials).toBe(10);
    expect(PLAN_LIMITS.free.displayTestimonials).toBe(5);
  });

  it("バッジ表示がfreeとproで異なる", () => {
    expect(PLAN_LIMITS.free.showBadge).toBe(true);
    expect(PLAN_LIMITS.pro.showBadge).toBe(false);
  });
});
