import { test, expect } from "playwright/test";

/**
 * Backoffice — Topics.
 *
 * Auth via auth-setup storage state. Listing at /admin/system/topics; the
 * test database is empty so empty-state copy is rendered. Heavy CRUD
 * scenarios stay skipped.
 */
test.describe("Backoffice - Topics CRUD", () => {

  test("TP-01: System topics listing renders with Temas heading", async ({
    page,
  }) => {
    await page.goto("/admin/system/topics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /^Temas$/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("TP-02: Empty-state copy or topic rows are rendered", async ({
    page,
  }) => {
    await page.goto("/admin/system/topics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const emptyCopy = page.getByText(/Sem temas|Nenhum tema/i);
    const topicRows = page.locator("tbody tr");
    expect(((await emptyCopy.count()) > 0) || ((await topicRows.count()) > 0)).toBeTruthy();
  });

  test.skip("TP-03: Create new topic", async () => {
    // Destructive — needs cleanup of created topic.
  });

  test.skip("TP-04: Edit topic and persist", async () => {
    // Requires existing topic + cleanup hook.
  });

  test.skip("TP-05: Delete topic", async () => {
    // Destructive — needs a disposable test database.
  });
});
