import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// /dashboard の口コミ（testimonials）CRUD を網羅する authed E2E テスト
//
// ・手動追加モーダル → 詳細ページ → 削除 という UI 経由の一本道で検証
// ・/api/testimonials には POST しかなく、削除は Supabase client 直叩きの
//   `supabase.from("testimonials").delete()` を UI が呼ぶので、
//   フェイルセーフの API 削除は使わず、UI の削除完了を確認する
// ・Playwright 専用アカウント前提（破壊的オペレーション）
// ---------------------------------------------------------------------------

function uniqueName(workerIndex: number) {
  return `E2E CRUD Testimonial ${workerIndex}-${Date.now()}`;
}

test.describe("認証済み：口コミ CRUD", () => {
  test("追加メニューから手動で追加モーダルが開閉する", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "追加", exact: true }).click();
    await page.getByRole("button", { name: "手動で追加" }).click();

    await expect(page.getByRole("heading", { name: "お客様の声を手動で追加" })).toBeVisible();
    await expect(page.getByPlaceholder("山田 太郎")).toBeVisible();
    await expect(page.getByPlaceholder("お客様の声の内容を入力してください")).toBeVisible();

    await page.getByRole("button", { name: "キャンセル" }).click();
    await expect(page.getByRole("heading", { name: "お客様の声を手動で追加" })).toBeHidden();
  });

  test("名前と内容が未入力だとエラーが表示される", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "追加", exact: true }).click();
    await page.getByRole("button", { name: "手動で追加" }).click();
    await expect(page.getByRole("heading", { name: "お客様の声を手動で追加" })).toBeVisible();

    // 名前 / 内容を空のまま「追加する」をクリック
    await page.getByRole("button", { name: "追加する" }).click();
    await expect(page.getByText("名前と内容は必須です")).toBeVisible();

    await page.getByRole("button", { name: "キャンセル" }).click();
  });

  test("手動追加で新しい口コミが一覧に表示され、詳細画面から削除できる", async ({ page }) => {
    const name = uniqueName(test.info().workerIndex);
    const content = `E2E content body for ${name}`;

    // 1. 追加メニュー → 手動で追加
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await page.getByRole("button", { name: "手動で追加" }).click();
    await expect(page.getByRole("heading", { name: "お客様の声を手動で追加" })).toBeVisible();

    // 2. フォーム入力
    await page.getByPlaceholder("山田 太郎").fill(name);
    await page.getByPlaceholder("お客様の声の内容を入力してください").fill(content);

    // 3. 追加する → モーダルが閉じる
    await page.getByRole("button", { name: "追加する" }).click();
    await expect(page.getByRole("heading", { name: "お客様の声を手動で追加" })).toBeHidden({
      timeout: 10_000,
    });

    // 4. 追加された行を検索欄でフィルタして確定（並列実行に強い）
    const searchInput = page.getByPlaceholder("検索...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill(name);
    const row = page.locator(".group.py-5").filter({ hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });

    // 5. 詳細ページに遷移
    await row.locator('a[href^="/dashboard/"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/[0-9a-fA-F-]+$/);

    // 6. 削除 → 確認モーダル → 削除する
    await page.getByTitle("削除").click();
    await expect(page.getByRole("heading", { name: "削除の確認" })).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();

    // 7. /dashboard にリダイレクト、検索しても該当なし
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
    await page.getByPlaceholder("検索...").fill(name);
    await expect(page.getByText("該当する口コミがありません")).toBeVisible({ timeout: 10_000 });
  });
});
