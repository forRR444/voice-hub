import { test, expect } from "@playwright/test";

test.describe("公開フォームの送信フロー", () => {
  const formUrl = "/form/tanaka-coaching";

  test("フォームページにタイトルが表示される", async ({ page }) => {
    await page.goto(formUrl, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
  });

  test("全ステップを完了してフォームを送信できる", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(formUrl, { waitUntil: "networkidle" });

    // ステップ1: 星評価 - 5つ星をクリック
    const star5 = page.locator('[aria-label="5つ星"]');
    await expect(star5).toBeVisible({ timeout: 10000 });
    await star5.click();
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ2: before_story テキストエリア
    await expect(page.locator("textarea")).toBeVisible();
    await page.locator("textarea").fill("以前は集客に苦労していました。");
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ3: content テキストエリア
    await expect(page.locator("textarea")).toBeVisible();
    await page
      .locator("textarea")
      .fill("コーチングを受けてから売上が大幅に伸びました。本当に感謝しています。");
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ4: 名前入力
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await page.locator('input[type="text"]').fill("テスト太郎");
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ5: 肩書き（オプション） - スキップ
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ6: アバター（オプション） - スキップ
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ7: 許可チェックボックス -> 送信
    await expect(page.getByText("はい、掲載を許可します")).toBeVisible();
    await page.getByText("はい、掲載を許可します").click();
    await page.getByRole("button", { name: "送信する" }).click();

    // サンクスメッセージの確認
    await expect(page.getByText("ありがとうございます")).toBeVisible({
      timeout: 15000,
    });
  });

  test("ステップインジケーターが表示される", async ({ page }) => {
    await page.goto(formUrl, { waitUntil: "networkidle" });
    await expect(page.getByText("1 / 7")).toBeVisible();
  });

  test("戻るボタンで前のステップに戻れる", async ({ page }) => {
    await page.goto(formUrl, { waitUntil: "networkidle" });

    // ステップ1を完了
    const star5 = page.locator('[aria-label="5つ星"]');
    await expect(star5).toBeVisible({ timeout: 10000 });
    await star5.click();
    await page.getByRole("button", { name: "次へ" }).click();

    // ステップ2で戻る
    await expect(page.getByText("2 / 7")).toBeVisible();
    await page.getByRole("button", { name: "戻る" }).click();
    await expect(page.getByText("1 / 7")).toBeVisible();
  });
});
