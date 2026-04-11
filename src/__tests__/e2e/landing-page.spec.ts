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
      await expect(page.getByText("HPにもSNSにも。")).toBeVisible();
    });

    test("CTAボタン（無料で試してみる）が表示される", async ({ page }) => {
      await expect(page.getByRole("link", { name: /無料で試してみる/ }).first()).toBeVisible();
    });

    test("先着10名バッジが表示される", async ({ page }) => {
      await expect(page.getByText(/先着10名/).first()).toBeVisible();
    });

    test("クレジットカード不要の記載がある", async ({ page }) => {
      await expect(page.getByText("クレジットカード不要").first()).toBeVisible();
    });
  });

  // ============================
  // セクションの存在確認
  // ============================
  test.describe("主要セクション", () => {
    test("Pain→Solutionセクションが表示される", async ({ page }) => {
      await expect(page.getByText("こんな面倒から解放されます。")).toBeVisible();
    });

    test("できることセクションが表示される", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "できること" })).toBeVisible();
    });

    test("2ステップセクションが表示される", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /2ステップ/ })).toBeVisible();
    });

    test("料金セクションが表示される", async ({ page }) => {
      await expect(page.getByText("¥0").first()).toBeVisible();
    });

    test("FAQセクションが表示される", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "よくある質問" })).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================
  // ナビゲーション
  // ============================
  test.describe("ナビゲーション", () => {
    test("無料で試してみるリンクが/tryに遷移する", async ({ page }) => {
      const link = page.getByRole("link", { name: /無料で試してみる/ }).first();
      await expect(link).toHaveAttribute("href", "/try");
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
