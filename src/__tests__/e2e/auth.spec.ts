import { test, expect } from "@playwright/test";

test.describe("認証とログインページ", () => {
  test("ログインページにVoiceHubのブランディングが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: "VoiceHub" })
    ).toBeVisible();
  });

  test("メール/パスワードフォームとGoogleボタンが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
    const googleButton = page.getByRole("button", { name: /Google/ });
    await expect(googleButton).toBeVisible();
    await expect(googleButton.locator("svg")).toBeVisible();
  });

  test.describe("未認証ユーザーのリダイレクト", () => {
    const protectedPaths = [
      "/dashboard",
      "/dashboard/forms",
      "/dashboard/widgets",
      "/dashboard/settings",
    ];

    for (const path of protectedPaths) {
      test(`${path} から /login にリダイレクトされる`, async ({ page }) => {
        await page.goto(path);
        await page.waitForURL("**/login**", { timeout: 10_000 });
        expect(page.url()).toContain("/login");
      });
    }
  });
});
