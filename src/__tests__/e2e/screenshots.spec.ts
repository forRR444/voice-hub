import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS_BASE = path.resolve("screenshots");

function getVersionDir(): string {
  if (!fs.existsSync(SCREENSHOTS_BASE)) {
    fs.mkdirSync(SCREENSHOTS_BASE, { recursive: true });
  }
  const existing = fs
    .readdirSync(SCREENSHOTS_BASE)
    .filter((d) => /^v\d+$/.test(d))
    .map((d) => parseInt(d.slice(1), 10))
    .sort((a, b) => a - b);
  const next = existing.length > 0 ? existing[existing.length - 1] + 1 : 1;
  return `v${next}`;
}

// Compute once per run
const VERSION_DIR = getVersionDir();

function screenshotPath(projectName: string, pageName: string): string {
  const folder = projectName === "mobile" ? "mobile" : "desktop";
  const dir = path.join(SCREENSHOTS_BASE, VERSION_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${pageName}.png`);
}

function shot(testInfo: any, name: string) {
  return screenshotPath(testInfo.project.name, name);
}

// ---------------------------------------------------------------------------
// Public pages (no auth)
// ---------------------------------------------------------------------------
test.describe("Screenshots – public pages", () => {
  test("landing", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "landing"), fullPage: true });
  });

  test("login", async ({ page }, testInfo) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "login"), fullPage: true });
  });

  test("signup", async ({ page }, testInfo) => {
    await page.goto("/signup", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "signup"), fullPage: true });
  });

  test("reset-password", async ({ page }, testInfo) => {
    await page.goto("/reset-password", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "reset-password"), fullPage: true });
  });
});

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------
const AUTH_STATE_PATH = path.resolve("test-results/.auth-state.json");

async function ensureLoggedIn(page: any) {
  if (fs.existsSync(AUTH_STATE_PATH)) {
    await page.context().addCookies(JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8")));
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    if (!page.url().includes("/login")) return;
  }

  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD env vars are required");
  }

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 });

  const cookies = await page.context().cookies();
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(cookies));
}

// ---------------------------------------------------------------------------
// Dashboard – page screenshots
// ---------------------------------------------------------------------------
test.describe("Screenshots – dashboard pages", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("dashboard", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "dashboard"), fullPage: true });
  });

  test("dashboard-forms", async ({ page }, testInfo) => {
    await page.goto("/dashboard/forms", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "dashboard-forms"), fullPage: true });
  });

  test("dashboard-widgets", async ({ page }, testInfo) => {
    await page.goto("/dashboard/widgets", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "dashboard-widgets"), fullPage: true });
  });

  test("dashboard-sns", async ({ page }, testInfo) => {
    await page.goto("/dashboard/sns", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "dashboard-sns"), fullPage: true });
  });

  test("dashboard-settings", async ({ page }, testInfo) => {
    await page.goto("/dashboard/settings", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "dashboard-settings"), fullPage: true });
  });
});

// ---------------------------------------------------------------------------
// Dashboard – modals & interactive states
// ---------------------------------------------------------------------------
test.describe("Screenshots – dashboard modals", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ─── Dashboard page modals ───
  test("dashboard-add-menu", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.getByText("追加").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(testInfo, "dashboard-add-menu") });
  });

  test("dashboard-add-testimonial-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.getByText("追加").click();
    await page.getByText("手動で追加").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(testInfo, "dashboard-add-testimonial-modal") });
  });

  test("dashboard-google-import-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.getByText("追加").click();
    await page.getByText("Google口コミをインポート").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(testInfo, "dashboard-google-import-modal") });
  });

  test("dashboard-status-dropdown", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    // Click the first status pill (check/dot/x icon with chevron)
    const statusPill = page
      .locator("[class*=rounded-full][class*=cursor-pointer]")
      .filter({ has: page.locator("svg") })
      .first();
    if (await statusPill.isVisible()) {
      await statusPill.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "dashboard-status-dropdown") });
    }
  });

  test("dashboard-filter-approved", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const tab = page.getByText("承認済み", { exact: true }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "dashboard-filter-approved"), fullPage: true });
    }
  });

  test("dashboard-filter-rejected", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const tab = page.getByText("非承認", { exact: true }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "dashboard-filter-rejected"), fullPage: true });
    }
  });

  test("dashboard-filter-pending", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const tab = page.getByText("未承認", { exact: true }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "dashboard-filter-pending"), fullPage: true });
    }
  });

  // ─── Forms page modals ───
  test("forms-create-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard/forms", { waitUntil: "networkidle" });
    const addBtn = page.getByText("追加").or(page.getByText("新しいフォーム"));
    const btn = addBtn.first();
    if ((await btn.isVisible()) && (await btn.isEnabled())) {
      await btn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "forms-create-modal") });
    }
  });

  test("forms-qr-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard/forms", { waitUntil: "networkidle" });
    const qrBtn = page.getByText("QRコード").first();
    if (await qrBtn.isVisible()) {
      await qrBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "forms-qr-modal") });
    }
  });

  test("forms-edit-mode", async ({ page }, testInfo) => {
    await page.goto("/dashboard/forms", { waitUntil: "networkidle" });
    const editBtn = page.getByText("質問内容を確認").first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "forms-edit-mode"), fullPage: true });
    }
  });

  // ─── Widgets page modals ───
  test("widgets-create-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard/widgets", { waitUntil: "networkidle" });
    const addBtn = page.getByText("追加").or(page.getByText("新しいウィジェット"));
    if (await addBtn.first().isVisible()) {
      await addBtn.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "widgets-create-modal"), fullPage: true });
    }
  });

  test("widgets-embed-code", async ({ page }, testInfo) => {
    await page.goto("/dashboard/widgets", { waitUntil: "networkidle" });
    const embedBtn = page.getByText("埋め込みコードを表示").first();
    if (await embedBtn.isVisible()) {
      await embedBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "widgets-embed-code"), fullPage: true });
    }
  });

  test("widgets-page", async ({ page }, testInfo) => {
    await page.goto("/dashboard/widgets", { waitUntil: "networkidle" });
    await page.screenshot({ path: shot(testInfo, "widgets-page"), fullPage: true });
  });

  // ─── SNS page modals ───
  test("sns-template-dropdown", async ({ page }, testInfo) => {
    await page.goto("/dashboard/sns", { waitUntil: "networkidle" });
    const templateBtn = page.getByText("Instagram ストーリー").first();
    if (await templateBtn.isVisible()) {
      await templateBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "sns-template-dropdown") });
    }
  });

  test("sns-card-selected", async ({ page }, testInfo) => {
    await page.goto("/dashboard/sns", { waitUntil: "networkidle" });
    // Click first testimonial card to select it
    const card = page.locator("[class*=cursor-pointer][class*=rounded-lg]").first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "sns-card-selected"), fullPage: true });
    }
  });

  test("sns-all-selected", async ({ page }, testInfo) => {
    await page.goto("/dashboard/sns", { waitUntil: "networkidle" });
    const selectAll = page.getByText("すべて選択");
    if (await selectAll.isVisible()) {
      await selectAll.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "sns-all-selected"), fullPage: true });
    }
  });

  // ─── Settings page states ───
  test("settings-delete-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard/settings", { waitUntil: "networkidle" });
    const deleteBtn = page.getByText("アカウントを削除する");
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "settings-delete-modal") });
    }
  });
});

// ---------------------------------------------------------------------------
// Mobile sidebar
// ---------------------------------------------------------------------------
test.describe("Screenshots – mobile sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("mobile-sidebar-open", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile") return;
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const hamburger = page.locator("button[aria-label='メニューを開く']");
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(testInfo, "mobile-sidebar-open") });
    }
  });
});

// ---------------------------------------------------------------------------
// Testimonial detail page
// ---------------------------------------------------------------------------
test.describe("Screenshots – testimonial detail", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("detail-page", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    // Click the first testimonial name link
    const nameLink = page
      .locator("a[href^='/dashboard/']")
      .filter({ hasNotText: /フォーム|ウィジェット|設定|SNS|お客様の声に戻る/ })
      .first();
    if (await nameLink.isVisible()) {
      await nameLink.click();
      await page.waitForURL(/\/dashboard\/.+/, { timeout: 10_000 });
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: shot(testInfo, "detail-page"), fullPage: true });
    }
  });

  test("detail-sns-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const nameLink = page
      .locator("a[href^='/dashboard/']")
      .filter({ hasNotText: /フォーム|ウィジェット|設定|SNS|お客様の声に戻る/ })
      .first();
    if (await nameLink.isVisible()) {
      await nameLink.click();
      await page.waitForURL(/\/dashboard\/.+/, { timeout: 10_000 });
      await page.waitForLoadState("networkidle");
      const snsBtn = page.getByText("SNS画像");
      if (await snsBtn.isVisible()) {
        await snsBtn.click();
        await page.waitForTimeout(1000); // wait for image generation
        await page.screenshot({ path: shot(testInfo, "detail-sns-modal") });
      }
    }
  });

  test("detail-delete-modal", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const nameLink = page
      .locator("a[href^='/dashboard/']")
      .filter({ hasNotText: /フォーム|ウィジェット|設定|SNS|お客様の声に戻る/ })
      .first();
    if (await nameLink.isVisible()) {
      await nameLink.click();
      await page.waitForURL(/\/dashboard\/.+/, { timeout: 10_000 });
      await page.waitForLoadState("networkidle");
      const deleteBtn = page.locator("button[title='削除']");
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: shot(testInfo, "detail-delete-modal") });
      }
    }
  });
});
