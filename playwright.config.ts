import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const STORAGE_STATE = path.resolve(__dirname, "playwright/.auth/user.json");

export default defineConfig({
  testDir: "src/__tests__/e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/auth\.setup\.ts/, /authed\.spec\.ts$/],
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
      testIgnore: [/auth\.setup\.ts/, /authed\.spec\.ts$/],
    },
    {
      name: "chromium-auth",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      testMatch: /authed\.spec\.ts$/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 3001,
    reuseExistingServer: !process.env.CI,
  },
});
