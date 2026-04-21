import { test, expect } from "@playwright/test";

test.describe("認証済み：ダッシュボード", () => {
  test("storageStateで/dashboardに直接アクセスできる", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
