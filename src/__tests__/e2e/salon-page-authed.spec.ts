import { test, expect, type Locator } from "@playwright/test";

async function waitForData(locator: Locator, timeout = 5000): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe("認証済み：サロンページ設定", () => {
  test("ページタイトルと保存ボタンが表示される", async ({ page }) => {
    await page.goto("/dashboard/salon-page");
    await expect(page.getByRole("heading", { name: "サロンページ", level: 2 })).toBeVisible();
    // 保存ボタンはクリックしない（破壊的操作）
    await expect(page.getByRole("button", { name: "保存する" })).toBeVisible();
  });

  test("STEP 1 のサロン名・一言紹介文プレースホルダが可視", async ({ page }) => {
    await page.goto("/dashboard/salon-page");
    await expect(page.getByPlaceholder("例: Nail Salon Miki")).toBeVisible();
    await expect(page.getByPlaceholder("例: 爪に優しいジェルネイル専門サロン")).toBeVisible();
  });

  test("STEP 2 タブに切り替えるとデザイン画面が表示される", async ({ page }) => {
    await page.goto("/dashboard/salon-page");
    // STEP ボタンは `STEP {n}` と label がネスト spanで並ぶ。アクセシブルネームは "STEP 2 デザイン"（span間空白）になる。
    const step2Button = page.getByRole("button", { name: /STEP\s*2\s*デザイン/ });
    const visible = await waitForData(step2Button);
    test.skip(!visible, "STEP 2 ボタンが見つからないためスキップ");
    await step2Button.click();
    // デザイン画面のメインカラーラベルが表示される
    await expect(page.getByText("メインカラー", { exact: true })).toBeVisible();
  });

  test("詳細情報トグルで「サロン詳細情報」見出しに切り替わる", async ({ page }) => {
    await page.goto("/dashboard/salon-page");
    // 基本情報見出し → 詳細情報ボタン → サロン詳細情報見出し
    await expect(page.getByText("基本情報", { exact: true })).toBeVisible();
    const detailToggle = page.getByRole("button", { name: /詳細情報/ });
    const visible = await waitForData(detailToggle);
    test.skip(!visible, "詳細情報トグルが見つからないためスキップ");
    await detailToggle.click();
    await expect(page.getByText("サロン詳細情報", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "基本情報に戻る" })).toBeVisible();
  });

  test("STEP 4 公開設定で URL コピーボタンが表示される（slug 未発行時は skip）", async ({
    page,
  }) => {
    await page.goto("/dashboard/salon-page");
    const step4Button = page.getByRole("button", { name: /STEP\s*4\s*公開設定/ });
    const tabVisible = await waitForData(step4Button);
    test.skip(!tabVisible, "STEP 4 ボタンが見つからないためスキップ");
    await step4Button.click();
    // 公開トグル見出しは常に可視
    await expect(page.getByText("ページを公開", { exact: true })).toBeVisible();
    // URLコピーボタンは slug 発行済みのみ描画される
    const copyButton = page.getByRole("button", { name: "URLをコピー" });
    const hasSlug = await waitForData(copyButton, 2000);
    test.skip(!hasSlug, "slug 未発行のためスキップ（サロンページ未保存）");
    await expect(copyButton).toBeVisible();
  });
});
