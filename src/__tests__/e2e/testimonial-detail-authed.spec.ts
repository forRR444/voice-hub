import { test, expect, type Page } from "@playwright/test";

async function openFirstDetail(page: Page): Promise<boolean> {
  await page.goto("/dashboard");
  const rowLink = page.locator('.group.py-5 a[href^="/dashboard/"]').first();
  try {
    await rowLink.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    return false;
  }
  await rowLink.click();
  await expect(page).toHaveURL(/\/dashboard\/[0-9a-fA-F-]+$/);
  return true;
}

test.describe("認証済み：口コミ詳細画面", () => {
  test("一覧から詳細画面へ遷移すると UUID 形式の URL になる", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
  });

  test("詳細画面の主要セクション（戻るリンク・ステータス・タグ）が表示される", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
    await expect(page.getByRole("link", { name: "お客様の声に戻る" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ステータス", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "タグ", exact: true, level: 3 })).toBeVisible();
  });

  test("戻るリンクをクリックすると /dashboard に戻る", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
    await page.getByRole("link", { name: "お客様の声に戻る" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "ダッシュボード", level: 2 })).toBeVisible();
  });

  test("ステータス3種のボタン（未承認・承認済み・非承認）が表示される", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
    await expect(page.getByRole("button", { name: "未承認", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "承認済み", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "非承認", exact: true })).toBeVisible();
  });

  test("注目トグルと SNS画像ボタンが表示される", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
    await expect(page.getByRole("button", { name: /注目(に設定|から解除)/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "SNS画像", exact: true })).toBeVisible();
  });

  test("削除アイコンを押すと確認モーダルが開き、キャンセルで閉じる", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
    await page.getByRole("button", { name: "削除", exact: true }).click();
    await expect(page.getByRole("heading", { name: "削除の確認" })).toBeVisible();
    await page.getByRole("button", { name: "キャンセル", exact: true }).click();
    await expect(page.getByRole("heading", { name: "削除の確認" })).toHaveCount(0);
  });

  test("SNS画像ボタンを押すと SNS画像モーダルが開く", async ({ page }) => {
    const ok = await openFirstDetail(page);
    test.skip(!ok, "口コミデータがないためスキップ");
    await page.getByRole("button", { name: "SNS画像", exact: true }).click();
    await expect(page.getByRole("heading", { name: "SNS画像を作成" })).toBeVisible();
  });
});
