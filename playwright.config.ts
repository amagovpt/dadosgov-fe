import { defineConfig } from "playwright/test";

/**
 * Playwright stack
 *
 * The non-disposable side runs against the dev frontend (port 3000) which
 * proxies to the dev backend (port 7000). Tests in this stack must NOT
 * mutate persistent records (the dev DB is shared with manual exploration).
 *
 *   • frontend-public   — anonymous suite against /pages/*
 *   • auth-setup        — logs in once and writes storage state
 *   • backoffice        — non-destructive admin pages (uses storage state)
 *
 * The disposable side runs against a dedicated test backend (port 7001)
 * wired to MongoDB on 27018 + Redis on 6380 (docker-compose.test.yml). The
 * test frontend (port 3001) must be started with BACKEND_URL=http://127.0.0.1:7001.
 *
 *   • auth-setup-disposable    — logs into the test backend, writes its own state
 *   • backoffice-disposable    — destructive CRUD tests; safe to delete records
 *
 * See backend/scripts/test_db.sh + start_test_backend.sh for how the test
 * stack boots; tests/global-setup.ts brings them up before the run.
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./tests/global-setup.ts"),
  globalTeardown: require.resolve("./tests/global-teardown.ts"),
  timeout: 60_000,
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
      // Vulnerability regression suite. Runs against the dev stack
      // (port 3000) and depends on `auth-setup` so the authenticated specs
      // (04-xss-backend, 05-rate-limit) inherit the admin session cookies
      // — udata's /api/1 blueprint is `csrf.exempt`, so a session cookie
      // is all that's needed for POST/DELETE.
      // Run alone via:
      //   npx playwright test --project=frontend-vulnerabilities
      //   npm run test:e2e:vulns
      // Anonymous specs (01-xss-stored on the seeded fixtures, 02-headers,
      // 03-ssrf) ignore the storage state and still work.
      name: "frontend-vulnerabilities",
      testDir: "./tests/e2e/frontend-vulnerabilities",
      dependencies: ["auth-setup"],
      use: {
        browserName: "chromium",
        storageState: "tests/.auth/admin.json",
      },
    },
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "backoffice",
      testDir: "./tests/e2e/backoffice",
      testIgnore: ["**/disposable/**"],
      dependencies: ["auth-setup"],
      use: {
        browserName: "chromium",
        storageState: "tests/.auth/admin.json",
      },
    },
    {
      // Auth setup against the disposable test backend.
      name: "auth-setup-disposable",
      testMatch: /auth\.setup\.disposable\.ts/,
      use: { baseURL: "http://localhost:3001" },
    },
    {
      // Destructive CRUD scenarios run here. A separate Next.js dev server on
      // port 3001 (BACKEND_URL=http://127.0.0.1:7001) proxies to the test
      // backend so deletes/edits cannot leak into the dev DB.
      name: "backoffice-disposable",
      testDir: "./tests/e2e/backoffice/disposable",
      dependencies: ["auth-setup-disposable"],
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:3001",
        storageState: "tests/.auth/admin.disposable.json",
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
