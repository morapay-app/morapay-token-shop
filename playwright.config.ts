import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Pixel 5",
      use: {
        browserName: "chromium",
        ...devices["Pixel 5"],
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "iPhone 13",
      use: {
        browserName: "chromium",
        viewport: devices["iPhone 13"].viewport,
        userAgent: devices["iPhone 13"].userAgent,
        deviceScaleFactor: devices["iPhone 13"].deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `bash scripts/prep-e2e.sh && PORT=${port} HOSTNAME=127.0.0.1 node .next/standalone/server.js`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
