import { test, expect, Page } from "@playwright/test";

async function waitForData(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
}

test.describe("認証済み：設定ページ", () => {
  test("ページタイトルとワークスペース見出し・入力欄が表示される", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await waitForData(page);

    await expect(page.getByRole("heading", { name: "設定", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ワークスペース", level: 3 })).toBeVisible();

    // ワークスペース名の入力欄（settings-client.tsx 内で type="text" の input はこの1つのみ）
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
  });

  test("利用状況セクションとプランバッジが表示される", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await waitForData(page);

    await expect(page.getByRole("heading", { name: "利用状況", level: 3 })).toBeVisible();

    // IS_BETA=true の環境では「初期サポーター」バッジ、それ以外は「Proプラン」/「Freeプラン」バッジ
    const planBadge = page.getByText(/Proプラン|Freeプラン|初期サポーター/).first();
    await expect(planBadge).toBeVisible();
  });

  test("正式リリース後のプラン案内と disabled ボタンが表示される（ベータ時）", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await waitForData(page);

    const betaHeading = page.getByRole("heading", { name: "正式リリース後のプラン", level: 3 });
    const isBeta = await betaHeading.isVisible();
    test.skip(!isBeta, "ベータモード（IS_BETA=true）以外ではスキップ");

    await expect(betaHeading).toBeVisible();

    const disabledButton = page.getByRole("button", { name: "正式リリース後に利用可能" });
    await expect(disabledButton).toBeVisible();
    await expect(disabledButton).toBeDisabled();
  });

  test("アカウント削除ボタンが可視でモーダルは非表示", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await waitForData(page);

    const deleteButton = page.getByRole("button", { name: "アカウントを削除する" });
    await expect(deleteButton).toBeVisible();

    // 初期状態では削除確認モーダル（タイトル「アカウントの削除」）は表示されていない
    await expect(page.getByRole("heading", { name: "アカウントの削除" })).toHaveCount(0);
  });
});
