import { test, expect } from "playwright/test";

/**
 * Backoffice — Form validation smoke tests.
 *
 * Auth via auth-setup storage state. Wizards expose required-field validation
 * when users skip them. Heavy scenarios (filling every field, submitting
 * valid forms) stay skipped to keep the suite non-destructive.
 */
test.describe("Backoffice - Form Validation", () => {

  test("FV-01: Dataset wizard step 2 surfaces title input #api-name", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=2");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const titleInput = page.locator("#api-name").first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
  });

  test("FV-02: Reuse wizard step 1 surfaces title and URL inputs", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/reuses/new/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const titleInput = page.locator("#reuse-title").first();
    const urlInput = page.locator("#reuse-link").first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(urlInput).toBeVisible({ timeout: 10000 });
  });

  test("FV-03: Harvester wizard step 1 renders step indicator", async ({
    page,
  }) => {
    await page.goto("/pages/admin/harvesters/new");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const stepIndicator = page.getByText(/Passo 1\/3/i).first();
    await expect(stepIndicator).toBeVisible({ timeout: 10000 });
  });

  test("FV-04: Organisation wizard step 1 renders step indicator", async ({
    page,
  }) => {
    await page.goto("/pages/admin/organizations/new");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const stepIndicator = page.getByText(/Passo 1\/3/i).first();
    await expect(stepIndicator).toBeVisible({ timeout: 10000 });
  });

  test("FV-05: Profile editor exposes 'Nome' label", async ({ page }) => {
    await page.goto("/pages/admin/me/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const label = page.getByText(/^Nome \*$/).first();
    await expect(label).toBeVisible({ timeout: 10000 });
  });

  test.skip("FV-06: Required field error appears when user submits empty form", async () => {
    // Wizard step navigation differs between modules; revisit per-form when
    // we wire deterministic error messages into the suite.
  });

  test.skip("FV-07: URL field rejects malformed input", async () => {
    // Wired into individual wizard step coverage.
  });

  test.skip("FV-08: File upload size guard surfaces an error", async () => {
    // Requires a fixture file > 4MB and cleanup.
  });
});
