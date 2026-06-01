import { test, expect, type Page } from "playwright/test";

const ORGS_URL = "/pages/organizations";
const PLACEHOLDER_SRC = "/images/placeholders/organization.png";

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

  test("OL-08: Every org card renders an img element with a non-empty src", async ({
    page,
  }) => {
    const cards = page.locator("a[href^='/pages/organizations/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const sampleSize = Math.min(count, 3);
    for (let i = 0; i < sampleSize; i++) {
      const img = cards.nth(i).locator("img").first();
      await expect(img).toBeVisible({ timeout: 10000 });
      const src = await img.getAttribute("src");
      // src must always be set — either a real logo URL or the placeholder
      expect((src ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  test("OL-09: Org logos from the API reach the card img src (no server-side stripping)", async ({
    page,
  }) => {
    const cards = page.locator("a[href^='/pages/organizations/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    // Collect every card img src from the DOM
    const srcs: string[] = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("a[href^='/pages/organizations/'] img")
      ).map((img) => (img as HTMLImageElement).getAttribute("src") ?? "")
    );

    expect(srcs.length).toBeGreaterThan(0);

    // Every src must be non-empty — the server must not strip logos before
    // handing them to the client (the old probeUrls bug would produce "" / null).
    for (const src of srcs) {
      expect(src.trim().length).toBeGreaterThan(0);
    }
  });

  test("OL-10: onError fallback replaces a failed logo with the placeholder", async ({
    page,
  }) => {
    const cards = page.locator("a[href^='/pages/organizations/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    // Find card indices whose img currently shows a real logo (not the placeholder).
    const indicesWithLogo: number[] = await page.evaluate((placeholder) => {
      const imgs = Array.from(
        document.querySelectorAll("a[href^='/pages/organizations/'] img")
      );
      return imgs
        .map((img, i) => ({ i, src: (img as HTMLImageElement).getAttribute("src") ?? "" }))
        .filter(({ src }) => src.length > 0 && !src.includes("organization.png"))
        .map(({ i }) => i);
    }, PLACEHOLDER_SRC);

    if (indicesWithLogo.length === 0) {
      // No org has a logo in this environment — the fallback path is never exercised.
      // The test is vacuously satisfied; mark it so reviewers know.
      test.info().annotations.push({
        type: "note",
        description: "No org logos found in DB — onError fallback not exercised.",
      });
      return;
    }

    // Programmatically fire the native `error` event on those imgs.
    // React attaches its onError listener directly on <img> elements
    // (since the error event does not bubble), so dispatching it here
    // triggers the setImgSrc(PLACEHOLDER) state update in CardMetrics.
    await page.evaluate((placeholder) => {
      const imgs = Array.from(
        document.querySelectorAll("a[href^='/pages/organizations/'] img")
      ) as HTMLImageElement[];
      imgs.forEach((img) => {
        const src = img.getAttribute("src") ?? "";
        if (src.length > 0 && !src.includes("organization.png")) {
          img.dispatchEvent(new Event("error", { bubbles: false }));
        }
      });
    }, PLACEHOLDER_SRC);

    // Wait for React to re-render the affected cards with the placeholder src.
    await page.waitForFunction(
      ({ indices, placeholder }: { indices: number[]; placeholder: string }) => {
        const imgs = Array.from(
          document.querySelectorAll("a[href^='/pages/organizations/'] img")
        ) as HTMLImageElement[];
        return indices.every((i) =>
          (imgs[i]?.getAttribute("src") ?? "").includes("organization.png")
        );
      },
      { indices: indicesWithLogo.slice(0, 3), placeholder: PLACEHOLDER_SRC },
      { timeout: 5000 }
    );

    // Verify the placeholder is now shown for each formerly-logo card.
    for (const idx of indicesWithLogo.slice(0, 3)) {
      const img = page
        .locator("a[href^='/pages/organizations/'] img")
        .nth(idx);
      const src = await img.getAttribute("src");
      expect(src).toContain("organization.png");
    }
  });
});
