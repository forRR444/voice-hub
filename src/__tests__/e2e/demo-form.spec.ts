import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// デモフォームページ E2Eテスト
// ---------------------------------------------------------------------------

test.describe("デモフォームページ (/form/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/form/demo", { waitUntil: "networkidle" });
  });

  // ============================
  // 表示
  // ============================
  test.describe("表示", () => {
    test("ページタイトルに「田中コーチングサロン」「デモ」を含む", async ({ page }) => {
      await expect(page).toHaveTitle(/田中コーチングサロン.*デモ/);
    });

    test("h1に「田中コーチングサロン」が表示される", async ({ page }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "田中コーチングサロン" })
      ).toBeVisible();
    });

    test("descriptionが表示される", async ({ page }) => {
      await expect(
        page.getByText(
          "ご利用いただきありがとうございます。ぜひご感想をお聞かせください。"
        )
      ).toBeVisible();
    });

    test("ステップインジケーター「1 / 7」が表示される", async ({ page }) => {
      await expect(page.getByText(/1 \/ 7/)).toBeVisible();
    });

    test("Powered by VoiceHubが表示される", async ({ page }) => {
      await expect(page.getByText("Powered by")).toBeVisible();
      // 初期画面でも Powered by の「VoiceHub」リンクが複数存在する可能性があるため first() でスコープ
      await expect(
        page.getByRole("link", { name: "VoiceHub" }).first()
      ).toBeVisible();
    });

    test("demo固有の「スキップ →」ボタンが表示される", async ({ page }) => {
      await expect(page.getByRole("button", { name: "スキップ →" })).toBeVisible();
    });
  });

  // ============================
  // デモモードの挙動
  // ============================
  test.describe("デモモードの挙動", () => {
    test("必須星評価を選ばなくても次へボタンが有効", async ({ page }) => {
      // ボタンラベルは「次へ →」（矢印付き）
      await expect(page.getByRole("button", { name: /^次へ/ })).toBeEnabled();
    });

    test("全ステップを完了してもAPI/Supabase送信が発生しない", async ({ page }) => {
      test.setTimeout(60000);

      const submissionCalls: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("/api/") || url.includes("supabase.co")) {
          submissionCalls.push(url);
        }
      });

      // ステップ1-6: 入力せず「次へ」を6回クリック（demo時は必須でも遷移可能）
      for (let i = 0; i < 6; i++) {
        await page.getByRole("button", { name: /^次へ/ }).click();
      }

      // ステップ7: 送信
      await page.getByRole("button", { name: "送信する" }).click();

      // サンクスメッセージ表示を確認
      await expect(
        page.getByText(
          "ご回答ありがとうございました！これはデモフォームです。実際のデータは送信されていません。"
        )
      ).toBeVisible({ timeout: 10000 });

      // 外部送信が発生していないことを検証
      expect(submissionCalls).toHaveLength(0);
    });

    test("サンクスページに「VoiceHubのトップに戻る」リンクが表示される", async ({ page }) => {
      test.setTimeout(60000);

      for (let i = 0; i < 6; i++) {
        await page.getByRole("button", { name: /^次へ/ }).click();
      }
      await page.getByRole("button", { name: "送信する" }).click();

      const backLink = page.getByRole("link", {
        name: "VoiceHubのトップに戻る",
      });
      await expect(backLink).toBeVisible({ timeout: 10000 });
      await expect(backLink).toHaveAttribute("href", "/");
    });
  });
});
