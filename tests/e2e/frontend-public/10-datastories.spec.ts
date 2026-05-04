import { test, expect } from "playwright/test";

const DATASTORIES_URL = "/pages/datastories";

test.describe("Datastories Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DATASTORIES_URL);
    await page.waitForLoadState("networkidle");
  });

  test("DS-01: Page loads with banner and story cards", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Data Stories/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Cards use Agora's clickable div pattern, not anchors.
    const cards = page.locator("div.cursor-pointer");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test("DS-02: Cards have meaningful textual content", async ({ page }) => {
    const firstCard = page.locator("div.cursor-pointer").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const cardText = await firstCard.textContent();
    expect(cardText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test("DS-03: Search input accepts input", async ({ page }) => {
    const searchInput = page.locator("#datastories-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill("dados");
    await expect(searchInput).toHaveValue("dados");
  });

  test("DS-04: Card list renders bounded cards", async ({ page }) => {
    const cards = page.locator("div.cursor-pointer");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("DS-05: Click card opens story detail", async ({ page }) => {
    const firstCard = page.locator("div.cursor-pointer").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    await firstCard.click();
    await page.waitForURL(/\/pages\/datastories\/.+/, { timeout: 15000 });

    const heading = page.locator("main h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    expect((await heading.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
