import { test, expect, devices } from "@playwright/test";

// ---------------------------------------------------------------------------
// 認証済みダッシュボードのモバイル表示を検証する E2E テスト
//
// playwright.config.ts の mobile プロジェクトは *-authed.spec.ts を除外する
// 設計のため、モバイル認証ページの検証は独立した `-authed.spec.ts` で
// `test.use({ viewport, isMobile })` を指定して行う。
// ---------------------------------------------------------------------------

test.use({
  ...devices["Desktop Chrome"],
  viewport: { width: 390, height: 844 },
  isMobile: true,
});

test.describe("認証済み：ダッシュボードのモバイル表示", () => {
  test("ハンバーガーボタンが表示され、タップでサイドバーが開く", async ({ page }) => {
    await page.goto("/dashboard");
    const hamburger = page.getByLabel("メニューを開く");
    await expect(hamburger).toBeVisible();

    await hamburger.click();
    // サイドバーが開いたら閉じるボタンと各ナビゲーションリンクが見える
    await expect(page.getByLabel("メニューを閉じる")).toBeVisible();
    await expect(page.getByRole("link", { name: "フォーム", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "ウィジェット", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "設定", exact: true })).toBeVisible();
  });

  test("オーバーレイをタップするとサイドバーが閉じる", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByLabel("メニューを開く").click();
    await expect(page.getByLabel("メニューを閉じる")).toBeVisible();

    // mobile-sidebar.tsx の <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
    // aside (w-60 = 240px) が中央を覆うので、右側の空き領域をクリックする
    await page.locator("div.fixed.inset-0.bg-black\\/50").click({ position: { x: 350, y: 400 } });
    await expect(page.getByLabel("メニューを閉じる")).toBeHidden();
    await expect(page.getByLabel("メニューを開く")).toBeVisible();
  });

  test("ナビリンクをタップするとサイドバーが閉じて目的ページに遷移する", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByLabel("メニューを開く").click();
    await expect(page.getByLabel("メニューを閉じる")).toBeVisible();

    // mobile-sidebar.tsx の <div onClick={() => setOpen(false)}> 親ラッパーが Link クリックをバブリング受領して閉じる
    await page.getByRole("link", { name: "ウィジェット", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/widgets$/);
    await expect(page.getByLabel("メニューを閉じる")).toBeHidden();
  });

  test("フォーム管理ページでモバイル用『追加』ボタンが表示される", async ({ page }) => {
    await page.goto("/dashboard/forms");
    // モバイルでは span.sm:hidden 側の「追加」が見える（Desktop の「新しいフォーム」は隠れる）
    await expect(page.getByRole("button", { name: "追加", exact: true })).toBeVisible();
  });

  test("ウィジェット管理ページでモバイル用『追加』ボタンが表示される", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    await expect(page.getByRole("button", { name: "追加", exact: true })).toBeVisible();
  });

  test("全主要ページが縦スクロール内に描画される（水平スクロール発生チェック）", async ({
    page,
  }) => {
    const pages = ["/dashboard", "/dashboard/forms", "/dashboard/widgets", "/dashboard/settings"];
    for (const url of pages) {
      await page.goto(url);
      // document.documentElement.scrollWidth が viewport 幅を超えていないこと
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });
      expect(overflow.scrollWidth, `Horizontal overflow on ${url}`).toBeLessThanOrEqual(
        overflow.clientWidth + 1
      );
    }
  });
});
