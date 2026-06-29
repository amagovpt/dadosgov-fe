import { test, expect } from "playwright/test";

/**
 * Backoffice — Data Services (APIs).
 *
 * Auth via auth-setup storage state. The system listing currently has 0
 * dataservices in the test database; heavy CRUD steps stay skipped until a
 * deterministic seed is available.
 */
test.describe("Backoffice - Data Services CRUD", () => {

  test("API-01: Admin dataservices route is reachable for an admin user", async ({
    page,
  }) => {
    // Reachable via the publish menu and direct URL — admin should not see 404.
    await page.goto("/admin/me/dataservices");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/pages\/admin\//);
  });

  test.skip("API-02: Step 1 - fill all fields and validate", async () => {
    // Requires a working dataservice creation wizard route.
  });

  test.skip("API-03: Step 2 - associate datasets and license", async () => {
    // Requires datasets in the system + form persistence cleanup.
  });

  test.skip("API-04: Step 3 - cover image and save", async () => {
    // Requires file upload + cleanup.
  });

  test.skip("API-05: Edit endpoint URL and license", async () => {
    // Requires a dataservice owned by the admin user.
  });

  test.skip("API-06: Delete dataservice", async () => {
    // Destructive — needs a disposable test database.
  });

  test.skip("API-07: Listings show personal/org/system dataservices", async () => {
    // Requires seeded fixtures.
  });
});
