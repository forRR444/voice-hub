import { test, expect } from "@playwright/test";

test.describe("認証済み：オンボーディング", () => {
  test("オンボーディング完了済みなら /onboarding から /dashboard にリダイレクトされる", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("未認証：オンボーディングガード", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("未認証で /onboarding にアクセスすると /login にリダイレクトされる", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});
