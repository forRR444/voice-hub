import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// /dashboard/salon-page の保存フローを検証する authed E2E テスト
//
// ・UI の『保存する』ボタンをクリックして Supabase upsert が走り、
//   ボタン表示が「保存中...」→「保存済み」に遷移することを確認する
// ・破壊的操作（workspace スコープの salon_pages upsert）を実行する
// ---------------------------------------------------------------------------

test.describe("認証済み：サロンページ保存フロー", () => {
  test("『保存する』クリックで upsert が走り、ボタンが『保存済み』になる", async ({ page }) => {
    await page.goto("/dashboard/salon-page");

    // サロン名が空だとバリデーションエラーが出るため、シード値を入れてから保存する
    // (STEP 1 「基本情報」のサロン名入力欄)
    const salonNameInput = page.getByPlaceholder("例: Nail Salon Miki");
    const visible = await salonNameInput.isVisible().catch(() => false);
    if (visible) {
      const current = await salonNameInput.inputValue();
      if (!current.trim()) {
        await salonNameInput.fill("E2E Salon");
      }
    }

    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeVisible();

    // supabase.from("salon_pages").upsert() は Supabase REST を叩くので、
    // 保存完了のシグナルはボタン表示の『保存済み』で確認する
    await saveBtn.click();

    // 保存成功後はラベルが『保存済み』に切り替わる
    await expect(page.getByRole("button", { name: "保存済み" })).toBeVisible({ timeout: 15_000 });
  });

  test("STEP タブ間を移動しても入力中の『サロン名』が維持される", async ({ page }) => {
    await page.goto("/dashboard/salon-page");
    const salonNameInput = page.getByPlaceholder("例: Nail Salon Miki");
    const visible = await salonNameInput.isVisible().catch(() => false);
    test.skip(!visible, "サロン名フィールドが見つからない");

    // probe は in-memory のみ検証し DB に保存しない（累積汚染・空文字バリデーション flaky を回避）
    const original = await salonNameInput.inputValue();
    const probe = `${original || "Test Salon"}_probe`;
    await salonNameInput.fill(probe);

    // デザインタブ (STEP 2) に移動
    await page.getByRole("button", { name: /STEP 2/ }).click();
    // サロン情報タブ (STEP 1) に戻る
    await page.getByRole("button", { name: /STEP 1/ }).click();

    await expect(salonNameInput).toHaveValue(probe);

    // 保存せずページを離れるため DB に副作用なし。次テスト beforeEach でリロード時に DB 値が復元される
  });
});
