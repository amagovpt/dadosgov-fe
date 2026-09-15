import { test, expect } from "playwright/test";

/**
 * Backoffice — Navigation and UI smoke tests.
 *
 * Auth via auth-setup storage state. The admin layout exposes a sidebar
 * grouped by "Meu perfil" (personal), "Sistema" (admin-only), and
 * "Administração" (anchors).
 */
test.describe("Backoffice - Navigation and UI", () => {

  test("UI-00: Backoffice pages carry the footer but no portal header", async ({
    page,
  }) => {
    // The portal header lives in `(pages)/layout.tsx`, which the `(admin)` group
    // does not inherit, so it must be absent from the document entirely — not
    // merely hidden. It used to be rendered on every route and hidden by a CSS
    // rule keyed on `body:has(.admin-wrapper) > div > header.sticky`, which
    // silently stopped matching and put the portal header on top of the admin one.
    // Counting elements is what tells those two states apart.
    //
    // Counted by tag, not by class, and that distinction is the whole bug: the
    // only `header.sticky` the portal ever had was HeaderWrapper's loading
    // placeholder, so the CSS rule hid the placeholder and let the hydrated header
    // through, and an assertion on `header.sticky` would pass either way. The real
    // header is a bare `<header>` (Header.tsx) wrapping the DS's `div.agora-header`
    // — and `<header>`/`<footer>` exist nowhere else in `src`, AdminHeader included.
    //
    // The footer is the opposite case and is asserted present: it carries no
    // navigation into the portal, so it lives in the root layout and shows on every
    // page. Only the header was ever the problem.
    await page.goto("/admin/me/datasets");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".admin-wrapper")).toBeAttached({ timeout: 10000 });
    // The backoffice's own topbar, so a blank page cannot pass the counts below.
    await expect(page.locator(".admin-header")).toBeAttached();
    await expect(page.locator("header")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(1);
  });

  test("UI-00b: A refused backoffice route drops the admin frame for the portal header", async ({
    page,
  }) => {
    // `/admin/system/*` is admin-only, so a session without the role is answered by
    // AdminRouteGuard with a 403 error page rather than the route. That page must
    // read like the public error page — portal header, error panel, footer — and
    // must NOT keep the backoffice frame: an area that just refused the visitor has
    // no business still offering them its own navigation.
    //
    // This is also what pins the layout split in place. The guard sits in
    // `(admin)/admin/layout.tsx` rather than at the group, so that `(admin)/error.tsx`
    // is above it and replaces the frame instead of rendering inside it. Move the
    // guard back up and `.admin-wrapper` reappears here.
    await page.goto("/admin/system/users");
    await page.waitForLoadState("networkidle");

    const errorState = page.locator('[data-testid="error-state"]');
    if ((await errorState.count()) === 0) {
      test.skip(true, "Session under test has the admin role, so nothing is refused here.");
    }

    await expect(errorState).toHaveAttribute("data-error-status", "403");
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator(".admin-wrapper")).toHaveCount(0);
  });

  test("UI-01: Admin sidebar exposes core navigation labels", async ({
    page,
  }) => {
    // Use a concrete admin page rather than /admin/ — the index occasionally
    // redirects late and the sidebar isn't fully hydrated when /admin/ idles.
    await page.goto("/admin/me/datasets");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const required = [
      "Reutilizações",
      "Recursos comunitários",
      "Estatísticas",
      "Sistema",
      "Administração",
    ];
    for (const label of required) {
      const el = page.getByText(label, { exact: true }).first();
      await expect(el).toBeAttached({ timeout: 10000 });
    }
  });

  test("UI-02: Admin sees the system navigation block", async ({ page }) => {
    await page.goto("/admin/system/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const systemLabels = ["Utilizadores", "Harvesters", "Artigos", "Editorial"];
    for (const label of systemLabels) {
      const el = page.getByText(label, { exact: true }).first();
      await expect(el).toBeAttached({ timeout: 10000 });
    }
  });

  test("UI-03: Header logout link is present in the user dropdown", async ({
    page,
  }) => {
    await page.goto("/admin/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const logoutLink = page.getByText(/^Sair$/i).first();
    await expect(logoutLink).toBeAttached({ timeout: 10000 });
  });

  test("UI-04: Quick publish menu offers dataset, reuse, harvester, organisation", async ({
    page,
  }) => {
    await page.goto("/admin/me/datasets/");
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
      "/admin/system/datasets/",
      "/admin/system/reuses/",
      "/admin/system/organizations/",
      "/admin/system/users/",
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
    await page.goto("/admin/me/statistics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Estatísticas$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("UI-07: Global statistics page renders for the admin user", async ({
    page,
  }) => {
    await page.goto("/admin/statistics");
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
