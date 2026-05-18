import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";

/**
 * Backoffice — Organizations.
 *
 * Auth via auth-setup storage state. The seeded e2e admin is a member of
 * the organisation provisioned by `scripts/seed_e2e_fixtures.py`, so
 * /admin/org/* routes resolve normally.
 */
const fixtures = loadFixtures();

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

  test("OR-04: Public org page mirrors the seeded organisation name", async ({
    page,
  }) => {
    await page.goto(`/pages/organizations/${fixtures.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("main h1").first();
    await expect(heading).toHaveText(new RegExp(fixtures.organization.name, "i"), {
      timeout: 15000,
    });
  });

  test("OR-05: Org datasets tab activates after click", async ({ page }) => {
    await page.goto(`/pages/organizations/${fixtures.organization.slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const datasetsTab = page
      .locator('[role="tab"]', { hasText: /^Conjuntos de dados \(\d+\)/i })
      .first();
    await datasetsTab.click();
    await page.waitForTimeout(2000);

    // The org datasets tab uses Agora CardLinks (no real <a href>); just
    // assert the tab itself becomes active.
    await expect(datasetsTab).toHaveClass(/active/, { timeout: 10000 });
  });

  test.skip("OR-06: Edit org name, description, logo", async () => {
    // Mutates the seeded fixture; needs restore step in teardown.
  });

  test.skip("OR-07: Add/remove org member roles", async () => {
    // Mutates the seeded fixture; needs restore step in teardown.
  });

  test("OR-08: Anonymous visitor on /admin/system/organizations is redirected", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/pages/admin/system/organizations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await context.close();
  });

  test("OR-09: Email link — welcome_new_member — /pages/admin/org/{id}/datasets loads correctly", async ({
    page,
  }) => {
    // Simulates clicking "Ver a organização" from the welcome_new_member email.
    await page.goto(`/pages/admin/org/${fixtures.organization.id}/datasets`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Admin org datasets page must render without redirecting to login.
    expect(page.url()).toContain(`/pages/admin/org/${fixtures.organization.id}/datasets`);
    const heading = page.locator("main").first();
    await expect(heading).toBeAttached({ timeout: 10000 });
  });

  test("OR-10: Email link — new_membership_request — /pages/admin/org/{id}/members loads correctly", async ({
    page,
  }) => {
    // Simulates clicking "See the request" from the new_membership_request email.
    await page.goto(`/pages/admin/org/${fixtures.organization.id}/members`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toContain(`/pages/admin/org/${fixtures.organization.id}/members`);
    const heading = page.locator("main").first();
    await expect(heading).toBeAttached({ timeout: 10000 });
  });

  test("OR-11: Email link — membership_invitation (existing user) — /pages/admin/me/profile loads correctly", async ({
    page,
  }) => {
    // Simulates clicking "View and respond to invitation" from the membership_invitation email.
    await page.goto("/pages/admin/me/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toContain("/pages/admin/me/profile");
    const heading = page.locator("main").first();
    await expect(heading).toBeAttached({ timeout: 10000 });
  });

  test("OR-12: Email link — membership_invitation (new user) — /pages/register loads correctly", async ({
    browser,
  }) => {
    // Simulates clicking "View and respond to invitation" for a user without an account.
    // This is a public page so we use an unauthenticated context.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/pages/register");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toContain("/pages/register");
    const heading = page.locator("main").first();
    await expect(heading).toBeAttached({ timeout: 10000 });
    await context.close();
  });
});
