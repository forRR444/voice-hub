import { test, expect } from "@playwright/test";

test.describe("認証済み：ダッシュボードスモーク", () => {
  test("/dashboard にアクセスしてダッシュボードが表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "ダッシュボード", level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("/dashboard/forms にアクセスしてフォーム管理が表示される", async ({ page }) => {
    await page.goto("/dashboard/forms");
    await expect(page.getByRole("heading", { name: "フォーム管理", level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/forms$/);
  });

  test("/dashboard/widgets にアクセスしてウィジェット管理が表示される", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    await expect(page.getByRole("heading", { name: "ウィジェット管理", level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/widgets$/);
  });

  test("/dashboard/salon-page にアクセスしてサロンページが表示される", async ({ page }) => {
    await page.goto("/dashboard/salon-page");
    await expect(page.getByRole("heading", { name: "サロンページ", level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/salon-page$/);
  });

  test("/dashboard/settings にアクセスして設定が表示される", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "設定", level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/settings$/);
  });

  test("/dashboard/sns にアクセスしてSNS画像を作成が表示される", async ({ page }) => {
    await page.goto("/dashboard/sns");
    await expect(page.getByRole("heading", { name: "SNS画像を作成", level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/sns$/);
  });

  test("サイドバーのナビゲーションリンクが表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "ダッシュボード", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "フォーム", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "ウィジェット", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "サロンページ", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "SNS画像", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "設定", exact: true })).toBeVisible();
  });
});
