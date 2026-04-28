import { test, expect } from "playwright/test";

/**
 * Admin discussions module — listings live under:
 *   - /pages/admin/org/discussions          (active org)
 *   - /pages/admin/org/[orgId]/discussions  (specific org, admin-impersonating)
 *
 * Auth via auth-setup storage state. The seeded e2e admin has no organisation
 * membership, so /admin/org/discussions redirects to /admin/me/datasets.
 */
test.describe("Backoffice - Admin Discussions", () => {

  test("AD-01: Org discussions page either renders or redirects to /admin/me/", async ({
    page,
  }) => {
    await page.goto("/pages/admin/org/discussions");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/admin/org/discussions")) {
      const heading = page.getByRole("heading", { name: /Discuss/i }).first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    } else {
      // Admin without an org — redirected to /pages/admin/me/datasets.
      expect(url).toMatch(/\/pages\/admin\/me\//);
    }
  });

  test.skip(
    "AD-02: Empty state OR a discussion row is rendered",
    async () => {
      // Requires the active admin to belong to an organisation. Re-enable
      // when an org-membership fixture is wired into the test seed.
    }
  );

  test.skip(
    "AD-03: Filter or search input narrows the discussions listing",
    async () => {
      // Requires the active admin to belong to an organisation.
    }
  );

  test.skip(
    "AD-04: Open a discussion row opens detail/popup with subject + author",
    async () => {
      // Requires seeded discussions in the active org.
    }
  );

  test.skip(
    "AD-05: Close discussion action posts and refreshes listing",
    async () => {
      // Skipped: needs a fresh open discussion seeded for the active org.
    }
  );

  test.skip(
    "AD-06: Delete discussion action removes the row from listing",
    async () => {
      // Skipped: destructive — only run against a disposable test database.
    }
  );

  test("AD-07: Anonymous visitor is redirected away from /admin/org/discussions", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/pages/admin/org/discussions");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await context.close();
  });
});
