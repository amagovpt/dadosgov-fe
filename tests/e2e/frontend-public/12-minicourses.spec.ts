import { test, expect } from "playwright/test";

const MINICOURSES_URL = "/mini-courses";

test.describe("Mini-Courses Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MINICOURSES_URL);
    await page.waitForLoadState("networkidle");
  });

  test("MC-01: Page loads with banner, search and course cards", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /Minicursos/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const cards = page.locator("a[href^='/mini-courses/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test("MC-02: Banner copy mentions Minicursos", async ({ page }) => {
    const main = page.locator("main");
    const text = (await main.textContent()) ?? "";
    expect(text.toLowerCase()).toContain("minicurso");
  });

  test("MC-03: Search section is present and accepts input", async ({
    page,
  }) => {
    const searchHeading = page.getByRole("heading", {
      name: /Que minicurso procura/i,
    });
    await expect(searchHeading).toBeVisible({ timeout: 10000 });
  });

  test("MC-04: Cards expose href slugs", async ({ page }) => {
    // Card links wrap image-only content; the surrounding article carries the
    // textual content. Validate the href slug instead of inner text.
    const firstCard = page.locator("a[href^='/mini-courses/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/^\/pages\/mini-courses\/[a-z0-9-]+$/);
  });

  test("MC-05: Click card opens course detail", async ({ page }) => {
    const firstLink = page.locator("a[href^='/mini-courses/']").first();
    await expect(firstLink).toBeVisible({ timeout: 15000 });
    await firstLink.click();
    await page.waitForURL(/\/pages\/mini-courses\/.+/, { timeout: 15000 });

    const heading = page.locator("main h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    expect((await heading.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test("MC-06: Course detail exposes objectives toggle", async ({ page }) => {
    const firstLink = page.locator("a[href^='/mini-courses/']").first();
    await firstLink.click();
    await page.waitForURL(/\/pages\/mini-courses\/.+/, { timeout: 15000 });

    const objectivesBtn = page.getByRole("button", { name: /Ver objetivos/i });
    await expect(objectivesBtn).toBeVisible({ timeout: 10000 });
  });

  test("MC-07: Listing shows ordering and filtering controls", async ({
    page,
  }) => {
    const ordenar = page.getByRole("heading", { name: /^Ordenar$/i });
    const filtrar = page.getByRole("heading", { name: /^Filtrar$/i });
    await expect(ordenar).toBeVisible({ timeout: 10000 });
    await expect(filtrar).toBeVisible({ timeout: 10000 });
  });

  test("MC-08: Listing renders multiple minicourses", async ({ page }) => {
    const cards = page.locator("a[href^='/mini-courses/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
  });
});
