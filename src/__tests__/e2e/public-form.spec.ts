import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// 公開フォーム E2Eテスト
// ---------------------------------------------------------------------------

test.describe("公開フォーム", () => {
  // ============================
  // フォーム表示
  // ============================
  test.describe("フォーム表示", () => {
    test("有効なスラッグでフォームが表示される", async ({ page }) => {
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toBeVisible();
    });

    test("存在しないスラッグで404が表示される", async ({ page }) => {
      const response = await page.goto("/form/nonexistent-slug-12345");
      expect(response?.status()).toBe(404);
    });

    test("ステップインジケーターが表示される", async ({ page }) => {
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });
      // "1 / X" の形式
      await expect(page.getByText(/1 \/ \d+/)).toBeVisible({ timeout: 10000 });
    });

    test("Powered by VoiceHubリンクが表示される", async ({ page }) => {
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });
      await expect(page.getByText("Powered by VoiceHub")).toBeVisible();
    });
  });

  // ============================
  // フォーム入力
  // ============================
  test.describe("フォーム入力", () => {
    test("星評価をクリックできる", async ({ page }) => {
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });
      const star = page.locator('[aria-label="5つ星"]');
      await expect(star).toBeVisible({ timeout: 10000 });
      await star.click();

      // 次へボタンが有効になる
      const nextBtn = page.getByRole("button", { name: "次へ" });
      await expect(nextBtn).toBeEnabled();
    });

    test("必須項目が未入力だと次へ進めない", async ({ page }) => {
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });
      // 星評価を選択せずに次へ
      const nextBtn = page.getByRole("button", { name: "次へ" });
      await expect(nextBtn).toBeDisabled();
    });

    test("戻るボタンで前のステップに戻れる", async ({ page }) => {
      test.setTimeout(30000);
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });

      // ステップ1完了
      await page.locator('[aria-label="5つ星"]').click();
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ2で戻る
      await page.getByRole("button", { name: "戻る" }).click();

      // ステップ1に戻っている
      await expect(page.getByText(/1 \/ \d+/)).toBeVisible();
    });

    test("全ステップを完了して送信できる", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });

      // ステップ1: 星評価
      const star5 = page.locator('[aria-label="5つ星"]');
      await expect(star5).toBeVisible({ timeout: 10000 });
      await star5.click();
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ2: before_story
      await expect(page.locator("textarea")).toBeVisible();
      await page.locator("textarea").fill("以前は集客に苦労していました。");
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ3: content
      await expect(page.locator("textarea")).toBeVisible();
      await page.locator("textarea").fill("コーチングを受けてから売上が大幅に伸びました。");
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ4: 名前
      await expect(page.locator('input[type="text"]')).toBeVisible();
      await page.locator('input[type="text"]').fill("E2Eテスト");
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ5: 肩書き（スキップ）
      await expect(page.locator('input[type="text"]')).toBeVisible();
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ6: アバター（スキップ）
      await page.getByRole("button", { name: "次へ" }).click();

      // ステップ7: 許可
      await page.getByText("はい、掲載を許可します").click();
      await page.getByRole("button", { name: "送信する" }).click();

      // サンクスメッセージ
      await expect(page.getByText("ありがとうございます")).toBeVisible({ timeout: 15000 });
    });
  });

  // ============================
  // プログレスバー
  // ============================
  test.describe("プログレスバー", () => {
    test("プログレスバーが表示される", async ({ page }) => {
      await page.goto("/form/tanaka-coaching", { waitUntil: "networkidle" });
      // プログレスバーの親コンテナが存在する
      await expect(page.locator('[class*="bg-gray-100"]').or(page.locator('[class*="rounded-full"]')).first()).toBeVisible();
    });
  });
});
