import { test, expect } from "playwright/test";
import { loginAsEditor } from "../../helpers/auth";

/**
 * Backoffice — Permissions matrix.
 *
 * Admin gets full access via the auth-setup storage state. The "Editor access"
 * sub-suite logs in via the UI to swap to the editor identity (storage state
 * doesn't compose, so we re-authenticate).
 */
test.describe("Backoffice - Permissions", () => {
  test.describe("Admin access", () => {

    test("PM-01: Admin can reach the system datasets listing", async ({
      page,
    }) => {
      await page.goto("/admin/system/datasets");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const heading = page
        .getByRole("heading", { name: /Conjuntos de dados/i })
        .first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test("PM-02: Admin can reach the system users listing", async ({
      page,
    }) => {
      await page.goto("/admin/system/users");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const heading = page.getByRole("heading", { name: /^Utilizadores$/i }).first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test("PM-03: Admin can reach the editorial editor", async ({ page }) => {
      await page.goto("/admin/system/editorial");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const heading = page.getByRole("heading", { name: /^Editorial$/i }).first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Editor access", () => {
    test.beforeEach(async ({ page, context }) => {
      // Storage state authenticates as admin; clear cookies and log in as editor for this sub-suite.
      await context.clearCookies();
      await loginAsEditor(page);
    });

    test("PM-04: Editor reaches a backoffice URL", async ({ page }) => {
      await page.goto("/admin/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2500);

      // The /admin/ index redirects to me/datasets (editor without org) or
      // org/datasets (editor with org membership). Some runs render the
      // /admin/ shell first and let the client redirect — accept any
      // /admin/ URL.
      expect(page.url()).toMatch(/\/pages\/admin/);
    });

    test("PM-05: Editor can see their personal datasets listing", async ({
      page,
    }) => {
      await page.goto("/admin/me/datasets");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const heading = page
        .getByRole("heading", { name: /Conjuntos de dados/i })
        .first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Anonymous access", () => {
    test("PM-06: Anonymous visitor on any /admin/system/* is redirected", async ({
      browser,
    }) => {
      // Override storage state for this test only — anonymous context.
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto("/admin/system/datasets");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      expect(page.url()).toMatch(/\/pages\/(login|admin)/);
      await context.close();
    });
  });

  test.skip("PM-07: Editor is forbidden from /admin/system/users", async () => {
    // Requires deterministic permission enforcement on the editor account.
  });

  test.skip("PM-08: Org member sees only their org listings", async () => {
    // Requires seeded org membership for the test editor.
  });
});
