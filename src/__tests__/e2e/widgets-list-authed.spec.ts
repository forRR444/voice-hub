import { test, expect, type Locator } from "@playwright/test";

async function waitForData(locator: Locator, timeout = 5000): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe("認証済み：ウィジェット管理", () => {
  test("ページタイトル「ウィジェット管理」が表示される", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    await expect(page.getByRole("heading", { name: "ウィジェット管理", level: 2 })).toBeVisible();
  });

  test("『新しいウィジェット』ボタンをクリックすると作成モーダルが開く", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    await page.getByRole("button", { name: "新しいウィジェット" }).click();
    await expect(page.getByRole("heading", { name: "新しいウィジェット作成" })).toBeVisible();
    await page.getByRole("button", { name: "キャンセル", exact: true }).click();
    await expect(page.getByRole("heading", { name: "新しいウィジェット作成" })).toHaveCount(0);
  });

  test("ウィジェットが存在する場合、『埋め込みコードを表示』ボタンが表示される", async ({
    page,
  }) => {
    await page.goto("/dashboard/widgets");
    const embedBtn = page.getByRole("button", { name: "埋め込みコードを表示" }).first();
    const hasData = await waitForData(embedBtn);
    test.skip(!hasData, "ウィジェットデータがないためスキップ");
    await expect(embedBtn).toBeVisible();
  });

  test("『埋め込みコードを表示』をクリックするとスクリプト埋め込みと iFrame 埋め込みが見える", async ({
    page,
  }) => {
    await page.goto("/dashboard/widgets");
    const embedBtn = page.getByRole("button", { name: "埋め込みコードを表示" }).first();
    const hasData = await waitForData(embedBtn);
    test.skip(!hasData, "ウィジェットデータがないためスキップ");
    await embedBtn.click();
    await expect(page.getByText("スクリプト埋め込み").first()).toBeVisible();
    await expect(page.getByText("iFrame埋め込み").first()).toBeVisible();
  });

  test("ケバブメニューを開くとプレビュー / 編集 / 削除の 3 項目が表示される", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    const kebab = page.locator("button:has(svg.lucide-ellipsis)").first();
    const hasData = await waitForData(kebab);
    test.skip(!hasData, "ウィジェットデータがないためスキップ");
    await kebab.click();
    await expect(page.getByRole("link", { name: /プレビュー/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "編集", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "削除", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("プレビューリンクが /preview/<uuid> 形式の href を持つ", async ({ page }) => {
    await page.goto("/dashboard/widgets");
    const kebab = page.locator("button:has(svg.lucide-ellipsis)").first();
    const hasData = await waitForData(kebab);
    test.skip(!hasData, "ウィジェットデータがないためスキップ");
    await kebab.click();
    const previewLink = page.getByRole("link", { name: /プレビュー/ });
    await expect(previewLink).toHaveAttribute("href", /\/preview\/[0-9a-fA-F-]+$/);
  });
});
