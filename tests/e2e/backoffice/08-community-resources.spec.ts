import { test, expect } from "playwright/test";

/**
 * Backoffice — Community Resources.
 *
 * Auth via auth-setup storage state. Personal listing at
 * /admin/me/community-resources; system listing at /admin/system/community-resources.
 * CRUD steps depend on the admin owning a community resource and stay skipped.
 */
test.describe("Backoffice - Community Resources", () => {

  test("CR-01: Personal community resources listing renders with empty state", async ({
    page,
  }) => {
    await page.goto("/admin/me/community-resources");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page
      .getByRole("heading", { name: /Recursos comunitários/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const emptyCopy = page.getByText(/Sem publicações|Ainda não publicou/i);
    const rows = page.locator('a[href*="/admin/me/community-resources/edit"]');
    expect(((await emptyCopy.count()) > 0) || ((await rows.count()) > 0)).toBeTruthy();
  });

  test("CR-02: System community resources listing renders for admin", async ({
    page,
  }) => {
    await page.goto("/admin/system/community-resources");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page
      .getByRole("heading", { name: /Recursos comunitários/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test.skip("CR-03: Create new community resource", async () => {
    // Requires associated dataset + file upload cleanup.
  });

  test.skip("CR-04: Edit community resource", async () => {
    // Requires resource owned by admin user.
  });

  test.skip("CR-05: Delete community resource", async () => {
    // Destructive — needs a disposable test database.
  });
});
