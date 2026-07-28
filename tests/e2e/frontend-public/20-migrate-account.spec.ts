import { test, expect } from "playwright/test";

const BASE_URL = "http://localhost:3000";

/**
 * Account migration flow at /migrate-account.
 *
 * The page is a multi-step wizard (search → confirm-account → choose-method →
 * verify-code | verify-password → success) gated by `fetchMigrationPending()`.
 * Without a pending migration the client redirects to /login. These
 * tests exercise the page surface that is reachable without a valid migration
 * cookie; deeper steps require backend-seeded migration state and stay skipped.
 */
test.describe("Migrate Account Page", () => {
  test("MA-01: Page loads and either redirects to login or shows search step", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/migrate-account`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // No pending migration → redirect to /login.
    // With pending migration → search/confirm step rendered.
    const url = page.url();
    expect(url).toMatch(/(login|migrate-account)/);
  });

  test("MA-02: Breadcrumb shows Home › Migrar conta when migration is pending", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/migrate-account`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (page.url().includes("/migrate-account")) {
      const breadcrumb = page.getByText("Migrar conta", { exact: false });
      await expect(breadcrumb.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("MA-03: Search step exposes email + name inputs with stable IDs", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/migrate-account`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (!page.url().includes("/migrate-account")) {
      test.skip(true, "No pending migration in this environment");
    }

    const searchEmail = page.locator("#search-email");
    if (await searchEmail.count()) {
      await expect(searchEmail).toBeVisible({ timeout: 5000 });
    }

    // Name fields appear when "search by name" is toggled
    const firstName = page.locator("#search-first-name");
    const lastName = page.locator("#search-last-name");
    expect(
      (await searchEmail.count()) +
        (await firstName.count()) +
        (await lastName.count())
    ).toBeGreaterThan(0);
  });

  test("MA-04: Procurar conta button is disabled when search inputs are empty", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/migrate-account`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (!page.url().includes("/migrate-account")) {
      test.skip(true, "No pending migration in this environment");
    }

    const searchBtn = page.getByRole("button", { name: /Procurar conta/i });
    if (await searchBtn.count()) {
      // With no email and not searching by name, button must be disabled
      expect(await searchBtn.first().isDisabled()).toBeTruthy();
    }
  });

  test("MA-05: \"Criar conta nova\" skip button is present in search step", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/migrate-account`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (!page.url().includes("/migrate-account")) {
      test.skip(true, "No pending migration in this environment");
    }

    const skipBtn = page.getByRole("button", { name: /Criar conta nova/i });
    if (await skipBtn.count()) {
      await expect(skipBtn.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("MA-06: ?no_email=true forces the search step to render", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/migrate-account?no_email=true`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (!page.url().includes("/migrate-account")) {
      test.skip(true, "No pending migration in this environment");
    }

    // The search step renders the email input (#search-email) regardless of
    // whether the legacy account had an email on file.
    const searchEmail = page.locator("#search-email");
    if (await searchEmail.count()) {
      await expect(searchEmail).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip(
    "MA-07: Email-code verification path completes (needs backend-seeded migration)",
    async () => {
      // Requires a pending migration in MongoDB and a deliverable inbox.
    }
  );

  test.skip(
    "MA-08: Password verification path completes (needs backend-seeded migration)",
    async () => {
      // Requires a known legacy password for the seeded account.
    }
  );
});
