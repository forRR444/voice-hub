import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.resolve(__dirname, "../../../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_USER_EMAIL / E2E_USER_PASSWORD が .env.local に未設定です");
  }

  await page.goto("/login");
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();

  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});
