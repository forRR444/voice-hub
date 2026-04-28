import { test, expect, type Locator } from "@playwright/test";

async function waitForData(locator: Locator, timeout = 5000): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe("認証済み：SNS画像作成", () => {
  test("ページタイトルと説明文が表示される", async ({ page }) => {
    await page.goto("/dashboard/sns");
    await expect(page.getByRole("heading", { name: "SNS画像を作成", level: 2 })).toBeVisible();
    await expect(
      page.getByText("口コミを選んでInstagramやX用の画像を生成できます", { exact: true })
    ).toBeVisible();
  });

  test("承認済み口コミがない場合は EmptyState が表示される", async ({ page }) => {
    await page.goto("/dashboard/sns");
    const empty = page.getByText("承認済みの口コミがありません", {
      exact: true,
    });
    const isEmpty = await waitForData(empty, 3000);
    test.skip(!isEmpty, "承認済み口コミが存在するためスキップ");
    await expect(empty).toBeVisible();
    await expect(
      page.getByText("口コミが届いて承認すると、ここからSNS画像を作成できます", { exact: true })
    ).toBeVisible();
  });

  test("ツールバーの「すべて選択」と一括ダウンロードボタンが可視（クリックしない）", async ({
    page,
  }) => {
    await page.goto("/dashboard/sns");
    const selectAll = page.getByRole("button", {
      name: "すべて選択",
      exact: true,
    });
    const hasData = await waitForData(selectAll, 3000);
    test.skip(!hasData, "承認済み口コミがないためスキップ");
    await expect(selectAll).toBeVisible();
    // 一括ダウンロードボタンは `hidden sm:inline` span で文言を持つが、ボタン自体のアクセシブルネームに含まれる
    const bulkButton = page.getByRole("button", { name: /一括ダウンロード/ });
    await expect(bulkButton).toBeVisible();
    // 未選択状態では disabled
    await expect(bulkButton).toBeDisabled();
  });

  test("口コミカードをクリックすると「1件選択中」が表示される", async ({ page }) => {
    await page.goto("/dashboard/sns");
    // 各カードは `.cursor-pointer.bg-white.rounded-lg.border` を持つ div
    const firstCard = page.locator("div.cursor-pointer.bg-white.rounded-lg.border").first();
    const hasData = await waitForData(firstCard, 3000);
    test.skip(!hasData, "承認済み口コミがないためスキップ");
    await firstCard.click();
    await expect(page.getByText("1件選択中", { exact: true })).toBeVisible();
  });

  test("プレビューボタンでダイアログが開き、閉じられる", async ({ page }) => {
    await page.goto("/dashboard/sns");
    // プレビューボタンは title="プレビュー" で描画される
    const previewButton = page.locator('button[title="プレビュー"]').first();
    const hasData = await waitForData(previewButton, 3000);
    test.skip(!hasData, "承認済み口コミがないためスキップ");
    await previewButton.click();
    // モーダル内の h3 タイトル "プレビュー"
    const modalTitle = page.getByRole("heading", {
      name: "プレビュー",
      level: 3,
    });
    await expect(modalTitle).toBeVisible();
    // 閉じるボタンは aria-label なし。モーダル内の X アイコンを持つ唯一のボタンを親 div 経由で特定する
    const closeButton = modalTitle.locator("..").getByRole("button");
    await closeButton.click();
    await expect(modalTitle).toBeHidden();
  });
});
