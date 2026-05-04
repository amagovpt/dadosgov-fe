import { test, expect } from "playwright/test";

test.describe("Header and Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("NV-01: Header shows logo on public pages", async ({ page }) => {
    const pages = [
      "/",
      "/pages/datasets",
      "/pages/reuses",
      "/pages/organizations",
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      const header = page.locator("header").first();
      await expect(header).toBeVisible({ timeout: 10000 });

      const logoLink = header.locator('a[href="/"]').first();
      await expect(logoLink).toBeVisible({ timeout: 10000 });
    }
  });

  test("NV-02: Header exposes primary navigation links", async ({ page }) => {
    const header = page.locator("header").first();
    const navLinks = [
      { href: "/pages/datastories", label: "Data Stories" },
      { href: "/pages/datasets", label: "Conjuntos de dados" },
      { href: "/pages/reuses", label: "Reutilizações" },
      { href: "/pages/organizations", label: "Organizações" },
    ];

    for (const { href } of navLinks) {
      const link = header.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible({ timeout: 10000 });
    }
  });

  test("NV-03: Conhecimento and Publicar dropdowns are present in header", async ({
    page,
  }) => {
    const header = page.locator("header").first();
    const conhecimento = header.getByText(/^Conhecimento$/i).first();
    const publicar = header.getByText(/^Publicar$/i).first();

    await expect(conhecimento).toBeVisible({ timeout: 10000 });
    await expect(publicar).toBeVisible({ timeout: 10000 });
  });

  test("NV-04: Header search button opens a search affordance", async ({
    page,
  }) => {
    const header = page.locator("header").first();
    const searchButton = header.getByRole("button", { name: /Pesquisar/i }).first();
    await expect(searchButton).toBeVisible({ timeout: 10000 });
    await searchButton.click();
    // After clicking, the SearchDropdown gains an input with the known id.
    const searchDropdownInput = page.locator("#header-search").first();
    await expect(searchDropdownInput).toBeVisible({ timeout: 10000 });
  });

  test("NV-05: Language selector exposes Portuguese as default", async ({
    page,
  }) => {
    // The Agora <Languages> widget renders the current language in collapsed
    // dropdowns (desktop + mobile) — the "Português" label is in the DOM but
    // not always visible, so we assert presence rather than visibility.
    const header = page.locator("header").first();
    const portugueseInstances = header.getByText("Português", { exact: true });
    await expect(portugueseInstances.first()).toBeAttached({ timeout: 10000 });
    expect(await portugueseInstances.count()).toBeGreaterThan(0);
  });

  test('NV-06: "Autenticar" button is visible and opens login', async ({
    page,
  }) => {
    const authLink = page.locator('header a[href="/pages/login"]').first();
    await expect(authLink).toBeVisible({ timeout: 10000 });
    await authLink.click();
    await page.waitForURL(/\/pages\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/pages/login");
  });

  test.skip("NV-07: User menu with session (needs auth)", async () => {
    // Skipped: requires authenticated session
  });

  test("NV-13: Conhecimento dropdown opens and shows all main menu items", async ({
    page,
  }) => {
    const header = page.locator("header").first();
    const conhecimentoBtn = header.getByText(/^Conhecimento$/i).first();

    await conhecimentoBtn.click();

    await expect(
      page.getByText("O que é o dados.gov.pt", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Publicar dados", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Reutilizar dados", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Sobre dados abertos", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Desenvolvimento", { exact: true })
    ).toBeVisible({ timeout: 10000 });
  });

  test("NV-14: Conhecimento > Desenvolvimento submenu shows Documentação da API", async ({
    page,
  }) => {
    const header = page.locator("header").first();
    const conhecimentoBtn = header.getByText(/^Conhecimento$/i).first();

    await conhecimentoBtn.click();
    await page.waitForTimeout(300);

    const desenvolvimentoCard = page
      .locator('[data-group="main"]')
      .filter({ hasText: "Desenvolvimento" })
      .first();
    await expect(desenvolvimentoCard).toBeVisible({ timeout: 10000 });
    await desenvolvimentoCard.click();

    const apiDocCard = page
      .locator('[data-group="submenu-desenvolvimento"]')
      .filter({ hasText: "Documentação da API" })
      .first();
    await expect(apiDocCard).toBeVisible({ timeout: 10000 });
  });

  test("NV-15: Conhecimento > Desenvolvimento > back button returns to main menu", async ({
    page,
  }) => {
    const header = page.locator("header").first();

    await header.getByText(/^Conhecimento$/i).first().click();
    await page.waitForTimeout(300);

    await page
      .locator('[data-group="main"]')
      .filter({ hasText: "Desenvolvimento" })
      .first()
      .click();
    await page.waitForTimeout(300);

    const backBtn = page
      .locator('[data-group="submenu-desenvolvimento"][data-is-back="true"]')
      .first();
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();

    await expect(
      page.getByText("O que é o dados.gov.pt", { exact: true })
    ).toBeVisible({ timeout: 10000 });
  });

  test("NV-16: Publicar dropdown opens and shows all creation links", async ({
    page,
  }) => {
    const header = page.locator("header").first();
    const publicarBtn = header.getByText(/^Publicar$/i).first();

    await publicarBtn.click();

    await expect(
      page.getByText("Novo Conjunto de Dados", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Nova Reutilização", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Nova Organização", { exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Novo Harvester", { exact: true })
    ).toBeVisible({ timeout: 10000 });
  });

  test("NV-08: Footer shows the 3 link columns: Dados abertos, Portal, Desenvolvimento", async ({
    page,
  }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    const footerHeadings = footer.locator("h4");
    const count = await footerHeadings.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const footerText = await footer.textContent();
    expect(footerText).toContain("Dados abertos");
    expect(footerText).toContain("Portal");
    expect(footerText).toContain("Desenvolvimento");
  });

  test("NV-09: Footer links have href attributes", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    const footerLinks = footer.locator("a");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await footerLinks.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
    }
  });

  test("NV-10: Footer exposes LinkedIn and institutional logos", async ({
    page,
  }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    const linkedin = footer.locator('a[href*="linkedin"]').first();
    await expect(linkedin).toBeVisible({ timeout: 10000 });

    const images = footer.locator("img");
    expect(await images.count()).toBeGreaterThan(0);
  });

  test("NV-11: External footer links open in a new tab", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator("footer").first();
    const externalLinks = footer.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const target = await externalLinks.nth(i).getAttribute("target");
      expect(target).toBe("_blank");
    }
  });

  test("NV-12: Copyright info is visible in the footer", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator("footer").first();
    const footerText = await footer.textContent();
    expect(footerText).toBeTruthy();
    expect(footerText).toMatch(
      /©|Copyright|Todos os direitos|República Portuguesa/i
    );
  });
});
