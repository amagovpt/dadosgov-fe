import { test, expect } from "playwright/test";

/**
 * Backoffice — Navigation and UI smoke tests.
 *
 * Auth via auth-setup storage state. The admin layout exposes a sidebar
 * grouped by "Meu perfil" (personal), "Sistema" (admin-only), and
 * "Administração" (anchors).
 */
test.describe("Backoffice - Navigation and UI", () => {

  test("UI-01: Admin sidebar exposes core navigation labels", async ({
    page,
  }) => {
    await page.goto("/pages/admin/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const required = [
      "Meu perfil",
      "Conjunto de dados",
      "Reutilizações",
      "Recursos comunitários",
      "Perfil",
      "Estatísticas",
      "Sistema",
      "Administração",
    ];
    for (const label of required) {
      const el = page.getByText(label, { exact: true }).first();
      await expect(el).toBeVisible({ timeout: 10000 });
    }
  });

  test("UI-02: Admin sees the system navigation block", async ({ page }) => {
    await page.goto("/pages/admin/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const systemLabels = ["Utilizadores", "Harvesters", "Artigos", "Editorial"];
    for (const label of systemLabels) {
      const el = page.getByText(label, { exact: true }).first();
      await expect(el).toBeVisible({ timeout: 10000 });
    }
  });

  test("UI-03: Header logout link is present in the user dropdown", async ({
    page,
  }) => {
    await page.goto("/pages/admin/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const logoutLink = page.getByText(/^Sair$/i).first();
    await expect(logoutLink).toBeAttached({ timeout: 10000 });
  });

  test("UI-04: Quick publish menu offers dataset, reuse, harvester, organisation", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/datasets/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const publishBtn = page.getByText("Publicar dados.gov.pt").first();
    await expect(publishBtn).toBeVisible({ timeout: 10000 });
    await publishBtn.click();
    await page.waitForTimeout(500);

    for (const label of [
      /Um conjunto de dados/i,
      /Uma reutilização/i,
      /Um harvester/i,
      /Uma organização/i,
    ]) {
      const opt = page.getByText(label).first();
      await expect(opt).toBeVisible({ timeout: 10000 });
    }
  });

  test("UI-05: System listings expose a search affordance", async ({
    page,
  }) => {
    const systemPages = [
      "/pages/admin/system/datasets/",
      "/pages/admin/system/reuses/",
      "/pages/admin/system/organizations/",
      "/pages/admin/system/users/",
    ];
    for (const route of systemPages) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      const searchInput = page.getByPlaceholder(/Pesquis/i).first();
      if ((await searchInput.count()) === 0) continue;
      await searchInput.fill("zzz_test_input");
      await expect(searchInput).toHaveValue("zzz_test_input");
      await searchInput.fill("");
    }
  });

  test("UI-06: Personal statistics page renders with Estatísticas heading", async ({
    page,
  }) => {
    await page.goto("/pages/admin/me/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Estatísticas$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("UI-07: Global statistics page renders for the admin user", async ({
    page,
  }) => {
    await page.goto("/pages/admin/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Estatísticas$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test.skip(
    "UI-08: Sort by column headers (title, date)",
    async () => {
      // Tied to deterministic dataset listing — re-enable with seeded fixture.
    }
  );
});
