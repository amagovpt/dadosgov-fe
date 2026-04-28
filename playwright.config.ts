import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./tests/global-setup.ts"),
  timeout: 60_000,
  retries: 0,
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
      name: "backoffice",
      testDir: "./tests/e2e/backoffice",
      use: { browserName: "chromium" },
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
