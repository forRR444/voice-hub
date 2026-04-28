import { test, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// /dashboard/forms のフォーム CRUD を網羅する authed E2E テスト
//
// ・前処理 / 後処理は API (/api/forms) 直叩きで確実にクリーンアップする
// ・UI 側では「操作すると期待通り動く」を検証する
// ・storageState は chromium-auth プロジェクト経由で playwright.config.ts から注入
//
// このテストは破壊的操作（作成 / 編集 / 削除）を実行する前提。
// Playwright 専用アカウントに対してのみ動かすこと。
// ---------------------------------------------------------------------------

type CreatedForm = { id: string; slug: string; title: string };

const BASE_QUESTIONS = [
  {
    id: "rating",
    label: "満足度",
    type: "star_rating" as const,
    required: true,
  },
  {
    id: "comment",
    label: "感想",
    type: "textarea" as const,
    required: false,
    placeholder: "自由にお書きください",
  },
];

function uniqueSlug(prefix: string) {
  // 英小文字・数字・ハイフンのみ（validations.ts の regex 要件）
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toLowerCase();
}

function uniqueTitle(kind: string, workerIndex: number) {
  return `E2E CRUD ${kind} ${workerIndex}-${Date.now()}`;
}

async function createFormViaApi(
  request: APIRequestContext,
  overrides: Partial<{ title: string; slug: string }> = {}
): Promise<CreatedForm | null> {
  const slug = overrides.slug ?? uniqueSlug("e2e-crud");
  const title = overrides.title ?? `E2E Setup ${slug}`;
  const res = await request.post("/api/forms", {
    data: {
      slug,
      title,
      description: "E2E seed",
      brand_color: "#6366F1",
      thank_you_message: "ありがとうございました",
      questions: BASE_QUESTIONS,
    },
  });
  if (!res.ok()) return null;
  const json = await res.json();
  return { id: json.id, slug: json.slug, title: json.title };
}

async function deleteFormViaApi(request: APIRequestContext, id: string) {
  await request.delete("/api/forms", { data: { id } }).catch(() => undefined);
}

test.describe("認証済み：フォーム CRUD", () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    while (createdIds.length) {
      const id = createdIds.pop()!;
      await deleteFormViaApi(request, id);
    }
  });

  test("『新しいフォーム』ボタンでテンプレートモーダルが開閉する", async ({ page }) => {
    await page.goto("/dashboard/forms");
    const openBtn = page.getByRole("button", { name: "新しいフォーム" });
    const canCreate = await openBtn.isEnabled().catch(() => false);
    test.skip(!canCreate, "プラン上限のためフォーム作成不可");

    await openBtn.click();
    await expect(page.getByRole("heading", { name: "テンプレートを選択" })).toBeVisible();

    await page.getByRole("button", { name: "キャンセル" }).click();
    await expect(page.getByRole("heading", { name: "テンプレートを選択" })).toBeHidden();
  });

  test("テンプレートからフォームを新規作成できる（UI経由）", async ({ page, request }) => {
    await page.goto("/dashboard/forms");
    const openBtn = page.getByRole("button", { name: "新しいフォーム" });
    const canCreate = await openBtn.isEnabled().catch(() => false);
    test.skip(!canCreate, "プラン上限のためフォーム作成不可");

    await openBtn.click();
    await expect(page.getByRole("heading", { name: "テンプレートを選択" })).toBeVisible();

    // POST /api/forms のレスポンスを捕捉して、作成された id を確実に掌握する
    // （並列実行時に別テストが作ったカードを .first() で誤って消さないため）
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().endsWith("/api/forms") && res.request().method() === "POST" && res.ok(),
        { timeout: 15_000 }
      ),
      page.getByRole("button", { name: "作成", exact: true }).click(),
    ]);
    const body = await response.json();
    const createdId: string = body.id;
    expect(createdId).toBeTruthy();
    createdIds.push(createdId);

    await expect(
      page
        .locator(".shadow-sm")
        .filter({ has: page.locator("h3", { hasText: "お客様の声フォーム" }) })
    ).not.toHaveCount(0);

    // afterEach で API DELETE される。UI 確認用に明示的な request 引数は使わない
    void request;
  });

  test("タイトル編集が保存される", async ({ page, request }) => {
    const initial = `E2E Edit ${test.info().workerIndex}-${Date.now()}`;
    const created = await createFormViaApi(request, { title: initial });
    test.skip(!created, "フォーム作成不可（プラン上限など）");
    createdIds.push(created!.id);

    await page.goto("/dashboard/forms");
    const card = page
      .locator(".shadow-sm")
      .filter({ has: page.locator("h3", { hasText: initial }) });
    await expect(card).toHaveCount(1, { timeout: 10_000 });

    await card.getByTitle("編集").click();
    // 編集モードに入ると h3 がフォームに置き換わるため、
    // 「保存」ボタンを含む Card を新たに特定する
    const editingCard = page
      .locator(".shadow-sm")
      .filter({ has: page.getByRole("button", { name: "保存" }) });
    const updated = `${initial} UPDATED`;
    const titleInput = editingCard.getByRole("textbox").first();
    await expect(titleInput).toHaveValue(initial);
    await titleInput.fill(updated);
    await editingCard.getByRole("button", { name: "保存" }).click();

    await expect(page.locator("h3", { hasText: updated })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("h3", { hasText: initial, hasNotText: "UPDATED" })).toHaveCount(0);
  });

  test("説明欄を空にしても保存できる（PATCH null 許容の回帰テスト）", async ({ request }) => {
    const initial = uniqueTitle("EmptyDesc", test.info().workerIndex);
    const created = await createFormViaApi(request, { title: initial });
    test.skip(!created, "フォーム作成不可（プラン上限など）");
    createdIds.push(created!.id);

    // UI の saveEdit と同じく `description: "" || null` → null が送られる状況を再現
    const res = await request.patch("/api/forms", {
      data: {
        id: created!.id,
        title: created!.title,
        description: null,
        brand_color: "#6366F1",
        thank_you_message: "ありがとうございました",
        questions: BASE_QUESTIONS,
      },
    });
    expect(res.ok(), `PATCH response ${res.status()}: ${await res.text()}`).toBe(true);
  });

  test("『URLをコピー』クリック後にボタン文言が変化する", async ({ page, request, context }) => {
    const title = uniqueTitle("URL", test.info().workerIndex);
    const created = await createFormViaApi(request, { title });
    test.skip(!created, "フォーム作成不可（プラン上限など）");
    createdIds.push(created!.id);

    // クリップボード権限を付与（コピー処理で失敗しないように）
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/dashboard/forms");
    const card = page.locator(".shadow-sm").filter({ has: page.locator("h3", { hasText: title }) });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.getByRole("button", { name: "URLをコピー" }).click();
    await expect(card.getByRole("button", { name: "コピーしました" })).toBeVisible();
  });

  test("QRコードモーダルが開閉する", async ({ page, request }) => {
    const title = uniqueTitle("QR", test.info().workerIndex);
    const created = await createFormViaApi(request, { title });
    test.skip(!created, "フォーム作成不可（プラン上限など）");
    createdIds.push(created!.id);

    await page.goto("/dashboard/forms");
    const card = page.locator(".shadow-sm").filter({ has: page.locator("h3", { hasText: title }) });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.getByRole("button", { name: "QRコード" }).click();
    await expect(page.getByRole("heading", { name: "QRコード" })).toBeVisible();

    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page.getByRole("heading", { name: "QRコード" })).toBeHidden();
  });

  test("削除確認モーダル経由でフォームが削除される", async ({ page, request }) => {
    const title = uniqueTitle("Delete", test.info().workerIndex);
    const created = await createFormViaApi(request, { title });
    test.skip(!created, "フォーム作成不可（プラン上限など）");
    // UI で削除するのでクリーンアップ対象には含めない

    await page.goto("/dashboard/forms");
    const card = page.locator(".shadow-sm").filter({ has: page.locator("h3", { hasText: title }) });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.getByTitle("削除").click();
    await expect(page.getByRole("heading", { name: "フォームの削除" })).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();

    await expect(page.getByRole("heading", { name: "フォームの削除" })).toBeHidden();
    await expect(page.locator("h3", { hasText: title })).toHaveCount(0);

    // 万一 UI 削除に失敗した場合の保険として API 削除
    await deleteFormViaApi(request, created!.id);
  });
});
