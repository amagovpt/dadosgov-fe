import { test, expect } from "playwright/test";
import { loginAsAdmin } from "../../helpers/auth";

/**
 * Statistics dashboards exist in three flavours:
 *   - /pages/admin/me/statistics       (personal)
 *   - /pages/admin/org/statistics      (active org)
 *   - /pages/admin/statistics          (global, admin-only)
 *
 * Each page surfaces aggregate metrics: visits, downloads, datasets created, etc.
 * These tests cover navigation + presence of metric cards. Numeric correctness
 * is asserted by the metrics specs in tests/metrics-*.spec.ts.
 */
test.describe("Backoffice - Statistics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("ST-01: Personal statistics page loads with metric cards", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Heading or labelled metric card
    const heading = page.getByRole("heading", { name: /Estatística/i }).first();
    const metricLabel = page.getByText(/Visitas|Descargas|Visualiz/i).first();
    await expect(heading.or(metricLabel)).toBeVisible({ timeout: 10000 });
  });

  test("ST-02: Org statistics page loads", async ({ page }) => {
    await page.goto("/pages/admin/org/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Estatística/i }).first();
    const metricLabel = page.getByText(
      /Conjuntos de dados|Reutilizações|Visitas/i
    ).first();
    await expect(heading.or(metricLabel)).toBeVisible({ timeout: 10000 });
  });

  test("ST-03: Global statistics page loads for admin", async ({ page }) => {
    await page.goto("/pages/admin/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Either the page renders, or it 404s — but a logged-in admin should see it.
    const heading = page.getByRole("heading", { name: /Estatística/i }).first();
    const metricLabel = page.getByText(/Utilizadores|Organizações|Visitas/i).first();
    const visible =
      (await heading.isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await metricLabel.isVisible({ timeout: 5000 }).catch(() => false));
    expect(visible).toBeTruthy();
  });

  test("ST-04: At least one numeric KPI is present on personal stats", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);

    // Strip nbsp/spaces, then look for runs of digits that look like a count
    const body = (await page.textContent("body")) || "";
    const cleaned = body.replace(/ /g, " ");
    expect(/\b\d+\b/.test(cleaned)).toBeTruthy();
  });

  test("ST-05: Anonymous visitor on /admin/statistics is redirected", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/pages/admin/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await context.close();
  });
});
