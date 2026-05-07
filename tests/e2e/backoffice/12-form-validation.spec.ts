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

  test("FV-09: Dataset step 2 frequency dropdown is empty by default (no 'Desconhecida' pre-selected)", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=2");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const trigger = page.locator("#agora-input-select-dataset-frequency-control").first();
    await expect(trigger).toBeVisible({ timeout: 10000 });
    await expect(trigger).not.toContainText(/desconhecida/i);
  });

  test.skip("FV-07: URL field rejects malformed input", async () => {
    // Wired into individual wizard step coverage.
  });

  test.skip("FV-08: File upload size guard surfaces an error", async () => {
    // Requires a fixture file > 4MB and cleanup.
  });

  test("FV-09: Upload modal rejects file with invalid extension and shows error", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=3");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const addFilesBtn = page
      .getByRole("button", { name: /Adicionar ficheiros/i })
      .first();
    await expect(addFilesBtn).toBeVisible({ timeout: 10000 });
    await addFilesBtn.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for allowed extensions to be fetched by the popup
    await page.waitForTimeout(1500);

    const fileInput = modal.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      { name: "erwerwr.txt2", mimeType: "text/plain", buffer: Buffer.from("test") },
    );

    const errorMsg = modal.getByText(/Tipo de ficheiro inválido/i).first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test("FV-10: Upload modal accepts file with valid extension and shows no error", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=3");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const addFilesBtn = page
      .getByRole("button", { name: /Adicionar ficheiros/i })
      .first();
    await expect(addFilesBtn).toBeVisible({ timeout: 10000 });
    await addFilesBtn.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for allowed extensions to be fetched by the popup
    await page.waitForTimeout(1500);

    const fileInput = modal.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      { name: "data.csv", mimeType: "text/csv", buffer: Buffer.from("col1,col2\nval1,val2") },
    );

    const errorMsg = modal.getByText(/Tipo de ficheiro inválido/i).first();
    await expect(errorMsg).not.toBeVisible({ timeout: 3000 });

    await expect(modal.getByText("data.csv").first()).toBeVisible({ timeout: 5000 });
  });
});
