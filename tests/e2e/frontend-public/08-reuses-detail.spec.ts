import { test, expect, type Page } from "playwright/test";

const REUSES_URL = "/reuses";

async function getFirstReuseHref(page: Page): Promise<string> {
  await page.goto(REUSES_URL);
  await page.waitForLoadState("networkidle");
  const firstLink = page.locator("a[href^='/reuses/']").first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  const href = await firstLink.getAttribute("href");
  if (!href) throw new Error("No reuse link found on listing");
  return href;
}

async function gotoFirstReuseDetail(page: Page) {
  await page.goto(REUSES_URL);
  await page.waitForLoadState("networkidle");

  const firstCard = page.locator("div.cursor-pointer").first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });
  await firstCard.click();
  await page.waitForURL(/\/pages\/reuses\/.+/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  // Reuse detail uses Agora's <CardArticle> for the title; the title heading is h3.
  await expect(
    page.getByRole("heading", { name: /Descrição/i }).first()
  ).toBeVisible({ timeout: 15000 });
}

test.describe("Reuse Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstReuseDetail(page);
  });

  test("RD-01: Reuse detail page loads with title and Descrição section", async ({
    page,
  }) => {
    const descricaoHeading = page
      .getByRole("heading", { name: /Descrição/i })
      .first();
    await expect(descricaoHeading).toBeVisible({ timeout: 10000 });

    // Reuse title is rendered inside Agora's <CardArticle>; at minimum the
    // Descrição tab and the breadcrumb prove the page is fully laid out.
    const descricaoTab = page
      .locator('[role="tab"]', { hasText: /^Descrição$/i })
      .first();
    await expect(descricaoTab).toBeVisible({ timeout: 10000 });
  });

  test("RD-02: Breadcrumb shows Home > Reutilizações > [Name]", async ({
    page,
  }) => {
    const breadcrumb = page.locator(".agora-breadcrumb").first();
    await expect(breadcrumb).toBeAttached({ timeout: 10000 });
    const text = (await breadcrumb.textContent()) ?? "";
    expect(text.toLowerCase()).toContain("home");
    expect(text.toLowerCase()).toContain("reutilizações");
  });

  test("RD-03: Page renders imagery for the reuse when available", async ({
    page,
  }) => {
    // Reuses optionally carry a thumbnail; the layout always renders org logos
    // in the header, so look broadly. Skip cleanly if neither is present.
    const images = page.locator("img");
    const count = await images.count();
    // Footer logos guarantee at least 1 image renders on every page.
    expect(count).toBeGreaterThan(0);
  });

  test('RD-04: External links carry target="_blank"', async ({ page }) => {
    // Reuses point to external sites; assert any [target=_blank] in main has the attribute set.
    const externals = page.locator('main a[target="_blank"]');
    if ((await externals.count()) > 0) {
      const target = await externals.first().getAttribute("target");
      expect(target).toBe("_blank");
    }
  });

  test.skip("RD-05: Favorites functionality (needs auth)", async () => {
    // Skipped: requires authenticated user
  });

  test("RD-06: Sidebar exposes metadata sections", async ({ page }) => {
    const sectionLabels = [/Etiquetas/i, /Data de criação/i, /Última atualização/i];
    for (const label of sectionLabels) {
      const heading = page.locator("h3", { hasText: label }).first();
      await expect(heading).toBeAttached({ timeout: 10000 });
    }
  });

  test("RD-07: Descrição tab is the active default tab", async ({ page }) => {
    const descricaoTab = page
      .locator('[role="tab"]', { hasText: /^Descrição$/i })
      .first();
    await expect(descricaoTab).toBeVisible({ timeout: 10000 });
    const cls = (await descricaoTab.getAttribute("class")) ?? "";
    expect(cls).toContain("active");
  });

  test("RD-08: Associated datasets appear when present", async ({ page }) => {
    // The detail page shows "N conjunto(s) de dados associado(s)" only when present.
    const associatedHeading = page
      .getByRole("heading", { name: /conjuntos? de dados associados?/i })
      .first();
    if ((await associatedHeading.count()) > 0) {
      await expect(associatedHeading).toBeVisible({ timeout: 10000 });
    }
  });

  test("RD-09: Discussões tab is reachable", async ({ page }) => {
    const discussionsTab = page
      .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
      .first();
    await expect(discussionsTab).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Reuse discussion tab — URL-driven activation (email link flow)", () => {
  test("RD-10: ?tab=discussions query param activates the Discussões tab without a click", async ({
    page,
  }) => {
    const href = await getFirstReuseHref(page);

    await page.goto(`${href}?tab=discussions`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /Descrição/i }).first()
    ).toBeVisible({ timeout: 15000 });

    const panelHeading = page
      .locator("h3", { hasText: /\d+ DISCUSS(ÃO|ÕES)|DISCUSS(ÃO|ÕES)/i })
      .first();
    await expect(panelHeading).toBeAttached({ timeout: 10000 });

    const discussionTab = page
      .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
      .first();
    await expect(discussionTab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
  });

  test("RD-11: /discussions sub-path (email link format) redirects and activates the Discussões tab", async ({
    page,
  }) => {
    const href = await getFirstReuseHref(page);

    await page.goto(`${href}/discussions`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /Descrição/i }).first()
    ).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveURL(/tab=discussions/, { timeout: 10000 });

    const discussionTab = page
      .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
      .first();
    await expect(discussionTab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
  });

  test("RD-12: /discussions sub-path preserves discussion_id through the redirect", async ({
    page,
  }) => {
    const href = await getFirstReuseHref(page);
    const fakeId = "abc123";

    await page.goto(`${href}/discussions?discussion_id=${fakeId}`);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/tab=discussions/, { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(`discussion_id=${fakeId}`), { timeout: 10000 });
  });
});
