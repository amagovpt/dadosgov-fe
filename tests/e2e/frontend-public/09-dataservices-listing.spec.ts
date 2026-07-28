import { test, expect, type Page } from "playwright/test";

const DATASERVICES_URL = "/dataservices";

// Dataservice cards use Agora's <CardLinks> with blockedLink=true (mirroring
// the reuses listing), so the only real <a href="/dataservices/{slug}">
// is suppressed and navigation happens via onClick on a `.cursor-pointer` div.
// Tests rely on this affordance rather than href matching.
const CARD_SELECTOR = "div.cursor-pointer";

async function openFiltersPanel(page: Page) {
  const openBtn = page.getByRole("button", { name: /Abrir filtros/i });
  if ((await openBtn.count()) > 0 && (await openBtn.first().isVisible())) {
    await openBtn.first().click();
    // The filters panel renders the "Data da atualização" toggle section.
    await expect(
      page.getByRole("heading", { name: /Data da atualização/i }).first()
    ).toBeVisible({ timeout: 10000 });
  }
}

test.describe("Dataservices (APIs) Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DATASERVICES_URL);
    await page.waitForLoadState("networkidle");
  });

  test("API-01: Page loads with heading, cards and filter toggle", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /^APIs$/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });

    await expect(page.locator(CARD_SELECTOR).first()).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByRole("button", { name: /Abrir filtros/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("API-02: Each card has meaningful textual content", async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const cardText = await firstCard.textContent();
    expect(cardText?.trim().length ?? 0).toBeGreaterThan(10);
  });

  test("API-03: Click card opens the dataservice detail", async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();
    await page.waitForURL(/dataservices\/.+/, { timeout: 15000 });
    await expect(page).toHaveURL(/dataservices\/.+/);
  });

  test("API-04: Search field filters results and persists in URL", async ({ page }) => {
    const searchInput = page.locator("#dataservices-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("E2E");
    await searchInput.press("Enter");
    await page.waitForURL(/q=E2E/i, { timeout: 10000 });
    expect(page.url()).toMatch(/q=E2E/i);
    await expect(page.locator("#dataservices-search")).toHaveValue("E2E");
  });

  test("API-05: Search finds the seeded E2E dataservice", async ({ page }) => {
    const searchInput = page.locator("#dataservices-search");
    await searchInput.fill("E2E Test Dataservice");
    await searchInput.press("Enter");
    await page.waitForURL(/q=/, { timeout: 10000 });
    await expect(
      page.getByText("E2E Test Dataservice", { exact: false }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("API-06: Sort toggles offer Relevância and Mais recentes", async ({ page }) => {
    for (const label of ["Relevância", "Mais recentes"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("API-07: Sort by 'Mais recentes' keeps results (valid sort key)", async ({ page }) => {
    // Regression: the listing used to send sort=-created_at (rejected with 400),
    // which made 'Mais recentes' return zero results.
    await page.goto(DATASERVICES_URL + "?sort=-created");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(CARD_SELECTOR).first()).toBeVisible({ timeout: 15000 });
  });

  test("API-08: Opening filters shows the API filter sections", async ({ page }) => {
    await openFiltersPanel(page);

    await expect(
      page.getByRole("heading", { name: /Tipo de organização/i }).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Organizações", { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Palavras-chave", { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("API-09: 'Métodos de acesso' filter is NOT present (parity with datasets)", async ({
    page,
  }) => {
    await openFiltersPanel(page);
    await expect(
      page.getByRole("heading", { name: /Métodos de acesso/i })
    ).toHaveCount(0);
  });

  test("API-10: Date filter sets modified_since in the URL", async ({ page }) => {
    await openFiltersPanel(page);
    const toggle = page.locator("#dsvc-filter-atualizacao-30_days");
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await toggle.click();
    await page.waitForURL(/modified_since=/, { timeout: 10000 });
    expect(page.url()).toMatch(/modified_since=/);
  });

  test("API-11: 'Tipo de organização: Serviço público' sets organization_badge", async ({
    page,
  }) => {
    await openFiltersPanel(page);
    const toggle = page.locator("#dsvc-filter-organizacao-public-service");
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await toggle.click();
    await page.waitForURL(/organization_badge=public-service/, { timeout: 10000 });
    expect(page.url()).toMatch(/organization_badge=public-service/);
  });

  test("API-12: Detail page shows Informações and Discussões tabs", async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();
    await page.waitForURL(/dataservices\/.+/, { timeout: 15000 });

    await expect(page.getByText("Informações", { exact: true }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/^Discussões/).first()).toBeVisible({ timeout: 10000 });
  });
});
