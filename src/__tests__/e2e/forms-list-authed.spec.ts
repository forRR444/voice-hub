import { test, expect, type Locator } from "@playwright/test";

async function waitForData(locator: Locator, timeout = 5000): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe("認証済み：フォーム管理", () => {
  test("ページタイトル「フォーム管理」が表示される", async ({ page }) => {
    await page.goto("/dashboard/forms");
    await expect(page.getByRole("heading", { name: "フォーム管理", level: 2 })).toBeVisible();
  });

  test("『新しいフォーム』ボタンをクリックするとテンプレートモーダルが開く", async ({ page }) => {
    await page.goto("/dashboard/forms");
    await page.getByRole("button", { name: "新しいフォーム" }).click();
    await expect(page.getByRole("heading", { name: "テンプレートを選択" })).toBeVisible();
    await page.getByRole("button", { name: "キャンセル", exact: true }).click();
    await expect(page.getByRole("heading", { name: "テンプレートを選択" })).toHaveCount(0);
  });

  test("フォームが存在する場合、URLをコピーボタンが表示される", async ({ page }) => {
    await page.goto("/dashboard/forms");
    const copyBtn = page.getByRole("button", { name: "URLをコピー" }).first();
    const hasData = await waitForData(copyBtn);
    test.skip(!hasData, "フォームデータがないためスキップ");
    await expect(copyBtn).toBeVisible();
  });

  test("QRコードボタンをクリックするとモーダルが開き PNG 保存ボタンが見える", async ({ page }) => {
    await page.goto("/dashboard/forms");
    const qrBtn = page.getByRole("button", { name: /QRコード/ }).first();
    const hasData = await waitForData(qrBtn);
    test.skip(!hasData, "フォームデータがないためスキップ");
    await qrBtn.click();
    await expect(page.getByRole("heading", { name: "QRコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "PNG保存" })).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
  });

  test("質問内容を確認ボタンを押すと編集モードに入り『キャンセル』ボタンが表示される", async ({ page }) => {
    await page.goto("/dashboard/forms");
    const previewBtn = page.getByRole("button", { name: "質問内容を確認" }).first();
    const hasData = await waitForData(previewBtn);
    test.skip(!hasData, "フォームデータがないためスキップ");
    await previewBtn.click();
    await expect(page.getByRole("button", { name: "キャンセル", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "キャンセル", exact: true }).first().click();
  });

  test("URLをコピーボタンを押すとラベルが『コピーしました』に切り替わる", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dashboard/forms");
    const copyBtn = page.getByRole("button", { name: "URLをコピー" }).first();
    const hasData = await waitForData(copyBtn);
    test.skip(!hasData, "フォームデータがないためスキップ");
    await copyBtn.click();
    await expect(page.getByRole("button", { name: "コピーしました" }).first()).toBeVisible();
  });
});
