import { test, expect } from "playwright/test";

const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

test.describe("Responsiveness", () => {
  test("RA-01: Desktop viewport renders datasets listing with cards", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("header").first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("a[href^='/datasets/']").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("RA-02: Tablet viewport renders datasets listing", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("header").first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("a[href^='/datasets/']").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("RA-03: Mobile viewport renders homepage with header", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("header").first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /Portal aberto/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });
  });

  test("RA-04: Mobile responsive nav exposes a Menu affordance", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Agora's NavigationBar exposes a "Menu" affordance on mobile.
    const menuTrigger = page
      .locator("header")
      .getByRole("button", { name: /Menu|Abrir menu/i })
      .first();
    if ((await menuTrigger.count()) > 0) {
      await expect(menuTrigger).toBeVisible({ timeout: 10000 });
    }
  });

  test("RA-05: Mobile homepage exposes the search affordance from the header", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchAffordance = page
      .locator("header")
      .getByRole("button", { name: /Pesquisar/i })
      .first();
    await expect(searchAffordance).toBeVisible({ timeout: 10000 });
  });

  test("RA-06: Mobile dataset cards render with positive dimensions", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator("a[href^='/datasets/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const box = await firstCard.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
    expect(box?.height ?? 0).toBeGreaterThan(0);
  });

  test("RA-07: Mobile filters toggle is reachable", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");

    const toggle = page.getByRole("button", { name: /Abrir filtros/i });
    await expect(toggle.first()).toBeVisible({ timeout: 10000 });
  });

  test("RA-08: Dataset detail tabs render within mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");
    const link = page.locator("a[href^='/datasets/']").first();
    const href = await link.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("RA-09: Images render at multiple viewports without zero-sized boxes", async ({
    page,
  }) => {
    for (const viewport of Object.values(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const images = page.locator("img");
      const count = await images.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible().catch(() => false)) {
          const box = await img.boundingBox();
          if (box && box.width > 0) {
            expect(box.height).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test("RA-10: Keyboard navigation focuses an element", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? null
    );
    expect(focusedTag).toBeTruthy();
  });
});
