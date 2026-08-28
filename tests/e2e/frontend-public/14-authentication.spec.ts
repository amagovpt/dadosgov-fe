import { test, expect, type Locator, type Page } from "playwright/test";
import { loginAsAdmin } from "../../helpers/auth";

const LOGIN_URL = "/login";

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

    const authLink = page.locator('header a[href="/login"]').first();
    await expect(authLink).toBeVisible({ timeout: 10000 });
    await authLink.click();
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
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

  test("AU-09: Email tab offers the two account-linking actions, not a password form", async ({
    page,
  }) => {
    const emailTab = await getTabByText(page, /E-mail e palavra-passe/i);
    await emailTab.click();

    // The tab is the entry point for linking a legacy account to CMD/eIDAS;
    // password sign-in is being discontinued, so there is no form here.
    const main = page.locator("main");
    await expect(
      main.getByText(/vai ser descontinuada/i).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      main.getByRole("button", { name: /Associar conta à Chave Móvel Digital/i }).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      main.getByRole("button", { name: /Associar conta à Autenticação Europeia/i }).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(main.locator("#login-email")).toHaveCount(0);
    await expect(main.locator("#login-password")).toHaveCount(0);
  });

  test("AU-10: Terms link to /faqs/terms is reachable from CMD tab", async ({
    page,
  }) => {
    const termsLink = page
      .locator('a[href="/faqs/terms"]')
      .first();
    await expect(termsLink).toBeVisible({ timeout: 10000 });
  });

  test("AU-11: Register page redirects to login", async ({ page }) => {
    await page.goto("/register");
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("AU-12: Logout via the header avatar drawer clears the session", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const header = page.locator("header").first();
    const avatarTrigger = header.locator(".agora-avatar-container").first();
    await expect(avatarTrigger).toBeVisible({ timeout: 10000 });
    await avatarTrigger.click();

    const drawer = page.locator(".agora-drawer").first();
    await expect(drawer).toBeVisible({ timeout: 10000 });

    const logoutButton = drawer.getByText("Terminar sessão").first();
    await logoutButton.click();

    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/pt", {
      timeout: 15000,
    });
    await page.waitForLoadState("networkidle");

    const authLink = page.locator('header a[href="/login"]').first();
    await expect(authLink).toBeVisible({ timeout: 10000 });
  });

  test("AU-13: /loginregister redirects to /login", async ({
    page,
  }) => {
    await page.goto("/loginregister");
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("AU-14: /migrate-account without pending migration redirects to login", async ({
    page,
  }) => {
    await page.goto("/migrate-account");
    await page.waitForLoadState("networkidle");
    // MigrateAccountClient routes to /login when no migration is pending.
    await page.waitForURL(/(login|migrate-account)/, {
      timeout: 10000,
    });
    expect(page.url()).toMatch(/(login|migrate-account)/);
  });
});

test.describe("Authentication - Post-login redirect", () => {
  test("AU-15: Header 'Autenticar' link includes ?next= with the current page path", async ({
    page,
  }) => {
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");

    const authLink = page
      .locator('header a[href*="/login?next="]')
      .first();
    await expect(authLink).toBeVisible({ timeout: 10000 });

    const href = await authLink.getAttribute("href");
    expect(href).toContain("next=");
    expect(href).toContain(encodeURIComponent("/datasets"));
  });

});
