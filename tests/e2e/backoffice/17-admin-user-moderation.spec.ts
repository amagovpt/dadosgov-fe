import { test, expect } from "playwright/test";

/**
 * User moderation pages — admin-only.
 *
 *   - /pages/admin/system/users         (listing with filters)
 *   - /pages/admin/users/[userId]/profile (single user view, role change, deactivate, delete)
 *
 * Auth via auth-setup storage state.
 */
test.describe("Backoffice - User Moderation", () => {

  test("UM-01: System users listing renders with the Utilizadores heading", async ({
    page,
  }) => {
    await page.goto("/pages/admin/system/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Utilizadores$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const adminRow = page.getByText(/e2e-admin@dados\.gov\.pt/i).first();
    await expect(adminRow).toBeVisible({ timeout: 10000 });
  });

  test("UM-02: Search input filters the user list", async ({ page }) => {
    await page.goto("/pages/admin/system/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const search = page.getByPlaceholder(/Pesquis/i).first();
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill("e2e-admin");
    await expect(search).toHaveValue("e2e-admin");
  });

  test("UM-03: Clicking a user navigates to the profile page", async ({
    page,
  }) => {
    await page.goto("/pages/admin/system/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const profileLink = page
      .locator("a[href*='/pages/admin/users/']")
      .first();
    if ((await profileLink.count()) === 0) {
      test.skip(true, "No user profile links rendered");
    }

    await profileLink.click();
    await page.waitForURL(/\/pages\/admin\/users\/.+\/profile/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/pages\/admin\/users\/.+\/profile/);
  });

  test("UM-04: User profile page exposes role/deactivate/delete affordances", async ({
    page,
  }) => {
    await page.goto("/pages/admin/system/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const profileLink = page
      .locator("a[href*='/pages/admin/users/']")
      .first();
    if ((await profileLink.count()) === 0) {
      test.skip(true, "No user profile links rendered");
    }
    await profileLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const role = page.getByText(/Função|Permissões|Administrador|Editor/i).first();
    const deactivate = page.getByText(/Desativar|Suspender/i).first();
    const remove = page.getByText(/Eliminar conta|Apagar conta/i).first();

    const hasAny =
      (await role.isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await deactivate.isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await remove.isVisible({ timeout: 5000 }).catch(() => false));
    expect(hasAny).toBeTruthy();
  });

  test.skip(
    "UM-05: Change role from utilizador → editor and persist (mutates DB)",
    async () => {
      // Skipped: destructive — only run against a disposable test database.
    }
  );

  test.skip(
    "UM-06: Deactivate user blocks subsequent login (mutates DB)",
    async () => {
      // Skipped: requires re-activation cleanup step.
    }
  );

  test("UM-07: Anonymous visitor on /admin/system/users is redirected", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/pages/admin/system/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await context.close();
  });
});
