import { test, expect, type Page } from "playwright/test";

const ORGS_URL = "/pages/organizations";

async function openFiltersPanel(page: Page) {
  const openBtn = page.getByRole("button", { name: /Abrir filtros/i });
  if ((await openBtn.count()) > 0 && (await openBtn.first().isVisible())) {
    await openBtn.first().click();
    await expect(
      page.getByRole("heading", { name: /^Filtros$/i })
    ).toBeVisible({ timeout: 10000 });
  }
}

test.describe("Organizations Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ORGS_URL);
    await page.waitForLoadState("networkidle");
  });

  test("OL-01: Page loads with org list and filter toggle", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: /Organizações/i,
      level: 1,
    });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const cards = page.locator("a[href^='/pages/organizations/']").first();
    await expect(cards).toBeVisible({ timeout: 15000 });

    const toggleBtn = page.getByRole("button", { name: /Abrir filtros/i });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
  });

  test("OL-02: Cards have meaningful textual content", async ({ page }) => {
    const firstCard = page.locator("a[href^='/pages/organizations/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const cardText = await firstCard.textContent();
    expect(cardText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test("OL-03: Click card opens organization detail", async ({ page }) => {
    const firstLink = page.locator("a[href^='/pages/organizations/']").first();
    await expect(firstLink).toBeVisible({ timeout: 15000 });

    await firstLink.click();
    await page.waitForURL(/\/pages\/organizations\/.+/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/pages\/organizations\/.+/);
  });

  test("OL-04: Search filters by name", async ({ page }) => {
    const searchInput = page.locator("#organizations-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("instituto");
    await searchInput.press("Enter");
    await page.waitForURL(/q=instituto/, { timeout: 10000 });
    expect(page.url()).toContain("q=instituto");
  });

  test("OL-05: Type filter section visible after opening filters", async ({
    page,
  }) => {
    await openFiltersPanel(page);

    const typeFilter = page
      .locator(".organizations-filters")
      .first()
      .getByRole("heading")
      .first();
    await expect(typeFilter).toBeVisible({ timeout: 10000 });
  });

  test("OL-06: Sort toggles render Relevância, Mais dados, Mais reutilizações, Subscritores", async ({
    page,
  }) => {
    const sortLabels = [
      "Relevância",
      "Mais dados",
      "Mais reutilizações",
      "Subscritores",
    ];
    for (const label of sortLabels) {
      const toggle = page.getByText(label, { exact: true }).first();
      await expect(toggle).toBeVisible({ timeout: 10000 });
    }
  });

  test("OL-07: Org cards render and form a bounded list", async ({ page }) => {
    const cards = page.locator("a[href^='/pages/organizations/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(60);
  });
});
