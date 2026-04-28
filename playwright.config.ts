import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./tests/global-setup.ts"),
  timeout: 60_000,
  // Cap concurrency to keep the Next.js dev server responsive — higher worker
  // counts saturate the JIT compiler and produce flaky timeouts/filter races.
  workers: 2,
  retries: 1,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: "test-results/e2e-results.json",
      },
    ],
  ],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "frontend-public",
      testDir: "./tests/e2e/frontend-public",
      use: { browserName: "chromium" },
    },
    {
      // Auth setup runs once and writes tests/.auth/{admin,editor}.json which
      // the backoffice project consumes via storageState.
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "backoffice",
      testDir: "./tests/e2e/backoffice",
      dependencies: ["auth-setup"],
      use: {
        browserName: "chromium",
        storageState: "tests/.auth/admin.json",
      },
    },
    {
      name: "metrics",
      testMatch: [
        "metrics-downloads.spec.ts",
        "metrics-update.spec.ts",
        "check-download-value.spec.ts",
      ],
      use: { browserName: "chromium" },
    },
  ],
});
