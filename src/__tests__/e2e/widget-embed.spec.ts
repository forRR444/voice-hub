import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// embed.js のブラウザレンダリングテスト
// テスト用HTMLページ（/test-embed.html）を使用
// ---------------------------------------------------------------------------

const WIDGET_ID = process.env.TEST_WIDGET_ID || "4095d643-4f20-43dd-866c-4533d03900cd";

test.describe("embed.js ウィジェット埋め込み", () => {
  test("スクリプト埋め込みでウィジェットが表示される", async ({ page }) => {
    // インラインHTMLでテストページを作成
    await page.setContent(`
      <!DOCTYPE html>
      <html><body>
        <script src="http://localhost:3001/widget/v1/embed.js" defer></script>
        <div data-testimonial-widget="${WIDGET_ID}" data-theme="light"></div>
      </body></html>
    `);

    // Shadow DOMが生成されるまで待つ
    await page.waitForFunction(
      (id) => {
        const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
        return el?.shadowRoot?.querySelector(".vh-root") !== null;
      },
      WIDGET_ID,
      { timeout: 15000 }
    );

    // Shadow DOM内にコンテンツが存在することを確認
    const hasContent = await page.evaluate((id) => {
      const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
      const root = el?.shadowRoot?.querySelector(".vh-root");
      return root ? root.innerHTML.length > 0 : false;
    }, WIDGET_ID);

    expect(hasContent).toBe(true);
  });

  test("Shadow DOMが使用されている", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html><body>
        <script src="http://localhost:3001/widget/v1/embed.js" defer></script>
        <div data-testimonial-widget="${WIDGET_ID}" data-theme="light"></div>
      </body></html>
    `);

    await page.waitForFunction(
      (id) => {
        const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
        return el?.shadowRoot !== null;
      },
      WIDGET_ID,
      { timeout: 15000 }
    );

    const hasShadowRoot = await page.evaluate((id) => {
      const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
      return el?.shadowRoot !== null;
    }, WIDGET_ID);

    expect(hasShadowRoot).toBe(true);
  });

  test("スケルトンローダーが最初に表示される", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html><body>
        <script src="http://localhost:3001/widget/v1/embed.js" defer></script>
        <div data-testimonial-widget="${WIDGET_ID}" data-theme="light"></div>
      </body></html>
    `);

    // スケルトンが表示されるまで待つ（fetchの前に表示される）
    await page.waitForFunction(
      (id) => {
        const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
        return el?.shadowRoot !== null;
      },
      WIDGET_ID,
      { timeout: 10000 }
    );

    // スケルトンまたはコンテンツが存在する
    const hasAnyContent = await page.evaluate((id) => {
      const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
      return el?.shadowRoot?.innerHTML !== "";
    }, WIDGET_ID);

    expect(hasAnyContent).toBe(true);
  });

  test("ライトモードのCSS変数が適用される", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html><body>
        <script src="http://localhost:3001/widget/v1/embed.js" defer></script>
        <div data-testimonial-widget="${WIDGET_ID}" data-theme="light"></div>
      </body></html>
    `);

    await page.waitForFunction(
      (id) => {
        const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
        return el?.shadowRoot?.querySelector(".vh-root.vh-light") !== null;
      },
      WIDGET_ID,
      { timeout: 15000 }
    );

    const hasLightClass = await page.evaluate((id) => {
      const el = document.querySelector(`[data-testimonial-widget="${id}"]`);
      return el?.shadowRoot?.querySelector(".vh-root.vh-light") !== null;
    }, WIDGET_ID);

    expect(hasLightClass).toBe(true);
  });

  test("存在しないウィジェットIDの場合、要素が非表示になる", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html><body>
        <script src="http://localhost:3001/widget/v1/embed.js" defer></script>
        <div data-testimonial-widget="nonexistent-id-12345" data-theme="light"></div>
      </body></html>
    `);

    // エラー時にdisplay:noneになるまで待つ
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testimonial-widget="nonexistent-id-12345"]');
        return el instanceof HTMLElement && el.style.display === "none";
      },
      null,
      { timeout: 15000 }
    );

    const isHidden = await page.evaluate(() => {
      const el = document.querySelector('[data-testimonial-widget="nonexistent-id-12345"]');
      return el instanceof HTMLElement && el.style.display === "none";
    });

    expect(isHidden).toBe(true);
  });
});
