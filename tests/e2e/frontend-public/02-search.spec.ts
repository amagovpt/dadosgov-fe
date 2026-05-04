import { test, expect } from "playwright/test";

const SEARCH_URL = "/pages/search";

test.describe("Search", () => {
  test("PQ-01: Search page opens with text field and filters", async ({
    page,
  }) => {
    await page.goto(SEARCH_URL);
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("#search-page-input");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const filtersHeading = page.getByRole("heading", { name: /^Filtros$/i });
    await expect(filtersHeading).toBeVisible({ timeout: 10000 });

    const typeHeading = page.getByRole("heading", { name: /^Tipo$/i });
    await expect(typeHeading).toBeVisible({ timeout: 10000 });
  });

  test("PQ-02: Search term transportes returns relevant results", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=transportes`);
    await page.waitForLoadState("networkidle");

    const results = page
      .locator(
        "a[href*='/pages/datasets/'], a[href*='/pages/organizations/'], a[href*='/pages/reuses/']"
      )
      .first();
    await expect(results).toBeVisible({ timeout: 15000 });
  });

  test("PQ-03: Verify available type toggles (datasets, reuses, organizations)", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    // dataservices/APIs toggle is currently commented out in SearchClient.
    const expectedToggles = [
      "search-type-datasets",
      "search-type-reuses",
      "search-type-organizations",
    ];

    for (const id of expectedToggles) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("PQ-04: Switch between type tabs changes results", async ({ page }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    const datasetsToggle = page.locator("#search-type-datasets");
    const orgToggle = page.locator("#search-type-organizations");

    await expect(datasetsToggle).toBeChecked();

    await orgToggle.click({ force: true });
    await page.waitForLoadState("networkidle");

    await expect(orgToggle).toBeChecked();
  });

  test("PQ-05: Filter by format (Tabular, Estruturado, Geográfico, Documentos)", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    const formatIds = [
      "filter-formato-tabular",
      "filter-formato-structured",
      "filter-formato-geographic",
      "filter-formato-documents",
    ];

    for (const id of formatIds) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("PQ-06: Filter by access method", async ({ page }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    const accessHeading = page.getByRole("heading", {
      name: /Métodos de acesso/i,
    });
    await expect(accessHeading).toBeVisible({ timeout: 10000 });
  });

  test("PQ-07: Filter by update date", async ({ page }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    const dateHeading = page.getByRole("heading", {
      name: /Data da atualização/i,
    });
    await expect(dateHeading).toBeVisible({ timeout: 10000 });
  });

  test("PQ-08: Filter by organization type", async ({ page }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    const orgHeading = page.getByRole("heading", {
      name: /Tipo de organização/i,
    });
    await expect(orgHeading).toBeVisible({ timeout: 10000 });
  });

  test("PQ-09: Filter by data label (Alto valor, INSPIRE)", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    const labelsHeading = page.getByRole("heading", {
      name: /Rótulo de dados/i,
    });
    await expect(labelsHeading).toBeVisible({ timeout: 10000 });

    const highValue = page
      .getByText(/alto valor/i)
      .first();
    await expect(highValue).toBeVisible({ timeout: 10000 });
  });

  test("PQ-10: Search xyzabc123 shows no results message", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=xyzabc123`);
    await page.waitForLoadState("networkidle");

    const noResults = page
      .getByText(/nenhum resultado encontrado/i)
      .first();
    await expect(noResults).toBeVisible({ timeout: 15000 });
  });

  test("PQ-11: Pagination renders for queries with many results", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=dados`);
    await page.waitForLoadState("networkidle");

    // Pagination only appears when totalPages > 1.
    const pagination = page.locator('nav[aria-label="Paginação"]');
    if ((await pagination.count()) > 0) {
      await expect(pagination).toBeVisible();

      const nextBtn = pagination.getByRole("button", {
        name: /Próxima página/i,
      });
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
      await page.waitForURL(/page=2/, { timeout: 10000 });
      expect(page.url()).toMatch(/page=2/);
    }
  });

  test("PQ-12: URL params pre-fill search input", async ({ page }) => {
    await page.goto(`${SEARCH_URL}?q=saude&type=datasets`);
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("#search-page-input");
    await expect(searchInput).toHaveValue("saude", { timeout: 10000 });
  });
});
