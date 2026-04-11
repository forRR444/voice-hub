import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// /try ページ E2Eテスト（CTA変換ファネル）
// ---------------------------------------------------------------------------

test.describe("/try ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/try");
  });

  // ============================
  // Step 1: Google口コミ取り込み
  // ============================
  test.describe("Step 1 — Google口コミ取り込み", () => {
    test("ページがStep 1で表示される（Google Import関連のUI）", async ({ page }) => {
      await expect(page.getByText("Google口コミを取り込む")).toBeVisible();
      await expect(page.getByText("ビジネス名で検索して口コミを選んでください")).toBeVisible();
    });

    test("スキップボタンでStep 2に進む", async ({ page }) => {
      await page.getByRole("button", { name: "スキップして次へ" }).click();
      await expect(page.getByText("口コミをサイトに表示できます")).toBeVisible();
    });
  });

  // ============================
  // Step 2: サインアップCTA
  // ============================
  test.describe("Step 2 — サインアップCTA", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: "スキップして次へ" }).click();
    });

    test("サインアップCTAが表示される（/signup?from=tryへのリンク）", async ({ page }) => {
      const cta = page.getByRole("link", { name: "無料で登録してサイトに貼り付ける" });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", "/signup?from=try");
    });

    test("ログインリンクが表示される", async ({ page }) => {
      const loginLink = page.getByRole("link", { name: "アカウントをお持ちの方" });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute("href", "/login?from=try");
    });

    test("戻るボタンでStep 1に戻る", async ({ page }) => {
      await page.getByRole("button", { name: "戻る" }).click();
      await expect(page.getByText("Google口コミを取り込む")).toBeVisible();
    });

    test("サンプル口コミが表示される", async ({ page }) => {
      await expect(page.getByText("カラーの仕上がりが理想通りでした").first()).toBeVisible();
    });
  });

  // ============================
  // 共通ナビゲーション
  // ============================
  test.describe("共通ナビゲーション", () => {
    test("トップに戻るリンクが存在する", async ({ page }) => {
      const topLink = page.getByRole("link", { name: "トップに戻る" });
      await expect(topLink).toBeVisible();
      await expect(topLink).toHaveAttribute("href", "/");
    });
  });
});
