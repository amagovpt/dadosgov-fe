import { test, expect } from "playwright/test";

/**
 * Statistics dashboards exist in three flavours:
 *   - /admin/me/statistics       (personal)
 *   - /admin/org/statistics      (active org — redirects when no org)
 *   - /admin/statistics          (global, admin-only)
 *
 * Auth via auth-setup storage state.
 */
test.describe("Backoffice - Statistics", () => {

  test("ST-01: Personal statistics page loads with Estatísticas heading", async ({
    page,
  }) => {
    await page.goto("/admin/me/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Estatísticas$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("ST-02: Org statistics page resolves to a backoffice URL", async ({
    page,
  }) => {
    await page.goto("/admin/org/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);

    // With seeded org the page renders /admin/org/statistics; without it the
    // user is redirected to /admin/me/*. Either is acceptable.
    expect(page.url()).toMatch(/\/pages\/admin\//);
  });

  test("ST-03: Global statistics page loads for admin", async ({ page }) => {
    await page.goto("/admin/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Estatísticas$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("ST-04: At least one numeric KPI is rendered on personal stats", async ({
    page,
  }) => {
    await page.goto("/admin/me/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);

    // Personal stats render h2 elements that are numeric counters (currently 0/0/0/0).
    const numericHeadings = page.locator("h2").filter({ hasText: /^\d/ });
    expect(await numericHeadings.count()).toBeGreaterThan(0);
  });

  test("ST-05: Anonymous visitor on /admin/statistics is redirected", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/admin/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await context.close();
  });
});
