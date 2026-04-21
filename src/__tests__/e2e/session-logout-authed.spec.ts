import { test, expect } from "@playwright/test";

test.describe("認証済み：ログアウトボタン", () => {
  test("ダッシュボードヘッダーにログアウトボタンが表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
  });
});

test.describe("未認証", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/dashboard にアクセスすると /login にリダイレクトされる", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/dashboard/settings にアクセスすると /login にリダイレクトされる", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/login/);
  });
});
