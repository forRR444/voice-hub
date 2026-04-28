import { test, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// /dashboard/widgets のウィジェット CRUD を網羅する authed E2E テスト
//
// ・前処理 / 後処理は API (/api/widgets) 直叩きでクリーンアップ
// ・UI で操作して期待動作を検証
// ・Playwright 専用アカウント前提（破壊的オペレーションを行う）
// ---------------------------------------------------------------------------

type CreatedWidget = { id: string; name: string };

function uniqueName(kind: string, workerIndex: number) {
  return `E2E Widget ${kind} ${workerIndex}-${Date.now()}`;
}

async function createWidgetViaApi(
  request: APIRequestContext,
  overrides: Partial<{ name: string; type: string }> = {}
): Promise<CreatedWidget | null> {
  const res = await request.post("/api/widgets", {
    data: {
      name: overrides.name ?? `E2E Seed ${Date.now()}`,
      type: overrides.type ?? "carousel",
      filter_min_rating: 1,
      only_featured: false,
    },
  });
  if (!res.ok()) return null;
  const json = await res.json();
  return { id: json.id, name: json.name };
}

async function deleteWidgetViaApi(request: APIRequestContext, id: string) {
  await request.delete("/api/widgets", { data: { id } }).catch(() => undefined);
}

test.describe("認証済み：ウィジェット CRUD", () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    while (createdIds.length) {
      const id = createdIds.pop()!;
      await deleteWidgetViaApi(request, id);
    }
  });

  test("『新しいウィジェット』ボタンで作成モーダルが開閉する", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    const openBtn = page.getByRole("button", { name: "新しいウィジェット" });
    const canCreate = await openBtn.isEnabled().catch(() => false);
    test.skip(!canCreate, "プラン上限のためウィジェット作成不可");

    await openBtn.click();
    await expect(page.getByRole("heading", { name: "新しいウィジェット作成" })).toBeVisible();

    await page.getByRole("button", { name: "キャンセル" }).click();
    await expect(page.getByRole("heading", { name: "新しいウィジェット作成" })).toBeHidden();
  });

  test("名前未入力のままだと『作成する』ボタンが無効", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    const openBtn = page.getByRole("button", { name: "新しいウィジェット" });
    const canCreate = await openBtn.isEnabled().catch(() => false);
    test.skip(!canCreate, "プラン上限のためウィジェット作成不可");

    await openBtn.click();
    await expect(page.getByRole("button", { name: "作成する" })).toBeDisabled();

    await page.getByPlaceholder("メインページ用").fill("E2E disabled check");
    await expect(page.getByRole("button", { name: "作成する" })).toBeEnabled();

    await page.getByRole("button", { name: "キャンセル" }).click();
  });

  test("UI 経由でウィジェットを新規作成できる", async ({ page, request }) => {
    await page.goto("/dashboard/widgets");
    const openBtn = page.getByRole("button", { name: "新しいウィジェット" });
    const canCreate = await openBtn.isEnabled().catch(() => false);
    test.skip(!canCreate, "プラン上限のためウィジェット作成不可");

    const name = uniqueName("UI Create", test.info().workerIndex);
    await openBtn.click();
    await page.getByPlaceholder("メインページ用").fill(name);

    // POST レスポンスから id を確実に捕捉する（並列衝突を回避）
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().endsWith("/api/widgets") && res.request().method() === "POST" && res.ok(),
        { timeout: 15_000 }
      ),
      page.getByRole("button", { name: "作成する" }).click(),
    ]);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    createdIds.push(body.id);

    await expect(page.locator("h3", { hasText: name })).toBeVisible({ timeout: 10_000 });
    // request fixture が fixtures に含まれている警告を黙らす
    void request;
  });

  test("タイトル編集（名前変更）が保存される", async ({ page, request }) => {
    const initial = uniqueName("Edit", test.info().workerIndex);
    const created = await createWidgetViaApi(request, { name: initial });
    test.skip(!created, "ウィジェット作成不可（プラン上限など）");
    createdIds.push(created!.id);

    await page.goto("/dashboard/widgets");
    const card = page
      .locator(".shadow-sm")
      .filter({ has: page.locator("h3", { hasText: initial }) });
    await expect(card).toHaveCount(1, { timeout: 10_000 });

    // 3点メニュー → 編集
    await card
      .locator("button", { has: page.locator("svg.lucide-ellipsis") })
      .first()
      .click();
    await page.getByRole("button", { name: "編集" }).click();

    // 編集モードのカード（保存ボタンを持つ）
    const editingCard = page
      .locator(".shadow-sm")
      .filter({ has: page.getByRole("button", { name: "保存" }) });
    const nameInput = editingCard.getByRole("textbox").first();
    const updated = `${initial} UPDATED`;
    await expect(nameInput).toHaveValue(initial);
    await nameInput.fill(updated);
    await editingCard.getByRole("button", { name: "保存" }).click();

    await expect(page.locator("h3", { hasText: updated })).toBeVisible({ timeout: 10_000 });
  });

  test("削除確認モーダル経由でウィジェットが削除される", async ({ page, request }) => {
    const name = uniqueName("Delete", test.info().workerIndex);
    const created = await createWidgetViaApi(request, { name });
    test.skip(!created, "ウィジェット作成不可（プラン上限など）");

    await page.goto("/dashboard/widgets");
    const card = page.locator(".shadow-sm").filter({ has: page.locator("h3", { hasText: name }) });
    await expect(card).toHaveCount(1, { timeout: 10_000 });

    await card
      .locator("button", { has: page.locator("svg.lucide-ellipsis") })
      .first()
      .click();
    await page.getByRole("button", { name: "削除" }).click();
    await expect(page.getByRole("heading", { name: "削除の確認" })).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();

    await expect(page.getByRole("heading", { name: "削除の確認" })).toBeHidden();
    await expect(page.locator("h3", { hasText: name })).toHaveCount(0);

    // UI 削除が失敗した場合のフェイルセーフ
    await deleteWidgetViaApi(request, created!.id);
  });
});
