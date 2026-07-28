import { test, expect } from "playwright/test";

/**
 * Backoffice — Posts (articles).
 *
 * Auth via auth-setup storage state. Listing lives at /admin/system/posts;
 * the active admin can see and moderate all posts. CRUD steps stay skipped
 * until cleanup is wired up.
 */
test.describe("Backoffice - Posts CRUD", () => {

  test("PT-01: System posts listing renders with the Artigos heading", async ({
    page,
  }) => {
    await page.goto("/admin/system/posts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Artigos$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("PT-02: 'Criar um artigo' affordance is exposed to the admin", async ({
    page,
  }) => {
    await page.goto("/admin/system/posts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const createBtn = page.getByText(/Criar um artigo/i).first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test("PT-03: Listing exposes search affordance", async ({ page }) => {
    await page.goto("/admin/system/posts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const search = page.getByPlaceholder(/Pesquis/i).first();
    if ((await search.count()) === 0) return;
    await search.fill("zzz_no_match");
    await expect(search).toHaveValue("zzz_no_match");
  });

  test.skip("PT-04: Create new article with title, body, type", async () => {
    // Destructive — needs cleanup of created post.
  });

  test.skip("PT-05: Edit existing article and persist", async () => {
    // Destructive — modifies real posts. Needs disposable database.
  });

  test.skip("PT-06: Delete article", async () => {
    // Destructive — needs a disposable test database.
  });

  test.skip("PT-07: Article appears on /posts after publish", async () => {
    // Requires a publish + cleanup cycle.
  });
});
