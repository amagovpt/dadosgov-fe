import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";

/**
 * Backoffice — Reuses CRUD.
 *
 * Auth via auth-setup storage state. Fixtures (admin-owned org/reuse linked
 * to the seeded dataset) come from `scripts/seed_e2e_fixtures.py`.
 */
const fixtures = loadFixtures();

test.describe("Backoffice - Reuses CRUD", () => {
  test("RU-01: 'Os meus reuses' page renders with empty-state CTA", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/reuses/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Reutilizações/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const emptyCopy = page.getByText(/Sem reutiliza|Publique no portal/i);
    const reuseLinks = page.locator('a[href*="/admin/me/reuses/edit"]');
    expect(((await emptyCopy.count()) > 0) || ((await reuseLinks.count()) > 0)).toBeTruthy();
  });

  test("RU-02: Wizard step 1 exposes title input #reuse-title", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/reuses/new/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const titleInput = page.locator("#reuse-title").first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill("E2E temporary draft");
    await expect(titleInput).toHaveValue("E2E temporary draft");
  });

  test("RU-03: Wizard step 1 exposes URL input #reuse-link", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/reuses/new/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const urlInput = page.locator("#reuse-link").first();
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    await urlInput.fill("https://example.com/reuse");
    await expect(urlInput).toHaveValue("https://example.com/reuse");
  });

  test("RU-04: System reuses listing renders for admin", async ({ page }) => {
    await page.goto("/pages/admin/system/reuses");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Reutilizações/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("RU-05: Publish dropdown exposes 'Uma reutilização' option", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/reuses/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const publishBtn = page.getByText("Publicar dados.gov.pt").first();
    await expect(publishBtn).toBeVisible({ timeout: 10000 });
    await publishBtn.click();
    await page.waitForTimeout(500);

    const reuseOption = page.getByText(/Uma reutilização/i).first();
    await expect(reuseOption).toBeVisible({ timeout: 5000 });
  });

  test("RU-06: Public reuse detail mirrors the seeded title", async ({
    page,
  }) => {
    await page.goto(`/pages/reuses/${fixtures.reuse.slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // The reuse title is rendered as <h3> inside Agora's <CardArticle>.
    const titleHeading = page
      .locator("h3", { hasText: fixtures.reuse.title })
      .first();
    await expect(titleHeading).toBeVisible({ timeout: 15000 });
  });

  test("RU-07: Seeded reuse links back to its associated dataset", async ({
    page,
  }) => {
    await page.goto(`/pages/reuses/${fixtures.reuse.slug}`);
    await page.waitForLoadState("networkidle");

    // Detail page shows "N conjunto(s) de dados associados".
    const associatedHeading = page
      .getByRole("heading", {
        name: /\d+ conjuntos? de dados associados?/i,
      })
      .first();
    await expect(associatedHeading).toBeVisible({ timeout: 10000 });

    const datasetLink = page
      .locator(`a[href$="/pages/datasets/${fixtures.dataset.slug}"]`)
      .first();
    await expect(datasetLink).toBeVisible({ timeout: 10000 });
  });

  test.skip("RU-08: Step 3 - optional cover image, save and create", async () => {
    // Requires file upload + cleanup.
  });

  test.skip("RU-09: Edit title, URL, and type then save", async () => {
    // Mutates seeded reuse; needs restore step in teardown.
  });

  test.skip("RU-10: Change cover image updates it", async () => {
    // Requires file upload + cleanup.
  });

  test.skip("RU-11: Delete reuse removes it from listing", async () => {
    // Destructive against seeded reuse — would break dependent tests.
  });

  test.skip("RU-12: Publish draft reuse makes it visible on portal", async () => {
    // Requires draft + publish + cleanup cycle.
  });
});
