import { test, expect } from "playwright/test";

const UNKNOWN_SLUG_URL = "/pages/users/this-user-cannot-exist-xyz123";

test.describe("User Profile Page - Public Shell (unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto(UNKNOWN_SLUG_URL);
    expect(response?.status()).toBeLessThan(500);
    await page.waitForLoadState("networkidle");
  });

  test('PF-01: Profile page renders without crashing and shows "Perfil" heading', async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /^Perfil$/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("PF-02: Subscriptions button always renders (shows 0 count when unauthenticated)", async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /Subscrições?/i }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toContainText(/\d+/);
  });

  test("PF-03: Acompanhamentos button always renders (shows 0 count when unauthenticated)", async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /Acompanhamentos?/i }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toContainText(/\d+/);
  });

  test("PF-04: Clicking Subscrições toggles the subscriptions section", async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /Subscrições?/i }).first();
    await btn.click();

    // "Sem subscrições" is unique to the section; the button itself says "N Subscrições"
    const emptyState = page.getByText(/Sem subscrições/i).first();
    await expect(emptyState).toBeVisible({ timeout: 8000 });

    // Clicking again collapses the section
    await btn.click();
    await page.waitForTimeout(300);
    await expect(emptyState).not.toBeVisible({ timeout: 5000 });
  });

  test("PF-05: Datasets section renders with heading and empty state", async ({
    page,
  }) => {
    const datasetsHeading = page.getByText(/Conjuntos de dados/i).first();
    await expect(datasetsHeading).toBeVisible({ timeout: 10000 });

    const emptyState = page.getByText(/Sem conjuntos de dados/i).first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });
  });

  test("PF-06: Reuses section renders with heading and empty state", async ({
    page,
  }) => {
    const reusesHeading = page.getByText(/Reutilizações?/i).first();
    await expect(reusesHeading).toBeVisible({ timeout: 10000 });

    const emptyState = page.getByText(/Sem reutilizações/i).first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });
  });

  test('PF-07: "Editar o meu perfil" button is absent when not authenticated', async ({
    page,
  }) => {
    const editBtn = page.getByRole("button", { name: /Editar o meu perfil/i });
    await expect(editBtn).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    expect(await editBtn.count()).toBe(0);
  });
});
