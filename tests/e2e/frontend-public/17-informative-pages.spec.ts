import { test, expect } from "playwright/test";

const PAGES: { path: string; expectedHeading: RegExp }[] = [
  { path: "/faqs/about_dadosgov", expectedHeading: /Sobre o dados\.gov\.pt/i },
  { path: "/about-open-data", expectedHeading: /Sobre dados abertos/i },
  { path: "/faqs/terms", expectedHeading: /Termos e condições de utilização/i },
  { path: "/faqs/publish", expectedHeading: /Publicar Dados/i },
  { path: "/faqs/reuse", expectedHeading: /Reutilizar Dados/i },
  // /docapi server-redirects to /faqs/api-documentation
  { path: "/docapi", expectedHeading: /Documentação da API/i },
  { path: "/faqs/api-tutorial", expectedHeading: /Documentação da API/i },
  { path: "/support", expectedHeading: /Ajuda/i },
];

test.describe("Informative Pages", () => {
  for (const { path, expectedHeading } of PAGES) {
    test(`PI loads: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const heading = page
        .locator("main")
        .getByRole("heading", { name: expectedHeading })
        .first();
      await expect(heading).toBeVisible({ timeout: 10000 });

      const main = page.locator("main");
      const text = (await main.textContent()) ?? "";
      expect(text.length).toBeGreaterThan(50);
    });
  }

  test("PI-Support: page exposes accordion sections", async ({ page }) => {
    await page.goto("/support");
    await page.waitForLoadState("networkidle");

    const accordions = page.locator('[class*="accordion"]');
    expect(await accordions.count()).toBeGreaterThan(0);
  });

  test("PI-AllPages: every documented path renders without server errors", async ({
    page,
  }) => {
    for (const { path } of PAGES) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0, `Page ${path} should not 5xx`).toBeLessThan(500);
    }
  });
});
