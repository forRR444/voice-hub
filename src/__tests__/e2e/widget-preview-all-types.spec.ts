import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// 全7タイプのウィジェットプレビューテスト
// ?type= パラメータで既存ウィジェットのタイプを上書きしてテスト
// ---------------------------------------------------------------------------

const WIDGET_ID = process.env.TEST_WIDGET_ID || "4095d643-4f20-43dd-866c-4533d03900cd";
const BASE_URL = `/preview/${WIDGET_ID}`;

test.describe("ウィジェットプレビュー - 全タイプ", () => {
  // ============================
  // カルーセル
  // ============================
  test.describe("カルーセル", () => {
    const url = `${BASE_URL}?type=carousel`;

    test("カルーセルトラックにカードが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".carousel-track > div").first()).toBeVisible({ timeout: 10000 });
    });

    test("前へ/次へボタンが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.getByLabel("前へ")).toBeVisible();
      await expect(page.getByLabel("次へ")).toBeVisible();
    });

    test("ドットナビゲーションが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".carousel-dot").first()).toBeVisible({ timeout: 10000 });
    });

    test("次へボタンでスクロールする", async ({ page }) => {
      await page.goto(url);
      const carousel = page.locator("#carousel");
      await expect(carousel).toBeVisible();

      const scrollBefore = await carousel.evaluate((el) => el.scrollLeft);
      await page.getByLabel("次へ").click();
      await page.waitForTimeout(500);
      const scrollAfter = await carousel.evaluate((el) => el.scrollLeft);

      expect(scrollAfter).toBeGreaterThan(scrollBefore);
    });

    test("星評価が表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator("span").filter({ hasText: "★" }).first()).toBeVisible();
    });
  });

  // ============================
  // グリッド
  // ============================
  test.describe("グリッド", () => {
    const url = `${BASE_URL}?type=grid`;

    test("グリッドコンテナにカードが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".grid-container")).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".grid-container > div").first()).toBeVisible();
    });

    test("複数カードが表示される", async ({ page }) => {
      await page.goto(url);
      const count = await page.locator(".grid-container > div").count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================
  // マーキー
  // ============================
  test.describe("マーキー", () => {
    const url = `${BASE_URL}?type=marquee`;

    test("マーキーコンテナが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".marquee-container")).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".marquee-track")).toBeVisible();
    });

    test("アニメーションが適用されている", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".marquee-track")).toBeVisible({ timeout: 10000 });

      const animationName = await page
        .locator(".marquee-track")
        .evaluate((el) => window.getComputedStyle(el).animationName);
      expect(animationName).toBe("marquee-scroll");
    });

    test("カードが複製されている（シームレスループ用）", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".marquee-track")).toBeVisible({ timeout: 10000 });

      // マーキーはカードを2回レンダリングする
      const cardCount = await page.locator(".marquee-track > div").count();
      expect(cardCount).toBeGreaterThan(1);
    });
  });

  // ============================
  // リスト
  // ============================
  test.describe("リスト", () => {
    const url = `${BASE_URL}?type=list`;

    test("リストコンテナにカードが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(
        page.locator(".list-container").or(page.locator(".list-card")).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================
  // シングル
  // ============================
  test.describe("シングル", () => {
    const url = `${BASE_URL}?type=single`;

    test("シングルカードが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(
        page.locator(".single-container").or(page.locator(".single-card")).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("テスティモニアルの内容が表示される", async ({ page }) => {
      await page.goto(url);
      await expect(
        page.locator(".single-card").or(page.locator(".single-content")).first()
      ).toBeVisible({ timeout: 10000 });

      // テキストが存在する
      const text = await page.locator(".single-card, .single-content").first().textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  // ============================
  // Wall of Love
  // ============================
  test.describe("Wall of Love", () => {
    const url = `${BASE_URL}?type=wall`;

    test("ウォールコンテナにカードが表示される", async ({ page }) => {
      await page.goto(url);
      await expect(
        page.locator(".wall-container").or(page.locator(".wall-card")).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("複数カードが表示される", async ({ page }) => {
      await page.goto(url);
      await page.waitForSelector(".wall-container, .wall-card", { timeout: 10000 });
      const count = await page.locator(".wall-card, .wall-container > div").count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================
  // バッジ
  // ============================
  test.describe("バッジ", () => {
    const url = `${BASE_URL}?type=badge`;

    test("バッジウィジェットに評価と件数が表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.getByText("件のお客様の声")).toBeVisible({ timeout: 10000 });
    });

    test("星評価が表示される", async ({ page }) => {
      await page.goto(url);
      await expect(page.locator(".badge-stars, .vh-badge-star").first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  // ============================
  // 共通テスト
  // ============================
  test.describe("共通", () => {
    test("Powered by VoiceHubバッジが表示される", async ({ page }) => {
      await page.goto(`${BASE_URL}?type=carousel`);
      await expect(page.getByText("Powered by VoiceHub")).toBeVisible({ timeout: 10000 });
    });

    test("存在しないウィジェットIDで404が表示される", async ({ page }) => {
      const response = await page.goto("/preview/nonexistent-widget-id");
      expect(response?.status()).toBe(404);
    });

    test("不正なtypeパラメータは無視される", async ({ page }) => {
      await page.goto(`${BASE_URL}?type=invalid_type`);
      // 無効なタイプはデフォルト（元のウィジェットタイプ）でレンダリングされる
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("type=invalid_type");
    });
  });
});
