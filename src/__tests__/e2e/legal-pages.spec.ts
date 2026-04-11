import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// 利用規約・プライバシーポリシー E2Eテスト
// ---------------------------------------------------------------------------

test.describe("利用規約ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/terms");
  });

  test("見出しが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "利用規約" }).first()).toBeVisible();
  });

  test("ヘッダーのVoiceHubリンクが/に遷移する", async ({ page }) => {
    const headerLink = page.getByRole("link", { name: "VoiceHub" });
    await expect(headerLink).toHaveAttribute("href", "/");
  });

  test("第1条（適用）が存在する", async ({ page }) => {
    await expect(page.getByText("第1条（適用）")).toBeVisible();
  });

  test("第18条（準拠法・裁判管轄）が存在する", async ({ page }) => {
    await expect(page.getByText("第18条（準拠法・裁判管轄）")).toBeVisible();
  });

  test("最終更新日が表示される", async ({ page }) => {
    await expect(page.getByText("最終更新日: 2026年3月20日")).toBeVisible();
  });
});

test.describe("プライバシーポリシーページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/privacy");
  });

  test("見出しが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "プライバシーポリシー" }).first()).toBeVisible();
  });

  test("ヘッダーのVoiceHubリンクが/に遷移する", async ({ page }) => {
    const headerLink = page.getByRole("link", { name: "VoiceHub" });
    await expect(headerLink).toHaveAttribute("href", "/");
  });

  test("外部サービステーブルにSupabaseがある", async ({ page }) => {
    await expect(page.getByRole("cell", { name: "Supabase" }).first()).toBeVisible();
  });

  test("外部サービステーブルにStripeがある", async ({ page }) => {
    await expect(page.getByRole("cell", { name: "Stripe" }).first()).toBeVisible();
  });

  test("最終更新日が表示される", async ({ page }) => {
    await expect(page.getByText("最終更新日: 2026年3月23日")).toBeVisible();
  });
});

test.describe("サインアップページからのリーガルリンク", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("利用規約リンクがある", async ({ page }) => {
    const termsLink = page.getByRole("link", { name: "利用規約" });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute("href", "/terms");
  });

  test("プライバシーポリシーリンクがある", async ({ page }) => {
    const privacyLink = page.getByRole("link", { name: "プライバシーポリシー" });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute("href", "/privacy");
  });
});
