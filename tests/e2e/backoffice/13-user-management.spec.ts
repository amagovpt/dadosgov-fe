import { test, expect } from "playwright/test";

/**
 * Backoffice — Personal account management.
 *
 * Auth via auth-setup storage state. Profile editor at /admin/me/profile
 * exposes name/email/avatar/api-keys. Heavy mutation scenarios (changing
 * the name, uploading an avatar) stay skipped to keep the suite idempotent.
 */
test.describe("Backoffice - User Account Management", () => {

  test("UA-01: Profile editor renders with Perfil heading", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Perfil$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("UA-02: Profile editor exposes name, surname and bio labels", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await expect(page.getByText(/^Nome \*$/).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Último nome \*/).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Biografia/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("UA-03: Profile editor exposes the API keys section", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const apiKeysHeading = page
      .getByText(/Chaves da API/i)
      .first();
    await expect(apiKeysHeading).toBeVisible({ timeout: 10000 });
  });

  test("UA-04: Profile editor exposes activities/subscriptions navigation", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await expect(page.getByText(/Atividades/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Subscrições/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Acompanhamentos/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test.skip("UA-05: Update first name and persist on reload", async () => {
    // Mutates the seeded admin profile — re-enable when restore hook is wired.
  });

  test.skip("UA-06: Generate and rotate API key", async () => {
    // Mutates real backend state.
  });

  test.skip("UA-07: Upload avatar image", async () => {
    // Requires fixture image + cleanup.
  });
});
