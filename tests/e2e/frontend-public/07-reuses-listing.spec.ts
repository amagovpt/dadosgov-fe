import { test, expect, type Page } from "playwright/test";

const REUSES_URL = "/reuses";

// Reuse cards use Agora's <CardLinks> with blockedLink=true, so the only
// real <a href="/reuses/{slug}"> is suppressed and navigation happens
// via onClick on a `.cursor-pointer` div. Tests rely on this affordance
// rather than href matching.
const CARD_SELECTOR = "div.cursor-pointer";

async function openFiltersPanel(page: Page) {
  const openBtn = page.getByRole("button", { name: /Abrir filtros/i });
  if ((await openBtn.count()) > 0 && (await openBtn.first().isVisible())) {
    await openBtn.first().click();
    await expect(
      page.getByRole("heading", { name: /^Filtros$/i })
    ).toBeVisible({ timeout: 10000 });
  }
}

test.describe("Reuses Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REUSES_URL);
    await page.waitForLoadState("networkidle");
  });

  test("RL-01: Page loads with reuse cards and search", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: /Reutilizações/i,
      level: 1,
    });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator("#reuses-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const cards = page.locator(CARD_SELECTOR);
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test("RL-02: Cards have meaningful textual content", async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const cardText = await firstCard.textContent();
    expect(cardText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test("RL-03: Click card opens reuse detail", async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    await firstCard.click();
    await page.waitForURL(/\/pages\/reuses\/.+/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/pages\/reuses\/.+/);
  });

  test("RL-04: Search filters by name", async ({ page }) => {
    const searchInput = page.locator("#reuses-search");
    await searchInput.fill("dados");
    await searchInput.press("Enter");
    await page.waitForURL(/q=dados/, { timeout: 10000 });
    expect(page.url()).toContain("q=dados");
  });

  test.skip(
    "RL-05: Type filter dropdown",
    async () => {
      // The TypeSelect component is defined in ReusesClient.tsx but is currently
      // not rendered anywhere in the listing JSX, so the type dropdown is not
      // exposed to users. Re-enable when the filter is wired into the UI.
    }
  );

  test("RL-06: Tag filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const tagLabel = page
      .getByText(/Palavras-chave|Etiquetas/i)
      .first();
    await expect(tagLabel).toBeVisible({ timeout: 10000 });
  });

  test("RL-07: Organization filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const orgLabel = page.getByText("Organizações", { exact: true }).first();
    await expect(orgLabel).toBeVisible({ timeout: 10000 });
  });

  test("RL-08: Sort toggles render Relevância, Mais recente, Mais antigo, Subscritores", async ({
    page,
  }) => {
    const sortLabels = ["Relevância", "Mais recente", "Mais antigo", "Subscritores"];
    for (const label of sortLabels) {
      const toggle = page.getByText(label, { exact: true }).first();
      await expect(toggle).toBeVisible({ timeout: 10000 });
    }
  });

  test("RL-09: Card list renders a bounded set per page", async ({ page }) => {
    const cards = page.locator(CARD_SELECTOR);
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    // Page size is 12 per the API but the layout occasionally adds extras —
    // assert a sane upper bound.
    expect(count).toBeLessThanOrEqual(30);
  });

  test("RL-10: Date filter sets modified_since in URL", async ({ page }) => {
    await openFiltersPanel(page);

    const toggle = page.locator("#reuse-filter-atualizacao-30_days");
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await toggle.click();

    await page.waitForURL(/modified_since=/, { timeout: 10000 });
    expect(page.url()).toMatch(/modified_since=/);
  });

  test("RL-11: Date filter roundtrip — 3-year range is correctly detected from URL", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const toggle3yr = page.locator("#reuse-filter-atualizacao-3_years");
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

    const toggle3yrAfter = page.locator("#reuse-filter-atualizacao-3_years");
    await expect(toggle3yrAfter).toBeChecked({ timeout: 10000 });
  });

  test("RL-12: Search query persists in input after navigation", async ({ page }) => {
    const searchInput = page.locator("#reuses-search");
    await searchInput.fill("dados");
    await searchInput.press("Enter");
    await page.waitForURL(/q=dados/, { timeout: 10000 });

    const inputAfter = page.locator("#reuses-search");
    await expect(inputAfter).toHaveValue("dados");
  });

  test("RL-13: Clearing search restores broader list", async ({ page }) => {
    const searchInput = page.locator("#reuses-search");
    await searchInput.fill("educação");
    await searchInput.press("Enter");
    await page.waitForURL(/q=educa/, { timeout: 10000 });

    await page.locator("#reuses-search").fill("");
    await page.locator("#reuses-search").press("Enter");
    await page.waitForURL((url) => !url.searchParams.get("q"), {
      timeout: 10000,
    });

    const cards = page.locator(CARD_SELECTOR);
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("RL-14: Date filter roundtrip — 12-month range is correctly detected from URL", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const toggle12m = page.locator("#reuse-filter-atualizacao-12_months");
    await expect(toggle12m).toBeVisible({ timeout: 10000 });
    await toggle12m.click();
    await page.waitForURL(/modified_since=/, { timeout: 10000 });

    // Reload/bookmark simulation — the old day-counting code could misidentify
    // 12-month dates when a leap year caused diffDays to reach 366.
    const urlWithFilter = page.url();
    await page.goto(urlWithFilter);
    await page.waitForLoadState("networkidle");

    await openFiltersPanel(page);

    const toggle12mAfter = page.locator("#reuse-filter-atualizacao-12_months");
    await expect(toggle12mAfter).toBeChecked({ timeout: 10000 });
  });
});
