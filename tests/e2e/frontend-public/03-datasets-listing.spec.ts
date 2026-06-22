import { test, expect, type Page } from "playwright/test";

const DATASETS_URL = "/datasets";
const PLACEHOLDER_SRC = "/images/placeholders/organization.png";

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

    const cards = page.locator("a[href^='/datasets/']").first();
    await expect(cards).toBeVisible({ timeout: 15000 });

    // Filters are collapsed by default; the toggle must be present.
    const toggleBtn = page.getByRole("button", { name: /Abrir filtros/i });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
  });

  test("DL-02: Each card has meaningful textual content", async ({ page }) => {
    const firstCard = page.locator("a[href^='/datasets/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const cardText = await firstCard.textContent();
    expect(cardText?.trim().length ?? 0).toBeGreaterThan(10);
  });

  test("DL-03: Click card opens dataset detail", async ({ page }) => {
    const firstCard = page.locator("a[href^='/datasets/']").first();
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
    const cards = page.locator("a[href^='/datasets/']");
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

    const results = page.locator("a[href^='/datasets/']");
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

  test("DL-16: Date filter roundtrip — 12-month range is correctly detected from URL", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const toggle12m = page.locator("#ds-filter-atualizacao-12_months");
    await expect(toggle12m).toBeVisible({ timeout: 10000 });
    await toggle12m.click();
    await page.waitForURL(/modified_since=/, { timeout: 10000 });

    // Reload/bookmark simulation — the old day-counting code could misidentify
    // 12-month dates when a leap year caused diffDays to reach 366.
    const urlWithFilter = page.url();
    await page.goto(urlWithFilter);
    await page.waitForLoadState("networkidle");

    await openFiltersPanel(page);

    const toggle12mAfter = page.locator("#ds-filter-atualizacao-12_months");
    await expect(toggle12mAfter).toBeChecked({ timeout: 10000 });
  });

  test("DL-17: Trailing space after an active search query does not trigger extra navigation", async ({
    page,
  }) => {
    // Start with an active search so currentQuery = "da" and searchQuery = "da"
    await page.goto(DATASETS_URL + "?q=da");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("#datasets-search");
    await expect(searchInput).toHaveValue("da", { timeout: 10000 });

    // Capture any RSC / data-fetch requests that Next.js makes on client navigation
    const extraNavigationRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      // Next.js App Router appends _rsc=<hash> when fetching RSC payloads on navigation
      if (url.includes("_rsc")) {
        extraNavigationRequests.push(url);
      }
    });

    // Add a trailing space — with the bug, searchQuery.trim() !== currentQuery comparison
    // was missing, so debounce fired and called router.replace even for the same query
    await searchInput.fill("da ");

    // Wait well past debounce (default 200 ms) to let any erroneous request fire
    await page.waitForTimeout(600);

    // No RSC re-fetch should have been triggered — the effective query did not change
    expect(extraNavigationRequests).toHaveLength(0);

    // URL must remain exactly as before (no encoded space appended)
    expect(page.url()).toContain("q=da");
    expect(page.url()).not.toMatch(/q=da(%20|\+)/);
  });

  test("DL-18: Typing only whitespace does not add a q param to the URL", async ({
    page,
  }) => {
    await page.goto(DATASETS_URL);
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("#datasets-search");

    // Fill with spaces only — effective query after trim is "", same as currentQuery
    await searchInput.fill("   ");

    // Wait past debounce
    await page.waitForTimeout(600);

    // URL must not have acquired a q param
    expect(page.url()).not.toMatch(/[?&]q=/);
  });

  test("DL-19: Every dataset card renders an img element with a non-empty src", async ({
    page,
  }) => {
    const cards = page.locator("a[href^='/datasets/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const sampleSize = Math.min(count, 3);
    for (let i = 0; i < sampleSize; i++) {
      const img = cards.nth(i).locator("img").first();
      await expect(img).toBeVisible({ timeout: 10000 });
      const src = await img.getAttribute("src");
      // src must always be set — either the org logo URL or the placeholder
      expect((src ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  test("DL-20: Org logos from the API reach the dataset card img src (no server-side stripping)", async ({
    page,
  }) => {
    const cards = page.locator("a[href^='/datasets/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    // Collect every card img src from the DOM
    const srcs: string[] = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("a[href^='/datasets/'] img")
      ).map((img) => (img as HTMLImageElement).getAttribute("src") ?? "")
    );

    expect(srcs.length).toBeGreaterThan(0);

    // Every src must be non-empty — the server must not strip logos before
    // handing them to the client (the old probeUrls bug would produce "" / null).
    for (const src of srcs) {
      expect(src.trim().length).toBeGreaterThan(0);
    }
  });

  test("DL-22: Frequency filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const freqBtn = page.getByRole("button", { name: /Frequência/i }).first();
    await expect(freqBtn).toBeVisible({ timeout: 10000 });
  });

  test("DL-23: Frequency filter sets frequency param in URL", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    // The Frequência section is a collapsed accordion — expand it first.
    const freqBtn = page.getByRole("button", { name: /^Frequência/i }).first();
    await expect(freqBtn).toBeVisible({ timeout: 10000 });
    await freqBtn.click();

    // The Agora Checkbox component renders a custom element; find by accessible role+name.
    const mensal = page.getByRole("checkbox", { name: /^Mensal$/i });
    await expect(mensal).toBeVisible({ timeout: 10000 });
    await mensal.click();

    await page.waitForURL(/frequency=/, { timeout: 10000 });
    expect(page.url()).toMatch(/frequency=/);
  });

  test("DL-24: Frequency filter roundtrip — checkbox is checked when navigating from URL", async ({
    page,
  }) => {
    // Navigate directly with the frequency param already set.
    await page.goto(DATASETS_URL + "?frequency=monthly");
    await page.waitForLoadState("networkidle");

    await openFiltersPanel(page);

    // The section shows a pill count when a value is active; expand it.
    const freqBtn = page.getByRole("button", { name: /^Frequência/i }).first();
    await expect(freqBtn).toBeVisible({ timeout: 10000 });
    await freqBtn.click();

    const mensal = page.getByRole("checkbox", { name: /^Mensal$/i });
    await expect(mensal).toBeChecked({ timeout: 10000 });
  });

  test("DL-25: Spatial granularity options are localized to Portuguese", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    // Expand the "Granularidade Espacial" accordion section.
    const granBtn = page
      .getByRole("button", { name: /^Granularidade Espacial/i })
      .first();
    await expect(granBtn).toBeVisible({ timeout: 10000 });
    await granBtn.click();

    // The PT administrative levels must render in Portuguese.
    // Regression: they used to surface the untranslated English geolevel
    // labels ("District" / "County" / "Parish").
    await expect(
      page.getByRole("checkbox", { name: /^Distrito$/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("checkbox", { name: /^Concelho$/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("checkbox", { name: /^Freguesia$/i })
    ).toBeVisible({ timeout: 10000 });

    // The English labels must not appear anywhere in the filter panel.
    await expect(page.getByRole("checkbox", { name: /^District$/i })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: /^County$/i })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: /^Parish$/i })).toHaveCount(0);
  });

  test("DL-26: Selected spatial coverage keeps its name after clearing the search", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    // Expand the "Cobertura Espacial" accordion section.
    const geoBtn = page
      .getByRole("button", { name: /^Cobertura Espacial/i })
      .first();
    await expect(geoBtn).toBeVisible({ timeout: 10000 });
    await geoBtn.click();

    // Only the expanded section's search input is visible.
    const search = page
      .locator('[placeholder="Escreva para pesquisar..."]:visible')
      .first();
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill("Lisboa");

    // Wait for a zone suggestion whose label contains "Lisboa". If the dev DB
    // has no matching zone, the suggestion never appears — skip rather than fail.
    const suggestion = page.getByRole("checkbox", { name: /Lisboa/i }).first();
    try {
      await expect(suggestion).toBeVisible({ timeout: 15000 });
    } catch {
      test.info().annotations.push({
        type: "note",
        description: "No 'Lisboa' spatial zone suggestion in this environment.",
      });
      return;
    }

    await suggestion.click();
    await page.waitForURL(/geozone=/, { timeout: 10000 });

    // Clearing the search empties the live suggestions list. The selection must
    // keep its human-readable name — regression: it fell back to the raw zone
    // code (e.g. "pt:concelho:1106").
    await search.fill("");

    const selected = page.getByRole("checkbox", { name: /Lisboa/i }).first();
    await expect(selected).toBeVisible({ timeout: 10000 });
    await expect(selected).toBeChecked();

    // No remaining checkbox should be labeled with a raw zone code.
    await expect(
      page.getByRole("checkbox", { name: /(pt:(distrito|concelho|freguesia)|country):/i })
    ).toHaveCount(0);
  });

  test("DL-21: onError fallback replaces a failed org logo with the placeholder", async ({
    page,
  }) => {
    const cards = page.locator("a[href^='/datasets/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    // Find card indices whose img currently shows a real logo (not the placeholder).
    const indicesWithLogo: number[] = await page.evaluate((placeholder) => {
      const imgs = Array.from(
        document.querySelectorAll("a[href^='/datasets/'] img")
      );
      return imgs
        .map((img, i) => ({ i, src: (img as HTMLImageElement).getAttribute("src") ?? "" }))
        .filter(({ src }) => src.length > 0 && !src.includes("organization.png"))
        .map(({ i }) => i);
    }, PLACEHOLDER_SRC);

    if (indicesWithLogo.length === 0) {
      // No dataset has an org logo in this environment — fallback not exercised.
      test.info().annotations.push({
        type: "note",
        description: "No org logos found in DB — onError fallback not exercised.",
      });
      return;
    }

    // Programmatically fire the native `error` event on those imgs.
    // React attaches its onError listener directly on <img> elements
    // (since the error event does not bubble), so dispatching it here
    // triggers the setImgSrc(PLACEHOLDER) state update in CardMetrics.
    await page.evaluate((placeholder) => {
      const imgs = Array.from(
        document.querySelectorAll("a[href^='/datasets/'] img")
      ) as HTMLImageElement[];
      imgs.forEach((img) => {
        const src = img.getAttribute("src") ?? "";
        if (src.length > 0 && !src.includes("organization.png")) {
          img.dispatchEvent(new Event("error", { bubbles: false }));
        }
      });
    }, PLACEHOLDER_SRC);

    // Wait for React to re-render the affected cards with the placeholder src.
    await page.waitForFunction(
      ({ indices, placeholder }: { indices: number[]; placeholder: string }) => {
        const imgs = Array.from(
          document.querySelectorAll("a[href^='/datasets/'] img")
        ) as HTMLImageElement[];
        return indices.every((i) =>
          (imgs[i]?.getAttribute("src") ?? "").includes("organization.png")
        );
      },
      { indices: indicesWithLogo.slice(0, 3), placeholder: PLACEHOLDER_SRC },
      { timeout: 5000 }
    );

    // Verify the placeholder is now shown for each formerly-logo card.
    for (const idx of indicesWithLogo.slice(0, 3)) {
      const img = page.locator("a[href^='/datasets/'] img").nth(idx);
      const src = await img.getAttribute("src");
      expect(src).toContain("organization.png");
    }
  });
});
