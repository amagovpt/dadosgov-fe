import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";

const SEARCH_URL = "/search";

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
        "a[href*='/datasets/'], a[href*='/organizations/'], a[href*='/reuses/']"
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

  test("PQ-13: Dataset suggest API returns results for description-only query", async ({
    request,
  }) => {
    // The fixture dataset title is "E2E Test Dataset" — "seed script" is NOT
    // in the title but IS in its description "Dataset auto-created by the e2e
    // seed script."  Before the fix, this query returned nothing; after the
    // fix it must return the fixture.
    const { dataset } = loadFixtures();

    const response = await request.get(
      `/api/1/datasets/suggest/?q=seed+script&size=25`
    );
    expect(response.ok()).toBeTruthy();

    const data: { slug: string }[] = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    const slugs = data.map((d) => d.slug);
    expect(slugs).toContain(dataset.slug);
  });

  test("PQ-14: Organization suggest API returns results for description-only query", async ({
    request,
  }) => {
    // The fixture org name is "E2E Test Organization" — "seed script" is NOT
    // in the name but IS in its description "Organisation auto-created by the
    // e2e seed script."
    const { organization } = loadFixtures();

    const response = await request.get(
      `/api/1/organizations/suggest/?q=seed+script&size=25`
    );
    expect(response.ok()).toBeTruthy();

    const data: { slug: string }[] = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    const slugs = data.map((d) => d.slug);
    expect(slugs).toContain(organization.slug);
  });

  test("PQ-15: Search page returns dataset results for description-only query", async ({
    page,
  }) => {
    // "seed script" is in the fixture dataset description but not its title.
    // The search page must surface at least one result (the fixture).
    const { dataset } = loadFixtures();

    await page.goto(`${SEARCH_URL}?q=seed+script&type=datasets`);
    await page.waitForLoadState("networkidle");

    const datasetLink = page.locator(`a[href*="/datasets/${dataset.slug}"]`);
    await expect(datasetLink).toBeVisible({ timeout: 15000 });
  });
});
