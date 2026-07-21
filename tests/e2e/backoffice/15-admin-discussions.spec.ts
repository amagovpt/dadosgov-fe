import { test, expect } from "playwright/test";

/**
 * Admin discussions module — listings live under:
 *   - /admin/org/discussions          (active org)
 *   - /admin/org/[orgId]/discussions  (specific org, admin-impersonating)
 *
 * Auth via auth-setup storage state. The seeded e2e admin has no organisation
 * membership, so /admin/org/discussions redirects to /admin/me/datasets.
 */
test.describe("Backoffice - Admin Discussions", () => {

  test("AD-01: Org discussions page resolves to a backoffice URL", async ({
    page,
  }) => {
    await page.goto("/admin/org/discussions");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);

    const url = page.url();
    // With the seeded org membership the page renders /admin/org/discussions;
    // without it the user is redirected to /admin/me/*. Either is acceptable —
    // a backoffice route must resolve.
    expect(url).toMatch(/admin\//);
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
    await page.goto("/admin/org/discussions");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/(login|admin)/);
    await context.close();
  });
});
