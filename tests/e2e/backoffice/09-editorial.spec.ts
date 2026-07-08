import { test, expect } from "playwright/test";

/**
 * Backoffice — Editorial layout.
 *
 * Auth via auth-setup storage state. The editor at /admin/system/editorial
 * lets admins customise the homepage layout. Heavy CRUD scenarios that
 * mutate the live homepage stay skipped — re-enable with snapshot/restore tooling.
 */
test.describe("Backoffice - Editorial", () => {

  test("ED-01: Editorial page renders with Editorial heading", async ({
    page,
  }) => {
    await page.goto("/admin/system/editorial");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Editorial$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("ED-02: Editorial page exposes 'Adicionar um bloco' affordance", async ({
    page,
  }) => {
    await page.goto("/admin/system/editorial");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const addBlock = page.getByText(/Adicionar um bloco/i).first();
    await expect(addBlock).toBeVisible({ timeout: 10000 });
  });

  test.skip("ED-03: Add a featured block to the layout", async () => {
    // Modifies the live homepage — needs snapshot/restore tooling.
  });

  test.skip("ED-04: Reorder blocks via drag-and-drop", async () => {
    // Modifies the live homepage — needs snapshot/restore tooling.
  });

  test.skip("ED-05: Delete a block", async () => {
    // Destructive — modifies live homepage layout.
  });
});
