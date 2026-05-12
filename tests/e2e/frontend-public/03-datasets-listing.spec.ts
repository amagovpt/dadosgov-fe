import { test, expect, type Page } from "playwright/test";

const DATASETS_URL = "/pages/datasets";

async function openFiltersPanel(page: Page) {
  const openBtn = page.getByRole("button", { name: /Abrir filtros/i });
  if ((await openBtn.count()) > 0 && (await openBtn.first().isVisible())) {
    await openBtn.first().click();
    await expect(
      page.getByRole("heading", { name: /^Filtros$/i })
    ).toBeVisible({ timeout: 10000 });
  }
}

test.describe("Datasets Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DATASETS_URL);
    await page.waitForLoadState("networkidle");
  });

  test("DL-01: Page loads with dataset list and filter panel toggle", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", {
      name: /Conjuntos de dados/i,
      level: 1,
    });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const cards = page.locator("a[href^='/pages/datasets/']").first();
    await expect(cards).toBeVisible({ timeout: 15000 });

    // Filters are collapsed by default; the toggle must be present.
    const toggleBtn = page.getByRole("button", { name: /Abrir filtros/i });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
  });

  test("DL-02: Each card has meaningful textual content", async ({ page }) => {
    const firstCard = page.locator("a[href^='/pages/datasets/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const cardText = await firstCard.textContent();
    expect(cardText?.trim().length ?? 0).toBeGreaterThan(10);
  });

  test("DL-03: Click card opens dataset detail", async ({ page }) => {
    const firstCard = page.locator("a[href^='/pages/datasets/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    await firstCard.click();
    await page.waitForURL(/\/pages\/datasets\/.+/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/pages\/datasets\/.+/);
  });

  test("DL-04: Search field filters results", async ({ page }) => {
    const searchInput = page.locator("#datasets-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("educação");
    await searchInput.press("Enter");
    await page.waitForURL(/q=educa/, { timeout: 10000 });
    expect(page.url()).toMatch(/q=educa/);
  });

  test("DL-05: Tag filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    // Advanced filter group names render as <span> inside Sidebar items.
    const tagLabel = page.getByText("Palavras-chave", { exact: true }).first();
    await expect(tagLabel).toBeVisible({ timeout: 10000 });
  });

  test("DL-06: License filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const licenseLabel = page.getByText("Licenças", { exact: true }).first();
    await expect(licenseLabel).toBeVisible({ timeout: 10000 });
  });

  test("DL-07: Format filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const formatHeading = page
      .getByRole("heading", { name: /Formato dos recursos/i })
      .first();
    await expect(formatHeading).toBeVisible({ timeout: 10000 });
  });

  test("DL-08: Organization filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const orgLabel = page.getByText("Organizações", { exact: true }).first();
    await expect(orgLabel).toBeVisible({ timeout: 10000 });
  });

  test("DL-09: High-value badge filter visible in advanced filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const highValue = page.getByText(/Elevado Valor/i).first();
    await expect(highValue).toBeVisible({ timeout: 10000 });
  });

  test("DL-10: Sort toggles offer Mais recente, Mais antigo, Subscritores", async ({
    page,
  }) => {
    const sortLabels = ["Relevância", "Mais recente", "Mais antigo", "Subscritores"];
    for (const label of sortLabels) {
      const toggle = page.getByText(label, { exact: true }).first();
      await expect(toggle).toBeVisible({ timeout: 10000 });
    }
  });

  test("DL-11: Result list renders cards for the page", async ({ page }) => {
    const cards = page.locator("a[href^='/pages/datasets/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    const count = await cards.count();
    // Page-size is 20 from the API; the layout adds a few extras (featured cards,
    // related links). We just verify the page renders a reasonable number of cards.
    expect(count).toBeGreaterThan(0);
  });

  test("DL-12: Search query persists in URL", async ({ page }) => {
    const searchInput = page.locator("#datasets-search");
    await searchInput.fill("dados");
    await searchInput.press("Enter");
    await page.waitForURL(/q=dados/, { timeout: 10000 });

    const inputAfter = page.locator("#datasets-search");
    await expect(inputAfter).toHaveValue("dados");
  });

  test("DL-13: Clearing search restores broader list", async ({ page }) => {
    const searchInput = page.locator("#datasets-search");
    await searchInput.fill("educação");
    await searchInput.press("Enter");
    await page.waitForURL(/q=educa/, { timeout: 10000 });

    await page.locator("#datasets-search").fill("");
    await page.locator("#datasets-search").press("Enter");
    await page.waitForURL((url) => !url.searchParams.get("q"), {
      timeout: 10000,
    });

    const results = page.locator("a[href^='/pages/datasets/']");
    await expect(results.first()).toBeVisible({ timeout: 15000 });
    expect(await results.count()).toBeGreaterThan(0);
  });

  test("DL-14: Date filter sets modified_since in URL", async ({ page }) => {
    await openFiltersPanel(page);

    const toggle = page.locator("#ds-filter-atualizacao-30_days");
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await toggle.click();

    await page.waitForURL(/modified_since=/, { timeout: 10000 });
    expect(page.url()).toMatch(/modified_since=/);
  });

  test("DL-15: Date filter roundtrip — 3-year range is correctly detected from URL", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const toggle3yr = page.locator("#ds-filter-atualizacao-3_years");
    await expect(toggle3yr).toBeVisible({ timeout: 10000 });
    await toggle3yr.click();
    await page.waitForURL(/modified_since=/, { timeout: 10000 });

    // Navigate to the resulting URL directly to simulate a reload/bookmark.
    // The old day-counting code failed here when leap years pushed diffDays
    // past the <= 1096 boundary, returning "all" instead of "3_years".
    const urlWithFilter = page.url();
    await page.goto(urlWithFilter);
    await page.waitForLoadState("networkidle");

    await openFiltersPanel(page);

    const toggle3yrAfter = page.locator("#ds-filter-atualizacao-3_years");
    await expect(toggle3yrAfter).toBeChecked({ timeout: 10000 });
  });
});
