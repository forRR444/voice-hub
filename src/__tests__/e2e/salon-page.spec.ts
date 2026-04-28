import { test, expect } from "@playwright/test";

test.describe("サロン公開ページ", () => {
  test("存在しないslugで404ページが表示される", async ({ page }) => {
    await page.goto("/salon/nonexistent-slug-xyz-999", { waitUntil: "networkidle" });
    await expect(page.getByText("ページが見つかりません")).toBeVisible({ timeout: 10000 });
  });

  test("404ページに「トップページへ」リンクがある", async ({ page }) => {
    await page.goto("/salon/nonexistent-slug-xyz-999", { waitUntil: "networkidle" });
    const link = page.getByText("トップページへ");
    await expect(link).toBeVisible({ timeout: 10000 });
  });
});

test.describe("サロンページ設定 - 認証", () => {
  test("未ログインで/dashboard/salon-pageにアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/dashboard/salon-page");
    await page.waitForURL("**/login", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("サロン公開ページ - モバイル", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("モバイルでも404ページが正しく表示される", async ({ page }) => {
    await page.goto("/salon/nonexistent-slug-xyz-999", { waitUntil: "networkidle" });
    await expect(page.getByText("ページが見つかりません")).toBeVisible({ timeout: 10000 });
  });
});
