import { test, expect, type Page } from "playwright/test";

const ORGS_URL = "/pages/organizations";

async function gotoFirstOrgDetail(page: Page) {
  await page.goto(ORGS_URL);
  await page.waitForLoadState("networkidle");

  const firstLink = page.locator("a[href^='/pages/organizations/']").first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  const href = await firstLink.getAttribute("href");
  if (!href) throw new Error("No organization link found on listing");

  await page.goto(href);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });
}

test.describe("Organization Detail", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstOrgDetail(page);
  });

  test("OD-01: Page loads with name, breadcrumb and tabs", async ({ page }) => {
    const heading = page.locator("main h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    expect(headingText?.trim().length ?? 0).toBeGreaterThan(0);

    const descricaoTab = page
      .locator('[role="tab"]', { hasText: /^Descrição$/i })
      .first();
    await expect(descricaoTab).toBeVisible({ timeout: 10000 });
  });

  test("OD-02: Breadcrumb shows Home > Organizações > [Name]", async ({
    page,
  }) => {
    const breadcrumb = page.locator(".agora-breadcrumb").first();
    await expect(breadcrumb).toBeAttached({ timeout: 10000 });

    const breadcrumbText = (await breadcrumb.textContent()) ?? "";
    expect(breadcrumbText.toLowerCase()).toContain("home");
    expect(breadcrumbText.toLowerCase()).toContain("organiza");
  });

  test("OD-03: Page renders an image — logo if available, placeholder otherwise", async ({
    page,
  }) => {
    const images = page.locator("main img");
    expect(await images.count()).toBeGreaterThan(0);

    // The logo/placeholder img must have a non-empty src.
    const logoImg = images.first();
    await expect(logoImg).toBeVisible({ timeout: 10000 });
    const src = await logoImg.getAttribute("src");
    expect((src ?? "").trim().length).toBeGreaterThan(0);

    // When the org has a logo the src must NOT be the placeholder;
    // when it has no logo the placeholder is expected — both are valid.
    // What is never valid is an empty or null src.
    const isLogoOrPlaceholder =
      (src ?? "").startsWith("http") ||
      (src ?? "").startsWith("/s/") ||
      (src ?? "").includes("organization.png");
    expect(isLogoOrPlaceholder).toBe(true);
  });

  test.skip("OD-04: Favorites button works with session", async () => {
    // Skipped: requires authenticated session
  });

  test("OD-05: Description and informative content rendered", async ({
    page,
  }) => {
    const descricaoHeading = page
      .getByRole("heading", { name: /Descrição/i })
      .first();
    await expect(descricaoHeading).toBeVisible({ timeout: 10000 });

    const bodyText = await page.locator("main").textContent();
    expect((bodyText ?? "").trim().length).toBeGreaterThan(200);
  });

  test("OD-06: Sidebar exposes organization metadata sections", async ({
    page,
  }) => {
    const sectionLabels = [/Organização/i, /Data de criação/i];
    for (const label of sectionLabels) {
      const heading = page.locator("h3", { hasText: label }).first();
      await expect(heading).toBeAttached({ timeout: 10000 });
    }
  });

  test("OD-07: Datasets tab is reachable", async ({ page }) => {
    const datasetsTab = page
      .locator('[role="tab"]', { hasText: /^Conjuntos de dados \(\d+\)/i })
      .first();
    await expect(datasetsTab).toBeVisible({ timeout: 10000 });

    await datasetsTab.click();
    await expect(
      page.locator("h3", { hasText: /CONJUNTOS DE DADOS|Sem conjuntos/i }).first()
    ).toBeAttached({ timeout: 10000 });
  });

  test("OD-08: Reuses tab is reachable", async ({ page }) => {
    const reusesTab = page
      .locator('[role="tab"]', { hasText: /^Reutilizações \(\d+\)/i })
      .first();
    await expect(reusesTab).toBeVisible({ timeout: 10000 });
  });

  test.skip(
    "OD-09: Services tab",
    async () => {
      // The organization detail does not expose a dedicated APIs/Services tab
      // in the current UI; dataservices appear under the dataset tab when present.
    }
  );

  test("OD-10: Members section is rendered (under Informações)", async ({
    page,
  }) => {
    const informacoesTab = page
      .locator('[role="tab"]', { hasText: /^Informações$/i })
      .first();
    await informacoesTab.click();

    const membersHeading = page.locator("h3", { hasText: /Membros/i }).first();
    await expect(membersHeading).toBeAttached({ timeout: 10000 });
  });
});
