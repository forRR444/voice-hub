import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// 公開ページ拡張 E2Eテスト（LP / ログイン / サインアップ / リセット / try）
// 既存 auth-validation / landing-page / try-page / legal-pages と重複しない補完テスト
// ---------------------------------------------------------------------------

test.describe("ランディングページ 補完", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ヘッダーのログインリンクが /login を指す", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: "ログイン" }).first();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });
});

test.describe("ログインページ 補完", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("初期表示で『Googleでログイン』ボタンが可視", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });

  test("『パスワードを忘れた方』リンククリックで /reset-password に遷移する", async ({ page }) => {
    // メールフォームを展開しないとリンクは表示されない
    await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
    const resetLink = page.getByRole("link", { name: "パスワードを忘れた方" });
    await expect(resetLink).toBeVisible();
    await resetLink.click();
    await expect(page).toHaveURL(/\/reset-password/);
    await expect(page.getByText("パスワードをリセット")).toBeVisible();
  });
});

test.describe("サインアップページ 補完", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("初期表示で『Googleで登録』ボタンが可視", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Googleで登録" })).toBeVisible();
  });

  test("メールフォーム展開後に『戻る』を押すと初期表示に戻る", async ({ page }) => {
    // 初期表示: メール入力欄は未表示、Google登録ボタンが表示
    await expect(page.getByRole("button", { name: "Googleで登録" })).toBeVisible();
    await expect(page.getByPlaceholder("メールアドレス")).toBeHidden();

    // メールフォームに切り替え
    await page.getByRole("button", { name: "メールアドレスで登録" }).click();
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード（8文字以上）")).toBeVisible();

    // 『戻る』で初期表示に戻る
    await page.getByRole("button", { name: "戻る" }).click();
    await expect(page.getByRole("button", { name: "Googleで登録" })).toBeVisible();
    await expect(page.getByRole("button", { name: "メールアドレスで登録" })).toBeVisible();
    await expect(page.getByPlaceholder("メールアドレス")).toBeHidden();
  });
});

test.describe("パスワードリセットページ 補完", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password");
  });

  test("不正なメール形式を入力して送信するとバリデーションエラーが表示される", async ({ page }) => {
    const emailInput = page.getByPlaceholder("登録済みのメールアドレス");
    // まず値を入れ、最後に type を上書きして HTML5 の type="email" 組み込みバリデーションを
    // 回避する（fill 前に setAttribute すると React の再レンダリングで type="email" に戻るため）。
    // これでカスタムの validateEmail() ロジックのみを検証できる。
    await emailInput.fill("invalid-email");
    await emailInput.evaluate((el: HTMLInputElement) => {
      el.setAttribute("type", "text");
    });
    await page.getByRole("button", { name: "リセットメールを送信" }).click();
    await expect(page.getByText("メールアドレスの形式が正しくありません")).toBeVisible();
  });
});

test.describe("/try ページ 補完", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/try");
    // Step 2 に進む
    await page.getByRole("button", { name: "スキップして次へ" }).click();
  });

  test("Step 2 で HP プレビュー（ブラウザchrome風 your-salon.com）が可視", async ({ page }) => {
    await expect(page.getByText("your-salon.com")).toBeVisible();
  });

  test("『無料で登録してサイトに貼り付ける』CTAクリックで /signup?from=try に遷移する", async ({
    page,
  }) => {
    const cta = page.getByRole("link", { name: "無料で登録してサイトに貼り付ける" });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/signup\?from=try/);
  });
});
