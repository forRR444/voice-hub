import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// VoiceHub コアフロー E2E（authed・通し）
//
// ユーザーストーリーを 1 test で通しで検証する:
//   3. 認証済みダッシュボードでフォームを新規作成
//   4. ウィジェットを新規作成
//   5. 別ブラウザコンテキスト（未ログイン）から公開フォームに投稿
//   6. 管理画面の「未承認」タブで投稿を確認
//   7. 詳細ページから口コミを承認
//   8. /preview/{widgetId} で承認済み口コミがレンダリングされる
//   9. 外部サイトに embed.js を貼った状態で marker が描画される
//
// 1-2 (signup / onboarding) は auth.setup.ts でカバー済み。
// API レスポンスは { ok: true, data: ... } 形に統一されているため、
// JSON parse は body.data.* を読む。
// ---------------------------------------------------------------------------

type ApiSuccess<T> = { ok: true; data: T };
type ApiResponseUnknown = { ok?: unknown; data?: unknown; id?: unknown; slug?: unknown };

function isApiSuccess<T>(json: unknown): json is ApiSuccess<T> {
  if (typeof json !== "object" || json === null) return false;
  const candidate: ApiResponseUnknown = json;
  return candidate.ok === true && typeof candidate.data === "object" && candidate.data !== null;
}

function readId(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const candidate: { id?: unknown } = data;
  return typeof candidate.id === "string" ? candidate.id : null;
}

function readSlug(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const candidate: { slug?: unknown } = data;
  return typeof candidate.slug === "string" ? candidate.slug : null;
}

function uniqueSlug(workerIndex: number) {
  // 英小文字・数字・ハイフンのみ（formCreateSchema の regex 要件）
  return `e2e-core-${workerIndex}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`.toLowerCase();
}

test.describe("コアフロー E2E（認証済み・通し）", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  let createdFormId: string | null = null;
  let createdFormSlug: string | null = null;
  let createdWidgetId: string | null = null;
  let createdTestimonialId: string | null = null;

  test("ユーザージャーニー: フォーム作成 → 投稿 → 承認 → embed 描画", async ({
    page,
    request,
    browser,
  }) => {
    const workerIndex = test.info().workerIndex;
    const marker = `E2E_CORE_${workerIndex}_${Date.now()}`;
    const formTitle = `E2E Core Form ${workerIndex}-${Date.now()}`;
    const widgetName = `E2E Core Widget ${workerIndex}-${Date.now()}`;
    const reviewerName = `E2E Reviewer ${workerIndex}`;
    // 公開フォームの content ステップに含めるテキスト
    const reviewBody = `${marker} VoiceHub のコアフロー検証で投稿された口コミです。`;

    await test.step("Step 3: フォームを新規作成（API 経由 + UI 確認）", async () => {
      // UI のテンプレートモーダルからの作成は forms-crud-authed.spec.ts でカバー済み。
      // ここではコアフローを安定的に通すため API を用いて確実に作成する。
      const slug = uniqueSlug(workerIndex);
      const res = await request.post("/api/forms", {
        data: {
          slug,
          title: formTitle,
          description: "E2E core journey",
          brand_color: "#6366F1",
          thank_you_message: "ありがとうございました",
          questions: [
            { id: "rating", label: "満足度", type: "star_rating", required: true },
            {
              id: "content",
              label: "感想",
              type: "textarea",
              required: true,
              placeholder: "自由にお書きください",
            },
          ],
        },
      });
      expect(res.ok(), `POST /api/forms failed: ${res.status()} ${await res.text()}`).toBe(true);

      const json: unknown = await res.json();
      if (!isApiSuccess<unknown>(json)) {
        throw new Error(`Unexpected /api/forms response shape: ${JSON.stringify(json)}`);
      }
      const id = readId(json.data);
      const fetchedSlug = readSlug(json.data);
      expect(id).not.toBeNull();
      expect(fetchedSlug).not.toBeNull();
      createdFormId = id;
      createdFormSlug = fetchedSlug;

      // ダッシュボードに戻ってカードが表示されていることを UI で確認
      await page.goto("/dashboard/forms");
      await expect(
        page.locator("h3", { hasText: formTitle })
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Step 4: ウィジェットを新規作成（UI 経由）", async () => {
      await page.goto("/dashboard/widgets");
      const openBtn = page.getByRole("button", { name: "新しいウィジェット" });
      const canCreate = await openBtn.isEnabled().catch(() => false);
      test.skip(!canCreate, "プラン上限のためウィジェット作成不可");

      await openBtn.click();
      await expect(
        page.getByRole("heading", { name: "新しいウィジェット作成" })
      ).toBeVisible();
      await page.getByPlaceholder("メインページ用").fill(widgetName);

      const [response] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().endsWith("/api/widgets") &&
            res.request().method() === "POST" &&
            res.ok(),
          { timeout: 15_000 }
        ),
        page.getByRole("button", { name: "作成する" }).click(),
      ]);
      const json: unknown = await response.json();
      if (!isApiSuccess<unknown>(json)) {
        throw new Error(`Unexpected /api/widgets response shape: ${JSON.stringify(json)}`);
      }
      const id = readId(json.data);
      expect(id).not.toBeNull();
      createdWidgetId = id;

      await expect(page.locator("h3", { hasText: widgetName })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("Step 5: 公開フォームに別ブラウザコンテキストで投稿", async () => {
      expect(createdFormSlug).not.toBeNull();

      const publicCtx = await browser.newContext({ storageState: undefined });
      const publicPage = await publicCtx.newPage();
      try {
        await publicPage.goto(`/form/${createdFormSlug}`, { waitUntil: "networkidle" });

        // ステップ 1: 星評価
        const star5 = publicPage.locator('[aria-label="5つ星"]');
        await expect(star5).toBeVisible({ timeout: 10_000 });
        await star5.click();
        await publicPage.getByRole("button", { name: /次へ/ }).click();

        // ステップ 2: content（最終ステップ。「送信する」が出る）
        const contentInput = publicPage.locator("textarea");
        await expect(contentInput).toBeVisible({ timeout: 10_000 });
        await contentInput.fill(reviewBody);

        // POST /api/testimonials のレスポンスを捕捉してハッピーパス成功を検証
        const [submitRes] = await Promise.all([
          publicPage.waitForResponse(
            (res) =>
              res.url().endsWith("/api/testimonials") &&
              res.request().method() === "POST",
            { timeout: 15_000 }
          ),
          publicPage.getByRole("button", { name: "送信する" }).click(),
        ]);
        expect(
          submitRes.ok(),
          `POST /api/testimonials failed: ${submitRes.status()} ${await submitRes.text()}`
        ).toBe(true);

        // サンクス画面
        await expect(publicPage.getByText("ありがとうございます")).toBeVisible({
          timeout: 15_000,
        });
      } finally {
        await publicCtx.close();
      }

      // 別途、レビュアー名は管理画面側で content から marker で特定するので
      // ここでは form-client の name フィールドを送らないが、permission_granted が
      // 必須のため form-client が自動付与する false で進行する（zod は boolean を許容）。
      void reviewerName;
    });

    await test.step("Step 6: 管理画面の未承認タブで投稿を確認", async () => {
      await page.goto("/dashboard");
      // 「未承認」タブをクリック
      await page.getByRole("button", { name: "未承認" }).click();

      // 検索でフィルタして並列実行に強くする
      const searchInput = page.getByPlaceholder("検索...");
      await expect(searchInput).toBeVisible({ timeout: 10_000 });
      await searchInput.fill(marker);

      const row = page.locator(".group.py-5").filter({ hasText: marker }).first();
      await expect(row).toBeVisible({ timeout: 10_000 });
    });

    await test.step("Step 7: 口コミを承認（詳細ページから）", async () => {
      // 直前に検索でフィルタ済みなので、最初の row → 詳細リンクへ
      const row = page.locator(".group.py-5").filter({ hasText: marker }).first();
      await row.locator('a[href^="/dashboard/"]').first().click();
      await expect(page).toHaveURL(/\/dashboard\/[0-9a-fA-F-]+$/);

      // URL から testimonial id を捕捉（afterAll でのクリーンアップ用）
      const url = page.url();
      const match = url.match(/\/dashboard\/([0-9a-fA-F-]+)$/);
      if (match) createdTestimonialId = match[1];

      // 詳細ページの「承認済み」ボタンをクリック
      const approvedBtn = page.getByRole("button", { name: "承認済み" });
      await expect(approvedBtn).toBeVisible({ timeout: 10_000 });
      await approvedBtn.click();

      // クリック直後にクラスが変化（active な状態 = bg-foreground/5）するのを待つ
      await expect(approvedBtn).toHaveClass(/bg-foreground\/5/, { timeout: 10_000 });
    });

    await test.step("Step 8: /preview/{widgetId} で承認済み口コミが描画", async () => {
      expect(createdWidgetId).not.toBeNull();
      await page.goto(`/preview/${createdWidgetId}`, { waitUntil: "networkidle" });

      // marker テキストがプレビュー DOM 上に出現すれば承認済み口コミがウィジェットに乗ったことを意味する
      await expect(page.getByText(marker, { exact: false })).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("Step 9: 外部サイトに embed.js を貼った状態を再現", async () => {
      expect(createdWidgetId).not.toBeNull();
      const widgetId = createdWidgetId ?? "";

      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body>
            <h1>External Site</h1>
            <script src="http://localhost:3001/widget/v1/embed.js" defer></script>
            <div data-testimonial-widget="${widgetId}" data-theme="light"></div>
          </body>
        </html>
      `);

      // Shadow DOM 内に marker のテキストノードが現れるまで待つ
      await page.waitForFunction(
        ({ id, needle }) => {
          const host = document.querySelector(`[data-testimonial-widget="${id}"]`);
          if (!host || !host.shadowRoot) return false;
          const text = host.shadowRoot.textContent ?? "";
          return text.includes(needle);
        },
        { id: widgetId, needle: marker },
        { timeout: 15_000 }
      );
    });
  });

  test.afterAll(async ({ request }) => {
    // 後片付け: 依存順に削除（testimonial → widget → form）
    if (createdTestimonialId) {
      await request
        .delete("/api/testimonials", { data: { id: createdTestimonialId } })
        .catch(() => undefined);
    }
    if (createdWidgetId) {
      await request
        .delete("/api/widgets", { data: { id: createdWidgetId } })
        .catch(() => undefined);
    }
    if (createdFormId) {
      await request
        .delete("/api/forms", { data: { id: createdFormId } })
        .catch(() => undefined);
    }
  });
});
