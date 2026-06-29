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
    await page.goto("/pages/admin/me/dataservices");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/pages\/admin\//);
  });

  test("API-02: Wizard step 1 exposes the required name + description fields", async ({
    page,
  }) => {
    await page.goto("/pages/admin/dataservices/new?step=1");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const nameInput = page.locator("#api-name").first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("E2E temporary API draft");
    await expect(nameInput).toHaveValue("E2E temporary API draft");

    await expect(page.locator("#api-description").first()).toBeVisible();
  });

  test("API-03: Wizard step 2 offers both dataset-association methods at once", async ({
    page,
  }) => {
    // Regression for the "one or the other" bug: the search multi-select and
    // the "add by URL" field must coexist so a dataset added one way is not
    // wiped by the other. Step 2 renders from the query param regardless of
    // step-1 state, so the affordances can be asserted non-destructively.
    await page.goto("/pages/admin/dataservices/new?step=2");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Method 1: the search multi-select.
    await expect(
      page.getByText("Pesquisar um conjunto de dados").first()
    ).toBeVisible({ timeout: 10000 });

    // Method 2: the paste-a-URL field + its "Adicionar" button.
    await expect(page.locator("#dataset-link-url").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Adicionar$/i }).first()
    ).toBeVisible();
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
