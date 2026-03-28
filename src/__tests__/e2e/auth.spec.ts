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

  test("ログインページにログイン/新規登録タブが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("ログイン").first()).toBeVisible();
    await expect(page.getByText("新規登録").first()).toBeVisible();
  });

  test("パスワードを忘れた方リンクが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: "パスワードを忘れた方" })).toBeVisible();
  });

  test.describe("未認証ユーザーのリダイレクト", () => {
    const protectedPaths = [
      "/dashboard",
      "/dashboard/forms",
      "/dashboard/widgets",
      "/dashboard/settings",
      "/update-password",
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

test.describe("新規登録ページ", () => {
  test("新規登録ページにフォームが表示される", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード（8文字以上）")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード（確認）")).toBeVisible();
    await expect(page.getByRole("button", { name: "無料で登録" })).toBeVisible();
  });

  test("新規登録ページにGoogleボタンが表示される", async ({ page }) => {
    await page.goto("/signup");
    const googleButton = page.getByRole("button", { name: /Google/ });
    await expect(googleButton).toBeVisible();
  });

  test("新規登録ページにログイン/新規登録タブが表示される", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("ログイン").first()).toBeVisible();
    await expect(page.getByText("新規登録").first()).toBeVisible();
  });

  test("利用規約とプライバシーポリシーのリンクが表示される", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("link", { name: "利用規約" })).toBeVisible();
    await expect(page.getByRole("link", { name: "プライバシーポリシー" })).toBeVisible();
  });
});

test.describe("パスワードリセットページ", () => {
  test("リセットページにフォームが表示される", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByPlaceholder("登録済みのメールアドレス")).toBeVisible();
    await expect(page.getByRole("button", { name: "リセットメールを送信" })).toBeVisible();
  });

  test("ログインに戻るリンクが表示される", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("link", { name: "ログインに戻る" })).toBeVisible();
  });
});
