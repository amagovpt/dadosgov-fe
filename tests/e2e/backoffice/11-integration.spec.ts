import { test, expect } from "playwright/test";

/**
 * Backoffice — Integration / cross-flow scenarios.
 *
 * Auth via auth-setup storage state. Original suite included scenarios that
 * span multiple modules (publish dataset → reuse it → delete original).
 * Those depend on seeded fixtures and disposable database state, so they
 * stay skipped until that tooling is in place.
 */
test.describe("Backoffice - Integration smoke tests", () => {

  test("IT-01: Admin can navigate from /admin to system datasets", async ({
    page,
  }) => {
    await page.goto("/admin/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const datasetsLink = page
      .locator('a[href="/admin/system/datasets"]')
      .first();
    if ((await datasetsLink.count()) === 0) return;

    await datasetsLink.click();
    await page.waitForURL(/\/pages\/admin\/system\/datasets/, {
      timeout: 10000,
    });
    expect(page.url()).toContain("/admin/system/datasets");
  });

  test("IT-02: Admin can reach the publish dropdown from any backoffice page", async ({
    page,
  }) => {
    const routes = [
      "/admin/me/datasets",
      "/admin/system/users",
      "/admin/system/posts",
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      const publishBtn = page.getByText("Publicar dados.gov.pt").first();
      await expect(publishBtn).toBeVisible({ timeout: 10000 });
    }
  });

  test.skip("IT-03: Publish dataset flow end-to-end", async () => {
    // Destructive — needs a disposable test database.
  });

  test.skip("IT-04: Reuse referencing a dataset survives dataset rename", async () => {
    // Requires a seeded dataset + reuse pair and reset hooks.
  });

  test.skip("IT-05: Deleting an org cascades to its datasets and reuses", async () => {
    // Destructive — needs a disposable test database.
  });

  test.skip("IT-06: Search on public portal reflects newly published dataset", async () => {
    // Requires Elasticsearch reindex window + cleanup.
  });
});
