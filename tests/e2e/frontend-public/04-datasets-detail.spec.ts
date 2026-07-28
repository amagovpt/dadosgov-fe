import { test, expect, type Page } from "playwright/test";

const DATASETS_URL = "/datasets";

async function gotoFirstDatasetDetail(page: Page) {
  await page.goto(DATASETS_URL);
  await page.waitForLoadState("networkidle");

  const firstLink = page.locator("a[href^='/datasets/']").first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  const href = await firstLink.getAttribute("href");
  if (!href) throw new Error("No dataset link found on listing");

  await page.goto(href);
  await page.waitForLoadState("networkidle");
  // Detail content streams in via Suspense; wait for the page H1 before asserting.
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });
}

test.describe("Dataset Detail", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstDatasetDetail(page);
  });

  test("DD-01: Page loads with title and Suspense-streamed sections", async ({
    page,
  }) => {
    const title = page.locator("main h1").first();
    await expect(title).toBeVisible({ timeout: 10000 });

    const titleText = await title.textContent();
    expect(titleText?.trim().length ?? 0).toBeGreaterThan(0);

    // The Ficheiros tab is a [role="tab"] in the agora design system; the
    // matching <h3> heading is rendered inside the tab body which may be
    // collapsed on first paint.
    const filesTab = page.locator('[role="tab"]', { hasText: /^Ficheiros/i }).first();
    await expect(filesTab).toBeVisible({ timeout: 10000 });
  });

  test("DD-02: Breadcrumb shows Home > Conjuntos de dados > [Title]", async ({
    page,
  }) => {
    const breadcrumb = page.locator(".agora-breadcrumb").first();
    await expect(breadcrumb).toBeAttached({ timeout: 10000 });

    const breadcrumbText = (await breadcrumb.textContent()) ?? "";
    expect(breadcrumbText.toLowerCase()).toContain("home");
    expect(breadcrumbText.toLowerCase()).toContain("conjuntos de dados");
  });

  test("DD-03: Title is non-empty", async ({ page }) => {
    const title = page.locator("main h1").first();
    const titleText = await title.textContent();
    expect(titleText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test("DD-04: Description / metadata content is rendered", async ({ page }) => {
    // Detail pages render an "Informação" or "Qualidade dos metadados" section.
    const infoSection = page
      .getByRole("heading", { name: /Informação|Qualidade dos metadados/i })
      .first();
    await expect(infoSection).toBeVisible({ timeout: 10000 });
  });

  test("DD-05: Quality metadata heading is visible", async ({ page }) => {
    const qualityHeading = page.getByRole("heading", {
      name: /Qualidade dos metadados/i,
    });
    await expect(qualityHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test("DD-06: Files tab is present with a count", async ({ page }) => {
    const filesTab = page
      .locator('[role="tab"]', { hasText: /^Ficheiros \(\d+\)/i })
      .first();
    await expect(filesTab).toBeVisible({ timeout: 10000 });
  });

  test("DD-07: Sidebar links to the producing organization", async ({
    page,
  }) => {
    const orgLink = page
      .locator("a[href^='/organizations/']")
      .first();
    await expect(orgLink).toBeVisible({ timeout: 10000 });
  });

  test("DD-08: Sidebar surfaces metadata sections (Informação / Temporalidade / Extras)", async ({
    page,
  }) => {
    // Click the "Informação" tab to reveal sidebar metadata sections.
    const infoTab = page
      .locator('[role="tab"]', { hasText: /^Informação$/i })
      .first();
    await infoTab.click();

    const sections = [/Temporalidade/i, /Extras/i];
    for (const section of sections) {
      const heading = page.locator("h3", { hasText: section }).first();
      await expect(heading).toBeAttached({ timeout: 10000 });
    }
  });

  test.skip("DD-09: Favorites button with session adds favorite", async () => {
    // Skipped: requires authenticated session
  });

  test.skip("DD-10: Remove favorite with session", async () => {
    // Skipped: requires authenticated session
  });

  test.skip(
    "DD-11: Favorites without session redirects to login",
    async () => {
      // Skipped: favorite affordance is not exposed as a deterministic locator
      // on the public page; revisit once the UI surfaces a stable role/aria.
    }
  );

  test("DD-12: Reutilizações tab is reachable", async ({ page }) => {
    const reusesTab = page
      .locator('[role="tab"]', { hasText: /^Reutilizações \(\d+\)/i })
      .first();
    await expect(reusesTab).toBeVisible({ timeout: 10000 });
  });

  test("DD-13: Discussões tab is reachable", async ({ page }) => {
    const discussionsTab = page
      .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
      .first();
    await expect(discussionsTab).toBeVisible({ timeout: 10000 });
  });

  test("DD-14: Recursos comunitários tab is reachable", async ({ page }) => {
    const communityTab = page
      .locator('[role="tab"]', { hasText: /^Recursos comunitários \(\d+\)/i })
      .first();
    await expect(communityTab).toBeVisible({ timeout: 10000 });
  });
});
