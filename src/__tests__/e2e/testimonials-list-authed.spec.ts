import { test, expect } from "@playwright/test";

test.describe("認証済み：口コミ管理", () => {
  test("追加ボタンでメニューが開き、項目が表示される", async ({ page }) => {
    await page.goto("/dashboard");
    const addButton = page.getByRole("button", { name: "追加", exact: true });
    await addButton.click();
    await expect(page.getByRole("button", { name: "手動で追加" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Google口コミをインポート" })).toBeVisible();
  });

  test("承認済みタブをクリックしても URL が変わらない", async ({ page }) => {
    await page.goto("/dashboard");
    const tab = page.getByRole("button", { name: "承認済み", exact: true });
    const hasData = await tab.isVisible();
    test.skip(!hasData, "口コミデータがないためスキップ");
    await tab.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(tab).toBeVisible();
  });

  test("検索欄に存在しない文字列を入れると該当 0 件メッセージが出る", async ({ page }) => {
    await page.goto("/dashboard");
    const searchInput = page.getByPlaceholder("検索...");
    const hasData = await searchInput.isVisible();
    test.skip(!hasData, "口コミデータがないためスキップ");
    await searchInput.fill("zzzzzznonexistentquery999");
    await expect(page.getByText("該当する口コミがありません")).toBeVisible();
  });

  test("口コミ行をクリックすると /dashboard/<id> に遷移する", async ({ page }) => {
    await page.goto("/dashboard");
    // TestimonialRow は `.group.py-5` を持つ div 内に <Link href="/dashboard/<uuid>"> を描画する。
    // サイドバーの /dashboard/forms などは対象外になるようクラススコープで絞る。
    const rowLink = page.locator('.group.py-5 a[href^="/dashboard/"]').first();
    const hasData = await rowLink.isVisible();
    test.skip(!hasData, "口コミデータがないためスキップ");
    await rowLink.click();
    await expect(page).toHaveURL(/\/dashboard\/[0-9a-fA-F-]+$/);
  });
});
