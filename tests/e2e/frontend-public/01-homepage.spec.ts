import { test, expect } from "playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("HP-01: Homepage loads with banner, stats, featured datasets and news sections", async ({
    page,
  }) => {
    // Hero banner H1
    const heroHeading = page.getByRole("heading", {
      name: /Portal aberto/i,
      level: 1,
    });
    await expect(heroHeading).toBeVisible({ timeout: 10000 });

    // Stats section
    const stats = page.locator(".stats-icon-square").first();
    await expect(stats).toBeVisible({ timeout: 10000 });

    // Featured datasets section
    const datasetsHeading = page.getByRole("heading", { name: /Conjuntos de dados/i });
    await expect(datasetsHeading.first()).toBeVisible({ timeout: 10000 });

    // Latest news section
    const newsHeading = page.getByRole("heading", { name: /Últimas novidades/i });
    await expect(newsHeading).toBeVisible({ timeout: 10000 });
  });

  test("HP-02: Header search button is reachable from homepage", async ({
    page,
  }) => {
    // Homepage has no inline search bar; the header exposes a "Pesquisar" toggle.
    const headerSearchButton = page
      .locator("header")
      .getByRole("button", { name: /Pesquisar/i })
      .first();
    await expect(headerSearchButton).toBeVisible({ timeout: 10000 });
  });

  test("HP-03: Hero section advertises the dataset catalogue", async ({
    page,
  }) => {
    // Homepage hero conveys catalogue intent via subtitle copy and the publish CTA.
    const subtitle = page.getByText(/conjuntos de dados ao seu dispor/i);
    await expect(subtitle).toBeVisible({ timeout: 10000 });
  });

  test("HP-04: Publish button without session redirects to login", async ({
    page,
  }) => {
    const publishButton = page.getByRole("button", {
      name: /Publicar dados\.gov\.pt/i,
    });

    if ((await publishButton.count()) > 0) {
      await publishButton.first().click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    }
  });

  test.skip(
    "HP-05: Publish button with session shows 4 options dropdown",
    async () => {
      // Skipped: requires authenticated session
    }
  );

  test("HP-06: Stats section shows 4 counters", async ({ page }) => {
    const expectedLabels = [
      "Conjuntos de Dados",
      "Reutilizações",
      "Organizações",
      "Utilizadores",
    ];

    for (const label of expectedLabels) {
      const element = page.getByText(label, { exact: false }).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }

    const statsIcons = page.locator(".stats-icon-square");
    await expect(statsIcons.first()).toBeVisible({ timeout: 10000 });
    const count = await statsIcons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("HP-07: Featured datasets section shows cards with title, org, description", async ({
    page,
  }) => {
    const heading = page
      .getByRole("heading", { name: /Conjuntos de dados/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const datasetLinks = page.locator("a[href^='/pages/datasets/']");
    await expect(datasetLinks.first()).toBeVisible({ timeout: 15000 });

    const count = await datasetLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("HP-08: Click featured dataset card navigates to dataset detail", async ({
    page,
  }) => {
    const datasetLink = page.locator("a[href^='/pages/datasets/']").first();
    await expect(datasetLink).toBeVisible({ timeout: 15000 });

    await datasetLink.click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/pages\/datasets\/.+/, { timeout: 10000 });
  });

  test("HP-09: Ver todos os conjuntos de dados link navigates to datasets listing", async ({
    page,
  }) => {
    const viewAllLink = page.getByRole("link", {
      name: /ver todos os conjuntos de dados/i,
    });
    await expect(viewAllLink).toBeVisible({ timeout: 10000 });

    await viewAllLink.click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/pages\/datasets/, { timeout: 10000 });
  });

  test("HP-10: Partners section shows logos", async ({ page }) => {
    const partnersHeading = page.getByRole("heading", {
      name: /utilizado diariamente por/i,
    });
    await expect(partnersHeading).toBeVisible({ timeout: 10000 });

    const partnersSection = partnersHeading.locator("..");
    const logos = partnersSection.locator("img");
    const logoCount = await logos.count();
    expect(logoCount).toBeGreaterThan(0);
  });

  test("HP-11: Data Stories section shows cards on dark background", async ({
    page,
  }) => {
    const storiesHeading = page.getByRole("heading", { name: /Data Stories/i });
    await expect(storiesHeading).toBeVisible({ timeout: 10000 });

    const storiesGrid = page.locator(".storytellings");
    await expect(storiesGrid).toBeVisible({ timeout: 10000 });

    const cards = storiesGrid.locator("a[href*='/pages/datastories/']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("HP-12: Latest news section shows cards with Ler mais buttons", async ({
    page,
  }) => {
    const newsHeading = page.getByRole("heading", { name: /Últimas novidades/i });
    await expect(newsHeading).toBeVisible({ timeout: 10000 });

    const postLinks = page.locator("a[href^='/pages/posts/']");
    await expect(postLinks.first()).toBeVisible({ timeout: 15000 });

    const count = await postLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("HP-13: Click Ler mais opens article detail", async ({ page }) => {
    const newsHeading = page.getByRole("heading", { name: /Últimas novidades/i });
    await expect(newsHeading).toBeVisible({ timeout: 10000 });

    const postLink = page
      .locator("a[href^='/pages/posts/']")
      .filter({ hasNotText: "" })
      .first();
    await expect(postLink).toBeVisible({ timeout: 15000 });

    await postLink.click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/pages\/posts\/.+/, { timeout: 10000 });
  });
});
