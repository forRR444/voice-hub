import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// パスワード更新ページ E2Eテスト（/update-password）
// middleware は /update-password を認証必須として保護しているため、
// storageState を使う chromium-auth プロジェクトで実行する。
// クライアント側のバリデーションのみ検証する
// （正しいパスワードの送信は Supabase API を叩いてしまうため行わない）
// ---------------------------------------------------------------------------

test.describe("認証済み：パスワード更新ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/update-password");
  });

  test("新しいパスワード入力フォームが表示される", async ({ page }) => {
    await expect(page.getByText("新しいパスワードを設定")).toBeVisible();
    await expect(page.getByPlaceholder("新しいパスワード（8文字以上）")).toBeVisible();
    await expect(page.getByPlaceholder("新しいパスワード（確認）")).toBeVisible();
    await expect(page.getByRole("button", { name: "パスワードを更新" })).toBeVisible();
  });

  test("短いパスワードを入力するとバリデーションエラーが表示される", async ({ page }) => {
    await page.getByPlaceholder("新しいパスワード（8文字以上）").fill("short");
    await page.getByPlaceholder("新しいパスワード（確認）").fill("short");
    await page.getByRole("button", { name: "パスワードを更新" }).click();
    await expect(page.getByText("パスワードは8文字以上で入力してください")).toBeVisible();
  });

  test("パスワードが一致しないとバリデーションエラーが表示される", async ({ page }) => {
    await page.getByPlaceholder("新しいパスワード（8文字以上）").fill("securepass1");
    await page.getByPlaceholder("新しいパスワード（確認）").fill("differentpass1");
    await page.getByRole("button", { name: "パスワードを更新" }).click();
    await expect(page.getByText("パスワードが一致しません")).toBeVisible();
  });
});
