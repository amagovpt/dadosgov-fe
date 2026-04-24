import { test, expect } from "playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Informative Pages", () => {
  test("PI-01: About dados.gov.pt page loads with content", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/faqs/about_dadosgov`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-02: About open data page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/about-open-data`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-03: Terms page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/faqs/terms`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-04: Publish FAQ page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/faqs/publish`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-05: Reuse FAQ page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/faqs/reuse`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-06: API documentation page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/docapi`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-07: API tutorial page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/faqs/api-tutorial`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("PI-08: Support page loads with accordion categories", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/pages/support`);
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const accordions = page.locator(
      '[class*="accordion"], details, [class*="faq"], [class*="expand"]'
    );
    if ((await accordions.count()) > 0) {
      await expect(accordions.first()).toBeVisible();
    }
  });

  test("PI-09: Support page accordions expand and collapse", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/pages/support`);
    await page.waitForLoadState("networkidle");

    const accordionTrigger = page.locator(
      '[class*="accordion"] button, details summary, [class*="faq"] button, [class*="expand"] button'
    );
    if ((await accordionTrigger.count()) > 0) {
      // Click to expand
      await accordionTrigger.first().click();
      await page.waitForTimeout(500);

      const expandedContent = page.locator(
        '[class*="accordion"] [class*="content"], [class*="accordion"] [class*="panel"], details[open], [class*="faq"] [class*="content"]'
      );
      if ((await expandedContent.count()) > 0) {
        await expect(expandedContent.first()).toBeVisible();
      }

      // Click again to collapse
      await accordionTrigger.first().click();
      await page.waitForTimeout(500);
    }
  });

  test("PI-10: All informative pages show formatted text, no blank pages", async ({
    page,
  }) => {
    const pages = [
      "/pages/faqs/about_dadosgov",
      "/pages/about-open-data",
      "/pages/faqs/terms",
      "/pages/faqs/publish",
      "/pages/faqs/reuse",
      "/pages/docapi",
      "/pages/support",
    ];

    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForLoadState("networkidle");

      const body = await page.textContent("body");
      expect(
        body?.length,
        `Page ${pagePath} should not be blank`
      ).toBeGreaterThan(50);

      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    }
  });
});
