import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";

/**
 * Backoffice — organization badges access control.
 *
 * LEDG-1941: the public organization page exposes an "Editar" button to
 * super admins / members.
 * LEDG-1943: the "Emblemas" section in the org profile is only visible to
 * super administrators (not to regular org members).
 *
 * The backoffice project is authenticated as the e2e admin (super admin, has
 * the global "admin" role). The e2e editor is a plain member (no global role).
 */
const { organization } = loadFixtures();

test.describe("Backoffice - Organization badges (super admin)", () => {
  test("OBA-01: Emblemas section is visible to a super admin in the org profile", async ({
    page,
  }) => {
    await page.goto(`/admin/org/${organization.id}/profile`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /^Emblemas$/i }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("OBA-02: Editar button is shown on the public org page for an admin", async ({
    page,
  }) => {
    await page.goto(`/organizations/${organization.slug}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: /^Editar$/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Backoffice - Organization badges (member, not super admin)", () => {
  // Run this block as the e2e editor: a member of the org WITHOUT the global
  // admin role, so the Emblemas section must be hidden (LEDG-1943).
  test.use({ storageState: "tests/.auth/editor.json" });

  test("OBA-03: Emblemas section is hidden for a non-super-admin member", async ({
    page,
  }) => {
    await page.goto(`/admin/org/${organization.id}/profile`);
    await page.waitForLoadState("networkidle");

    // The profile page itself still loads (the description field is present)…
    await expect(page.getByText(/^Descrição/i).first()).toBeVisible({ timeout: 15000 });
    // …but the Emblemas section must NOT be rendered.
    await expect(page.getByRole("heading", { name: /^Emblemas$/i })).toHaveCount(0);
  });
});
