import { test, expect } from "@playwright/test";

const IS_BETA = process.env.NEXT_PUBLIC_BETA_MODE === "true";

// ---------------------------------------------------------------------------
// 料金プランページ E2Eテスト
// ---------------------------------------------------------------------------

test.describe("料金プランページ (/pricing)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  // ============================
  // 基本表示
  // ============================
  test.describe("基本表示", () => {
    test("H1に「シンプルな料金プラン」が表示される", async ({ page }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "シンプルな料金プラン" })
      ).toBeVisible();
    });

    test("PublicHeaderのVoiceHubリンクが/に遷移する", async ({ page }) => {
      const logoLink = page.getByRole("link", { name: /VoiceHub/ }).first();
      await expect(logoLink).toHaveAttribute("href", "/");
    });

    test("ログインリンクが/loginに遷移する", async ({ page }) => {
      const loginLink = page.getByRole("link", { name: "ログイン" });
      await expect(loginLink).toHaveAttribute("href", "/login");
    });

    test("メタタイトルに「料金プラン」を含む", async ({ page }) => {
      await expect(page).toHaveTitle(/料金プラン/);
    });
  });

  // ============================
  // IS_BETA 分岐（説明文）
  // ============================
  test.describe("IS_BETA 分岐（説明文）", () => {
    test("ベータ時は特別価格の案内が表示される", async ({ page }) => {
      test.skip(!IS_BETA, "ベータモード時のみ検証");
      await expect(
        page.getByText("現在ベータ版につき、全機能を無料で使えます。")
      ).toBeVisible();
      await expect(
        page.getByText("ベータユーザーには正式リリース後も特別価格を適用します。")
      ).toBeVisible();
    });

    test("通常時は標準の案内文が表示される", async ({ page }) => {
      test.skip(IS_BETA, "通常モード時のみ検証");
      await expect(
        page.getByText("あなたのビジネスに合ったプランをお選びください。")
      ).toBeVisible();
    });
  });

  // ============================
  // Freeプランカード
  // ============================
  test.describe("Freeプランカード", () => {
    test("「Freeプラン」のラベルが表示される", async ({ page }) => {
      await expect(page.getByText("Freeプラン")).toBeVisible();
    });

    test("価格「¥0」が表示される", async ({ page }) => {
      await expect(page.getByText("¥0")).toBeVisible();
    });

    test("CTAリンク「無料で始める」が/tryに遷移する", async ({ page }) => {
      // PlanCard のコンテナは div.bg-white.rounded-xl。Freeプラン文言で一意にスコープ
      const freeCard = page.locator("div.bg-white.rounded-xl", {
        hasText: "Freeプラン",
      });
      const cta = freeCard.getByRole("link", { name: "無料で始める" });
      await expect(cta).toHaveAttribute("href", "/try");
    });

    test("「クレジットカード不要」のnoteが表示される", async ({ page }) => {
      await expect(page.getByText("クレジットカード不要")).toBeVisible();
    });
  });

  // ============================
  // Proプランカード
  // ============================
  test.describe("Proプランカード", () => {
    test("「Proプラン」のラベルが表示される", async ({ page }) => {
      await expect(page.getByText("Proプラン")).toBeVisible();
    });

    test("価格「¥1,980」が表示される", async ({ page }) => {
      await expect(page.getByText("¥1,980")).toBeVisible();
    });

    test("「おすすめ」バッジが表示される", async ({ page }) => {
      await expect(page.getByText("おすすめ")).toBeVisible();
    });

    test("CTAリンクのラベルと遷移先がIS_BETAに応じて切り替わる", async ({ page }) => {
      const expected = IS_BETA
        ? { label: "無料で始める", href: "/try" }
        : { label: "Proプランを始める", href: "/signup" };
      // PlanCard のコンテナは div.bg-white.rounded-xl。Proプラン文言で一意にスコープ
      const proCard = page.locator("div.bg-white.rounded-xl", {
        hasText: "Proプラン",
      });
      const cta = proCard.getByRole("link", { name: expected.label });
      await expect(cta).toHaveAttribute("href", expected.href);
    });

    test("noteがIS_BETAに応じて切り替わる", async ({ page }) => {
      const expectedNote = IS_BETA ? "ベータ中は全機能無料" : "いつでもキャンセル可能";
      await expect(page.getByText(expectedNote)).toBeVisible();
    });
  });

  // ============================
  // フッター文言
  // ============================
  test.describe("フッター文言", () => {
    // 通常時の "いつでもキャンセル可能" は Pro note と重複するため本テストでは IS_BETA=true のみ検証
    test("ベータ時はフッターにベータ無料の案内が表示される", async ({ page }) => {
      test.skip(!IS_BETA, "ベータモード時のみ検証");
      await expect(
        page.getByText(
          "いつでもキャンセル可能 · ベータ期間中は全機能無料でご利用いただけます"
        )
      ).toBeVisible();
    });
  });
});
