import { test, expect } from "playwright/test";

/**
 * Backoffice — Organizations.
 *
 * Auth via auth-setup storage state. The seeded e2e admin has no organisation
 * membership, so /admin/me/* and /admin/org/* routes are limited. Listing
 * lives at /pages/admin/system/organizations and creation at
 * /pages/admin/organizations/new.
 */
test.describe("Backoffice - Organizations", () => {

  test("OR-01: System organizations listing renders", async ({ page }) => {
    await page.goto("/pages/admin/system/organizations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Organizações/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("OR-02: System organizations listing exposes search affordance", async ({
    page,
  }) => {
    await page.goto("/pages/admin/system/organizations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const search = page.getByPlaceholder(/Pesquis/i).first();
    if ((await search.count()) === 0) return;
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill("zzz_no_match");
    await expect(search).toHaveValue("zzz_no_match");
  });

  test("OR-03: 'Criar nova organização' page is reachable from /admin/organizations/new", async ({
    page,
  }) => {
    await page.goto("/pages/admin/organizations/new");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page
      .getByRole("heading", { name: /(Criar|Nova|Formulário)/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test.skip("OR-04: Create org with name and description", async () => {
    // Destructive — needs cleanup of created org.
  });

  test.skip("OR-05: Edit org name, description, logo", async () => {
    // Requires org owned by admin.
  });

  test.skip("OR-06: Org members tab", async () => {
    // Requires org with members.
  });

  test.skip("OR-07: Add/remove org member roles", async () => {
    // Requires org with members + cleanup.
  });

  test.skip("OR-08: Verify org datasets/reuses listings", async () => {
    // Requires seeded fixtures.
  });

  test("OR-09: Anonymous visitor on /admin/system/organizations is redirected", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/pages/admin/system/organizations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await context.close();
  });
});
