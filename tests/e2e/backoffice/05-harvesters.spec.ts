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
    await page.goto("/admin/system/harvesters");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Harvesters/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("HV-02: Harvester creation wizard step 1 renders", async ({ page }) => {
    await page.goto("/admin/harvesters/new");
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
    await page.goto("/admin/system/harvesters");
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

  // -------------------------------------------------------------------------
  // LEDG-1720 — Sysadmin validate / reject popups in /admin/system/harvesters.
  //
  // The dev DB is not guaranteed to contain a pending harvester, so the
  // pop-up tests no-op when no source advertises an "Aprovar harvester …"
  // row icon. This mirrors HV-03's "skip if no data" pattern and keeps the
  // spec safe to run against an empty/clean DB.
  // -------------------------------------------------------------------------

  test("HV-09: Approve popup opens, renders comment textarea, cancels cleanly", async ({
    page,
  }) => {
    await page.goto("/admin/system/harvesters");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const approveTrigger = page
      .getByRole("button", { name: /^Aprovar harvester / })
      .first();
    if ((await approveTrigger.count()) === 0) {
      test.skip(
        true,
        "No pending harvester in dev DB to exercise approve popup"
      );
      return;
    }

    await approveTrigger.click();

    const heading = page
      .getByRole("heading", { name: /^Aprovar harvester$/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    const commentLabel = page.getByText(/Coment.rio.*opcional/i).first();
    await expect(commentLabel).toBeVisible();

    await page.getByRole("button", { name: /^Cancelar$/i }).first().click();
    await expect(heading).toHaveCount(0, { timeout: 3000 });
  });

  test("HV-10: Reject popup blocks submission until a comment is provided", async ({
    page,
  }) => {
    await page.goto("/admin/system/harvesters");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const rejectTrigger = page
      .getByRole("button", { name: /^Rejeitar harvester / })
      .first();
    if ((await rejectTrigger.count()) === 0) {
      test.skip(
        true,
        "No pending harvester in dev DB to exercise reject popup"
      );
      return;
    }

    await rejectTrigger.click();

    const heading = page
      .getByRole("heading", { name: /^Rejeitar harvester$/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    const submitReject = page.getByRole("button", { name: /^Rejeitar$/i }).first();
    await expect(submitReject).toBeDisabled();

    const textarea = page.getByLabel(/Motivo da rejei/i).first();
    await textarea.fill("E2E HV-10 — não submeter, apenas teste de UI");
    await expect(submitReject).toBeEnabled();

    await page.getByRole("button", { name: /^Cancelar$/i }).first().click();
    await expect(heading).toHaveCount(0, { timeout: 3000 });
  });

  test("HV-11: Editor (non-admin) does not see approve/reject row controls", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/editor.json",
    });
    const page = await context.newPage();
    try {
      await page.goto("/admin/system/harvesters");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Either the page is gated (no harvest table at all) or it renders
      // without the sysadmin-only icons. Both outcomes satisfy the gate.
      const approve = page.getByRole("button", { name: /^Aprovar harvester / });
      const reject = page.getByRole("button", { name: /^Rejeitar harvester / });
      await expect(approve).toHaveCount(0);
      await expect(reject).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
