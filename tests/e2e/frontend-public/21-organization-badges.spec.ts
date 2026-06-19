import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";

// The e2e seed (backend/scripts/seed_e2e_fixtures.py) gives the E2E Test
// Organization the badges "public-service" and "certified". These tests cover
// LEDG-1919: those backoffice-assigned etiquetas must be visible in the
// frontoffice (organization detail page + listing cards).

const { organization } = loadFixtures();

const BADGE_LABELS = ["Serviço público", "Certificado"];

test.describe("Organization Badges (frontoffice visibility)", () => {
  test("OB-01: Detail page shows the organization's badges as pills", async ({ page }) => {
    await page.goto(`/pages/organizations/${organization.slug}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });

    for (const label of BADGE_LABELS) {
      const pill = page.locator(".agora-pill", { hasText: new RegExp(`^${label}$`, "i") });
      await expect(pill.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("OB-02: Badges are rendered as neutral outline pills (not solid)", async ({ page }) => {
    await page.goto(`/pages/organizations/${organization.slug}`);
    await page.waitForLoadState("networkidle");

    const pill = page
      .locator(".agora-pill", { hasText: /^Serviço público$/i })
      .first();
    await expect(pill).toBeVisible({ timeout: 15000 });
    // The outline style keeps a transparent/white background (no solid fill).
    await expect(pill).toHaveClass(/agora-pill-outline-neutral/);
  });

  test("OB-03: Listing card shows the organization's badges", async ({ page }) => {
    await page.goto("/pages/organizations");
    await page.waitForLoadState("networkidle");

    // Narrow the 500+ results down to the seeded org via search.
    const search = page.locator("#organizations-search");
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill(organization.name);
    await search.press("Enter");
    await page.waitForURL(/q=/, { timeout: 10000 });

    const card = page.locator(`a[href$="/${organization.slug}"]`).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    for (const label of BADGE_LABELS) {
      await expect(
        card.locator(".agora-pill", { hasText: new RegExp(`^${label}$`, "i") }).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
