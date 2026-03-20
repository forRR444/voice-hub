import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// ランディングページ E2Eテスト
// ---------------------------------------------------------------------------

test.describe("ランディングページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ============================
  // ヒーローセクション
  // ============================
  test.describe("ヒーローセクション", () => {
    test("メインコピーが表示される", async ({ page }) => {
      await expect(page.getByText("お客様の声を集めて、")).toBeVisible();
      await expect(page.getByText("自動で表示。")).toBeVisible();
    });

    test("CTAボタン（無料で始める）が表示される", async ({ page }) => {
      await expect(page.getByRole("link", { name: /無料で始める/ }).first()).toBeVisible();
    });

    test("ベータ版バッジが表示される", async ({ page }) => {
      await expect(page.getByText(/ベータ版/).first()).toBeVisible();
    });

    test("クレジットカード不要の記載がある", async ({ page }) => {
      await expect(page.getByText("クレジットカード不要").first()).toBeVisible();
    });
  });

  // ============================
  // セクションの存在確認
  // ============================
  test.describe("主要セクション", () => {
    test("問題提起セクションが表示される", async ({ page }) => {
      await expect(page.getByText("こんな経験、ありませんか？").or(page.getByText("導入するだけで、こう変わります。"))).toBeVisible();
    });

    test("機能セクションが表示される", async ({ page }) => {
      await expect(page.getByText("シンプルだけど、必要な機能は全部入り。")).toBeVisible();
    });

    test("対象ユーザーセクションが表示される", async ({ page }) => {
      await expect(page.getByText("こんな方におすすめです。")).toBeVisible();
    });

    test("料金セクションが表示される", async ({ page }) => {
      await expect(page.getByText("¥0")).toBeVisible();
    });

    test("FAQセクションが表示される", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "よくある質問" })).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================
  // ナビゲーション
  // ============================
  test.describe("ナビゲーション", () => {
    test("無料で始めるリンクが/loginに遷移する", async ({ page }) => {
      const link = page.getByRole("link", { name: /無料で始める/ }).first();
      await expect(link).toHaveAttribute("href", "/login");
    });

    test("フッターにcopyrightが表示される", async ({ page }) => {
      await expect(page.getByText("© 2026 VoiceHub")).toBeVisible();
    });
  });

  // ============================
  // OGPメタタグ
  // ============================
  test.describe("OGPメタタグ", () => {
    test("og:titleが設定されている", async ({ page }) => {
      const content = await page.getAttribute('meta[property="og:title"]', "content");
      expect(content).toContain("VoiceHub");
    });

    test("og:descriptionが設定されている", async ({ page }) => {
      const content = await page.getAttribute('meta[property="og:description"]', "content");
      expect(content).toBeTruthy();
    });

    test("og:imageが設定されている", async ({ page }) => {
      const content = await page.getAttribute('meta[property="og:image"]', "content");
      expect(content).toContain("VoiceHub.png");
    });

    test("twitter:cardがsummary_large_imageである", async ({ page }) => {
      const content = await page.getAttribute('meta[name="twitter:card"]', "content");
      expect(content).toBe("summary_large_image");
    });
  });

  // ============================
  // レスポンシブ
  // ============================
  test.describe("レスポンシブ", () => {
    test("モバイルサイズでもメインコピーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/");
      await expect(page.getByText("お客様の声を集めて、")).toBeVisible();
    });
  });
});
