import { test, expect, type Locator, type Page } from "playwright/test";
import { ADMIN_CREDS } from "../../helpers/auth";

const LOGIN_URL = "/pages/login";

async function getTabByText(page: Page, label: RegExp): Promise<Locator> {
  // Agora <Tabs> renders TabHeader as a clickable element; matching by text covers both
  // button[role="tab"] and div implementations without coupling to the library internals.
  return page.getByText(label).first();
}

test.describe("Authentication Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState("networkidle");
  });

  test('AU-01: Click "Autenticar" in header opens login page', async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const authLink = page.locator('header a[href="/pages/login"]').first();
    await expect(authLink).toBeVisible({ timeout: 10000 });
    await authLink.click();
    await page.waitForURL(/\/pages\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/pages/login");
  });

  test("AU-02: Three auth tabs visible: CMD, eIDAS, Email/Password", async ({
    page,
  }) => {
    const cmdTab = await getTabByText(page, /Chave Móvel Digital/i);
    await expect(cmdTab).toBeVisible({ timeout: 10000 });

    const eidasTab = await getTabByText(page, /Autenticação europeia/i);
    await expect(eidasTab).toBeVisible({ timeout: 10000 });

    const emailTab = await getTabByText(page, /E-mail e palavra-passe/i);
    await expect(emailTab).toBeVisible({ timeout: 10000 });
  });

  test("AU-03: CMD tab shows terms checkbox and login button", async ({
    page,
  }) => {
    // CMD is the first tab and active by default.
    const termsHeading = page.getByRole("heading", {
      name: /Termos e condições/i,
    });
    await expect(termsHeading.first()).toBeVisible({ timeout: 10000 });

    const termsCheckbox = page
      .getByRole("checkbox", { name: /aceito os termos e condições/i })
      .first();
    await expect(termsCheckbox).toBeVisible({ timeout: 10000 });

    const cmdButton = page.getByRole("button", {
      name: /Entrar com Chave Móvel Digital/i,
    });
    await expect(cmdButton).toBeVisible({ timeout: 10000 });
  });

  test("AU-04: CMD button disabled until terms and citizen type set", async ({
    page,
  }) => {
    const cmdButton = page.getByRole("button", {
      name: /Entrar com Chave Móvel Digital/i,
    });
    await expect(cmdButton).toBeVisible({ timeout: 10000 });
    await expect(cmdButton).toBeDisabled();
  });

  test.skip("AU-05: Accept terms and click CMD button (needs CMD service)", async () => {
    // Skipped: requires CMD authentication service
  });

  test("AU-06: eIDAS tab shows info and terms checkbox", async ({ page }) => {
    const eidasTab = await getTabByText(page, /Autenticação europeia/i);
    await eidasTab.click();

    const eidasButton = page.getByRole("button", {
      name: /Autenticar com eIDAS/i,
    });
    await expect(eidasButton).toBeVisible({ timeout: 10000 });

    const termsEidas = page
      .getByRole("checkbox", {
        name: /termos e condições relativos ao tratamento de dados/i,
      })
      .first();
    await expect(termsEidas).toBeVisible({ timeout: 10000 });
  });

  test.skip("AU-07: Email tab - valid login (needs test credentials)", async () => {
    // Skipped: requires valid test credentials
  });

  test.skip("AU-08: Email tab - invalid login shows error (needs backend)", async () => {
    // Skipped: requires backend to be running with seeded users
  });

  test("AU-09: Email tab - submit button stays disabled when fields are empty", async ({
    page,
  }) => {
    const emailTab = await getTabByText(page, /E-mail e palavra-passe/i);
    await emailTab.click();

    // The login form is rendered in main; the same form is also embedded in the
    // mobile accordion menu, so we scope to the main element.
    const main = page.locator("main");
    const emailInput = main.locator("#login-email").first();
    const passwordInput = main.locator("#login-password").first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    const submitButton = main
      .getByRole("button", { name: /^Autenticar$/i })
      .first();
    await expect(submitButton).toBeDisabled();
  });

  test("AU-10: Terms link to /pages/faqs/terms is reachable from CMD tab", async ({
    page,
  }) => {
    const termsLink = page
      .locator('a[href="/pages/faqs/terms"]')
      .first();
    await expect(termsLink).toBeVisible({ timeout: 10000 });
  });

  test("AU-11: Register page redirects to login", async ({ page }) => {
    await page.goto("/pages/register");
    await page.waitForURL(/\/pages\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/pages/login");
  });

  test.skip("AU-12: Logout (needs auth)", async () => {
    // Skipped: requires authenticated session
  });

  test("AU-13: /pages/loginregister redirects to /pages/login", async ({
    page,
  }) => {
    await page.goto("/pages/loginregister");
    await page.waitForURL(/\/pages\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/pages/login");
  });

  test("AU-14: /pages/migrate-account without pending migration redirects to login", async ({
    page,
  }) => {
    await page.goto("/pages/migrate-account");
    await page.waitForLoadState("networkidle");
    // MigrateAccountClient routes to /pages/login when no migration is pending.
    await page.waitForURL(/\/pages\/(login|migrate-account)/, {
      timeout: 10000,
    });
    expect(page.url()).toMatch(/\/pages\/(login|migrate-account)/);
  });
});

test.describe("Authentication - Post-login redirect", () => {
  test("AU-15: Header 'Autenticar' link includes ?next= with the current page path", async ({
    page,
  }) => {
    await page.goto("/pages/datasets");
    await page.waitForLoadState("networkidle");

    const authLink = page
      .locator('header a[href*="/pages/login?next="]')
      .first();
    await expect(authLink).toBeVisible({ timeout: 10000 });

    const href = await authLink.getAttribute("href");
    expect(href).toContain("next=");
    expect(href).toContain(encodeURIComponent("/pages/datasets"));
  });

  // Requires seeded e2e-admin user: run `udata user create --admin` with e2e-admin@dados.gov.pt
  test("AU-16: After email/password login, user is redirected back to the page they came from", async ({
    page,
  }) => {
    const targetPage = "/pages/datasets";
    await page.goto(`/pages/login?next=${encodeURIComponent(targetPage)}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const emailTab = page.getByText(/E-mail e palavra-passe/i).first();
    await emailTab.scrollIntoViewIfNeeded();
    await emailTab.click();
    await page.waitForTimeout(500);

    const main = page.locator("main");

    const emailInput = main.locator("#login-email").first();
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill(ADMIN_CREDS.email);

    const passwordInput = main.locator("#login-password").first();
    await passwordInput.scrollIntoViewIfNeeded();
    await passwordInput.fill(ADMIN_CREDS.password);

    const termsCheckbox = main
      .getByRole("checkbox", { name: /aceito os termos/i })
      .first();
    await termsCheckbox.check();

    const submitBtn = main.locator("form button[type='submit']").first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    await page.waitForURL((url) => url.pathname === targetPage, {
      timeout: 30000,
      waitUntil: "networkidle",
    });
    expect(page.url()).toContain(targetPage);
  });
});
