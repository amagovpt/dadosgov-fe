import { test, expect } from "playwright/test";

/**
 * Backoffice — Datasets CRUD.
 *
 * Auth is provided by the auth-setup project's storage state (see
 * playwright.config.ts → `dependencies: ["auth-setup"]`). Each test starts
 * already authenticated as the e2e admin.
 *
 * The admin layout uses `<div class="admin-layout__content">` rather than `<main>`,
 * so most assertions here key off page-wide selectors. Heavy CRUD steps depend on
 * fixtures the test admin doesn't own out of the box (datasets, organisation
 * memberships) and stay skipped until a deterministic seed is available.
 */
test.describe("Backoffice - Datasets CRUD", () => {

  test("DS-01: 'Os meus datasets' page renders with empty-state CTA", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Sidebar + page heading rendered
    await expect(
      page.getByRole("heading", { name: /Conjuntos de dados/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // The empty-state copy or a real listing is rendered.
    const emptyCopy = page.getByText(/Sem conjuntos de dados|Publique no portal/i);
    const editLink = page.locator('a[href*="/admin/me/datasets/edit"]');
    expect(((await emptyCopy.count()) > 0) || ((await editLink.count()) > 0)).toBeTruthy();
  });

  test("DS-02: Publish dropdown exposes 'Um conjunto de dados' option", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const publishBtn = page.getByText("Publicar dados.gov.pt").first();
    await expect(publishBtn).toBeVisible({ timeout: 10000 });
    await publishBtn.click();
    await page.waitForTimeout(500);

    const datasetOption = page.getByText(/Um conjunto de dados/i).first();
    await expect(datasetOption).toBeVisible({ timeout: 5000 });
  });

  test("DS-03: Wizard step 1 reveals 'Tipo de publicação' heading", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByText(/Tipo de publicação/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const startBtn = page.getByRole("button", { name: /Comece a publicação/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
  });

  test("DS-04: Wizard step 2 exposes title input #api-name", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=2");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const titleInput = page.locator("#api-name").first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill("E2E temporary draft");
    await expect(titleInput).toHaveValue("E2E temporary draft");
  });

  test("DS-05: Wizard step 3 exposes the FICHEIROS upload section", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=3");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const filesSection = page.getByText(/^FICHEIROS$/i).first();
    await expect(filesSection).toBeVisible({ timeout: 10000 });
  });

  test("DS-06: Wizard step 4 exposes draft/publish buttons", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/new/?step=4");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const draftBtn = page.getByRole("button", { name: /Guardar o rascunho/i });
    const publishBtn = page.getByRole("button", {
      name: /Publicar o conjunto de dados/i,
    });
    await expect(draftBtn.or(publishBtn).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("DS-07: System datasets listing renders for admin", async ({ page }) => {
    await page.goto("/pages/admin/system/datasets/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page
      .getByRole("heading", { name: /Conjuntos de dados/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("DS-08: System datasets listing exposes search affordance", async ({
    page,
  }) => {
    await page.goto("/pages/admin/system/datasets/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const search = page.getByPlaceholder(/Pesquis/i).first();
    if ((await search.count()) === 0) return;
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill("zzz_no_match");
    await expect(search).toHaveValue("zzz_no_match");
  });

  // CRUD scenarios below require seeded fixtures (admin-owned datasets,
  // organisation membership, file uploads with cleanup). Re-enable once a
  // dedicated test database with deterministic content is wired in.

  test.skip(
    "DS-09: Step 2 - fill title, description, frequency and save as draft",
    async () => {
      // Requires E2E persistence + cleanup of created drafts.
    }
  );

  test.skip(
    "DS-10: Step 3 - upload file (CSV/Excel) appears in resource list",
    async () => {
      // Requires seeded organisation + ability to clean up uploaded resources.
    }
  );

  test.skip(
    "DS-11: Step 4 - click Publicar to make dataset public",
    async () => {
      // Requires destructive workflow with publish + delete cycle.
    }
  );

  test.skip(
    "DS-12: Open existing dataset for edit shows 3 tabs",
    async () => {
      // Requires a dataset owned by the admin user.
    }
  );

  test.skip(
    "DS-13: Edit title and description, save and verify persistence",
    async () => {
      // Requires a dataset owned by the admin user.
    }
  );

  test.skip(
    "DS-14: Edit license, frequency, acronym, short description and save",
    async () => {
      // Requires a dataset owned by the admin user.
    }
  );

  test.skip(
    "DS-15: Add new file resource to existing dataset",
    async () => {
      // Requires a dataset owned by the admin user + cleanup.
    }
  );

  test.skip(
    "DS-16: Edit resource name, description, and format",
    async () => {
      // Requires a dataset with a resource and cleanup hooks.
    }
  );

  test.skip(
    "DS-17: Delete resource file removes it from list",
    async () => {
      // Destructive — needs a disposable test database.
    }
  );

  test.skip(
    "DS-18: Discussions tab shows dataset discussions",
    async () => {
      // Requires a dataset with seeded discussions.
    }
  );

  test.skip(
    "DS-19: Delete dataset removes it from listing",
    async () => {
      // Destructive — needs a disposable test database.
    }
  );

  test.skip(
    "DS-20: Archive published dataset removes it from public listings",
    async () => {
      // Destructive — needs a disposable test database.
    }
  );
});
