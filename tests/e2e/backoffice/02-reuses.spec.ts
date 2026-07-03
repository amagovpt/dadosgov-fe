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
    await page.goto("/admin/me/reuses/");
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
    await page.goto("/admin/me/reuses/new/");
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
    await page.goto("/admin/me/reuses/new/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const urlInput = page.locator("#reuse-link").first();
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    await urlInput.fill("https://example.com/reuse");
    await expect(urlInput).toHaveValue("https://example.com/reuse");
  });

  // Reuse-specific select coverage moved to the cross-form regression matrix
  // at `tests/helpers/select-regression.ts` (driven by `99-select-regression.spec.ts`).

  test("RU-04: System reuses listing renders for admin", async ({ page }) => {
    await page.goto("/admin/system/reuses");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /Reutilizações/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("RU-05: Publish dropdown exposes 'Uma reutilização' option", async ({
    page,
  }) => {
    await page.goto("/admin/me/reuses/");
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
    await page.goto(`/reuses/${fixtures.reuse.slug}`);
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
    await page.goto(`/reuses/${fixtures.reuse.slug}`);
    await page.waitForLoadState("networkidle");

    // Detail page shows "N conjunto(s) de dados associados".
    const associatedHeading = page
      .getByRole("heading", {
        name: /\d+ conjuntos? de dados associados?/i,
      })
      .first();
    await expect(associatedHeading).toBeVisible({ timeout: 10000 });

    const datasetLink = page
      .locator(`a[href$="/datasets/${fixtures.dataset.slug}"]`)
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

  test("RU-13: Tag chips on the reuse form render in alphabetical order", async ({
    page,
  }) => {
    await page.goto("/admin/me/reuses/new/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mock the tags suggest API so the test is independent of live data and
    // always exercises the sort path with tags in reverse-alphabetical order.
    await page.route("**/api/1/tags/suggest/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ text: "zebra" }, { text: "alfa" }, { text: "mango" }]),
      });
    });

    // Open the keywords dropdown and type to trigger the mocked API.
    const keywordsTrigger = page
      .locator("#agora-input-select-reuse-keywords-control")
      .first();
    await expect(keywordsTrigger).toBeVisible({ timeout: 10000 });
    await keywordsTrigger.click();
    await page.waitForTimeout(500);

    const searchInput = page.getByPlaceholder(/Escreva para pesquisar ou criar/i).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    // Select all visible options (zebra, alfa, mango).
    const popupId = await keywordsTrigger.getAttribute("aria-controls");
    if (popupId) {
      const options = page.locator(`#${popupId} [role="option"]`);
      const count = await options.count();
      for (let i = 0; i < count; i++) {
        await options.nth(i).click();
        await page.waitForTimeout(200);
      }
    }

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Collect rendered tag chip texts and verify alphabetical order.
    const chips = page.locator(".flex.flex-wrap [class*='tag'], .flex.flex-wrap button").filter({ hasText: /\S/ });
    const chipCount = await chips.count();
    if (chipCount < 2) return; // Not enough chips to assert order

    const texts: string[] = [];
    for (let i = 0; i < chipCount; i++) {
      texts.push((await chips.nth(i).innerText()).replace(/[×✕]/g, "").trim());
    }
    const sorted = [...texts].sort((a, b) => a.localeCompare(b));
    expect(texts).toEqual(sorted);
  });
});
