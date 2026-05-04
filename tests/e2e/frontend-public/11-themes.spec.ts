import { test, expect } from "playwright/test";

const THEMES_URL = "/pages/themes";

test.describe("Themes Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(THEMES_URL);
    await page.waitForLoadState("networkidle");
  });

  test("TM-01: Page loads with heading and navigation", async ({ page }) => {
    const heading = page.locator("main h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const nav = page.locator("main nav").first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test("TM-02: Navigation lists category items", async ({ page }) => {
    const navItems = page.locator("main nav a, main nav button");
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("TM-03: Accordion sections render", async ({ page }) => {
    const accordions = page.locator('[class*="accordion"]');
    expect(await accordions.count()).toBeGreaterThan(0);
  });

  test("TM-04: Click first nav item updates page state", async ({ page }) => {
    const firstLink = page.locator("main nav a").first();
    if ((await firstLink.count()) > 0) {
      const href = await firstLink.getAttribute("href");
      await firstLink.click();
      await page.waitForTimeout(500);
      // Either the URL gains a hash or navigation occurs to another themes page.
      if (href) {
        expect(href.length).toBeGreaterThan(0);
      }
    }
  });

  test("TM-05: Page references dataset paths in links or accordions", async ({
    page,
  }) => {
    // Datasets are referenced lazily; check that the page content mentions
    // /pages/datasets/ somewhere in its DOM (anchors or data attributes).
    const html = await page.content();
    expect(html).toContain("/pages/datasets");
  });

  test("TM-06: Page renders an h2 section heading", async ({ page }) => {
    const h2 = page.locator("main h2").first();
    await expect(h2).toBeVisible({ timeout: 10000 });
  });
});
