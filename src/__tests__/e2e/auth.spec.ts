import { test, expect } from "@playwright/test";

test.describe("認証とログインページ", () => {
  test("ログインページにVoiceHubのブランディングが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: "VoiceHub" })
    ).toBeVisible();
    await expect(
      page.getByText("お客様の声の収集・管理・表示ツール")
    ).toBeVisible();
  });

  test("Googleログインボタンが表示されSVGアイコンを含む", async ({ page }) => {
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Google/ });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await expect(button.locator("svg")).toBeVisible();
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
