import { test, expect } from "playwright/test";

// The route is /posts (the "articles" naming is internal to the spec).
const POSTS_URL = "/posts";

test.describe("Articles (Posts) Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POSTS_URL);
    await page.waitForLoadState("networkidle");
  });

  test("NT-01: Page loads with banner, search and post cards", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", {
      name: /Últimas novidades/i,
      level: 1,
    });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator("#articles-search");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const cards = page.locator("a[href^='/posts/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test("NT-02: Posts have href slugs", async ({ page }) => {
    const firstCard = page.locator("a[href^='/posts/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/^\/pages\/posts\/[a-z0-9-]+/);
  });

  test("NT-03: Search field accepts input", async ({ page }) => {
    const searchInput = page.locator("#articles-search");
    await searchInput.fill("dados");
    await expect(searchInput).toHaveValue("dados");
  });

  test("NT-04: Listing renders multiple posts", async ({ page }) => {
    const cards = page.locator("a[href^='/posts/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
  });

  test("NT-05: Click card opens article detail with title and breadcrumb", async ({
    page,
  }) => {
    const firstLink = page.locator("a[href^='/posts/']").first();
    await expect(firstLink).toBeVisible({ timeout: 15000 });
    await firstLink.click();
    await page.waitForURL(/\/pages\/posts\/.+/, { timeout: 15000 });

    const heading = page.locator("main h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const breadcrumb = page.locator(".agora-breadcrumb").first();
    await expect(breadcrumb).toBeAttached({ timeout: 10000 });
    expect((await breadcrumb.textContent())?.toLowerCase() ?? "").toContain(
      "notícias"
    );
  });

  test("NT-06: Article detail renders body content", async ({ page }) => {
    const firstLink = page.locator("a[href^='/posts/']").first();
    await firstLink.click();
    await page.waitForURL(/\/pages\/posts\/.+/, { timeout: 15000 });

    const main = page.locator("main");
    const text = (await main.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(200);
  });
});
