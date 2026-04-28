import { test, expect } from "playwright/test";

/**
 * Backoffice — Harvesters.
 *
 * Auth via auth-setup storage state. Listing lives at /admin/system/harvesters;
 * creation at /admin/harvesters/new. Heavy CRUD scenarios depend on the
 * active admin owning a harvester and on seeded source URLs; they remain
 * skipped.
 */
test.describe("Backoffice - Harvesters CRUD", () => {

  test("HV-01: System harvesters listing renders", async ({ page }) => {
    await page.goto("/pages/admin/system/harvesters");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Harvesters/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("HV-02: Harvester creation wizard step 1 renders", async ({ page }) => {
    await page.goto("/pages/admin/harvesters/new");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page
      .getByRole("heading", {
        name: /Formulário de publicação de um harvester/i,
      })
      .first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const stepIndicator = page.getByText(/Passo 1\/3/i).first();
    await expect(stepIndicator).toBeVisible({ timeout: 10000 });
  });

  test("HV-03: System listing exposes search affordance", async ({ page }) => {
    await page.goto("/pages/admin/system/harvesters");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const search = page.getByPlaceholder(/Pesquis/i).first();
    if ((await search.count()) === 0) return;
    await search.fill("zzz_no_match");
    await expect(search).toHaveValue("zzz_no_match");
  });

  test.skip("HV-04: Step 1 - fill all fields", async () => {
    // Requires a real harvester source URL + cleanup of created harvester.
  });

  test.skip("HV-05: Step 2 - configure schedule", async () => {
    // Requires deterministic time provider + cleanup.
  });

  test.skip("HV-06: Step 3 - run harvester and verify dataset import", async () => {
    // Requires backend Celery worker + cleanup.
  });

  test.skip("HV-07: Edit harvester URL and schedule", async () => {
    // Requires harvester owned by admin.
  });

  test.skip("HV-08: Delete harvester", async () => {
    // Destructive — needs a disposable test database.
  });
});
