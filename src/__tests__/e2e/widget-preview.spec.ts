import { test, expect } from "@playwright/test";

test.describe("ウィジェットプレビュー - カルーセル", () => {
  const carouselUrl = "/preview/d0000000-0000-0000-0000-000000000001";

  test("テスティモニアルカードが表示される", async ({ page }) => {
    await page.goto(carouselUrl);
    await expect(page.locator(".carousel-track > div").first()).toBeVisible();
  });

  test("星評価が表示される", async ({ page }) => {
    await page.goto(carouselUrl);
    await expect(page.locator("span").filter({ hasText: "★" }).first()).toBeVisible();
  });

  test("Powered by VoiceHubバッジが表示される", async ({ page }) => {
    await page.goto(carouselUrl);
    await expect(page.getByText("Powered by VoiceHub")).toBeVisible();
  });

  test("カルーセルのナビゲーションボタンが表示される", async ({ page }) => {
    await page.goto(carouselUrl);
    await expect(page.getByLabel("前へ")).toBeVisible();
    await expect(page.getByLabel("次へ")).toBeVisible();
  });
});

test.describe("ウィジェットプレビュー - グリッド", () => {
  const gridUrl = "/preview/d0000000-0000-0000-0000-000000000002";

  test("グリッドレイアウトにカードが表示される", async ({ page }) => {
    await page.goto(gridUrl);
    await expect(page.locator(".grid-container")).toBeVisible();
    await expect(
      page.locator(".grid-container > div").first()
    ).toBeVisible();
  });
});

test.describe("ウィジェットプレビュー - マーキー", () => {
  const marqueeUrl = "/preview/d0000000-0000-0000-0000-000000000003";

  test("マーキーコンテナにアニメーションが適用される", async ({ page }) => {
    await page.goto(marqueeUrl);
    await expect(page.locator(".marquee-container")).toBeVisible();
    await expect(page.locator(".marquee-track")).toBeVisible();

    const animationName = await page
      .locator(".marquee-track")
      .evaluate((el) => window.getComputedStyle(el).animationName);
    expect(animationName).toBe("marquee-scroll");
  });
});
