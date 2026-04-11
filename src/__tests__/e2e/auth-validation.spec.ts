import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// 認証ページ クライアントサイドバリデーション E2Eテスト
// ---------------------------------------------------------------------------

test.describe("ログインページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("メールフォーム表示前はGoogleログインとメールログインボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "メールアドレスでログイン" })).toBeVisible();
  });

  test("メールアドレスでログインボタンを押すとフォームが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード")).toBeVisible();
  });

  test("空のメールアドレスでログインするとバリデーションエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });

  test("ログインページからサインアップへ遷移できる", async ({ page }) => {
    const signupLink = page.getByRole("link", { name: "新規登録" }).first();
    await expect(signupLink).toHaveAttribute("href", "/signup");
  });
});

test.describe("サインアップページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("サインアップページからログインへ遷移できる", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: "ログイン" }).first();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("パスワード不一致バリデーション", async ({ page }) => {
    await page.getByRole("button", { name: "メールアドレスで登録" }).click();
    await page.getByPlaceholder("メールアドレス").fill("test@example.com");
    await page.getByPlaceholder("パスワード（8文字以上）").fill("securepass1");
    await page.getByPlaceholder("パスワード（確認）").fill("differentpass");
    await page.getByRole("button", { name: "無料で登録" }).click();
    await expect(page.getByText("パスワードが一致しません")).toBeVisible();
  });

  test("短いパスワードバリデーション", async ({ page }) => {
    await page.getByRole("button", { name: "メールアドレスで登録" }).click();
    await page.getByPlaceholder("メールアドレス").fill("test@example.com");
    await page.getByPlaceholder("パスワード（8文字以上）").fill("short");
    await page.getByPlaceholder("パスワード（確認）").fill("short");
    await page.getByRole("button", { name: "無料で登録" }).click();
    await expect(page.getByText("パスワードは8文字以上で入力してください")).toBeVisible();
  });
});

test.describe("パスワードリセットページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password");
  });

  test("パスワードリセットフォームが表示される", async ({ page }) => {
    await expect(page.getByText("パスワードをリセット")).toBeVisible();
    await expect(page.getByPlaceholder("登録済みのメールアドレス")).toBeVisible();
    await expect(page.getByRole("button", { name: "リセットメールを送信" })).toBeVisible();
  });

  test("空メールで送信するとバリデーションエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "リセットメールを送信" }).click();
    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });

  test("ログインに戻るリンクがある", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: "ログインに戻る" });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });
});

test.describe("ログイン・サインアップ間のナビゲーション", () => {
  test("ログインページの新規登録リンクからサインアップへ遷移できる", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "新規登録" }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("サインアップページのログインリンクからログインへ遷移できる", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "ログイン" }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});
