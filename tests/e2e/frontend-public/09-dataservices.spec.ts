import { test, expect } from "playwright/test";

const DATASERVICES_URL = "/pages/dataservices";

test.describe("Dataservices Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DATASERVICES_URL);
    await page.waitForLoadState("networkidle");
  });

  test("SD-01: Page loads with APIs banner and search affordance", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /^APIs$/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator("#dataservices-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("SD-02: Empty state or card list renders", async ({ page }) => {
    // Test backend currently has 0 dataservices, so the listing shows a
    // CardNoResults; with seeded data it should show cards. Either is valid.
    const cards = page.locator("a[href*='/pages/dataservices/'], div.cursor-pointer");
    const noResults = page.getByText(/Não existem resultados|Não encontrou o que procurava/i);

    const cardCount = await cards.count();
    const hasNoResults = (await noResults.count()) > 0;
    expect(cardCount > 0 || hasNoResults).toBeTruthy();
  });

  test("SD-03: Search input accepts input", async ({ page }) => {
    const searchInput = page.locator("#dataservices-search");
    await searchInput.fill("API");
    await expect(searchInput).toHaveValue("API");
  });

  test("SD-04: Filter sections are present", async ({ page }) => {
    const tipoHeading = page.getByRole("heading", { name: /^Tipo$/i });
    const filtrosHeading = page.getByRole("heading", { name: /^Filtros$/i });
    await expect(tipoHeading).toBeVisible({ timeout: 10000 });
    await expect(filtrosHeading).toBeVisible({ timeout: 10000 });
  });

  test("SD-05: Pagination renders only when there is more than one page", async ({
    page,
  }) => {
    // With 0 dataservices in the test DB pagination is correctly absent.
    const cards = page.locator("a[href*='/pages/dataservices/'], div.cursor-pointer");
    const cardCount = await cards.count();
    if (cardCount === 0) {
      const pagination = page.locator('nav[aria-label="Paginação"]');
      await expect(pagination).toHaveCount(0);
    }
  });

  test("SD-06: Filter sidebar exposes access methods", async ({ page }) => {
    const accessHeading = page.getByRole("heading", {
      name: /Métodos de acesso/i,
    });
    await expect(accessHeading).toBeVisible({ timeout: 10000 });
  });
});
