import { Page } from "playwright/test";

/**
 * Authenticate via the email/password tab. Used by both:
 *   - the storage-state setup (runs once, saves cookies to disk)
 *   - any spec that explicitly logs in via the UI
 *
 * The login page exposes 3 Agora tabs: "Chave Móvel Digital (CMD)",
 * "Autenticação europeia (eIDAS)", and "E-mail e palavra-passe". The form is
 * also embedded in the mobile menu accordion, so we scope to <main> to avoid
 * strict-mode duplicates.
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto("/pages/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const emailTab = page.getByText(/E-mail e palavra-passe/i).first();
  await emailTab.scrollIntoViewIfNeeded();
  await emailTab.click();
  await page.waitForTimeout(500);

  const main = page.locator("main");

  const emailInput = main.locator("#login-email").first();
  await emailInput.scrollIntoViewIfNeeded();
  await emailInput.fill(email);

  const passwordInput = main.locator("#login-password").first();
  await passwordInput.scrollIntoViewIfNeeded();
  await passwordInput.fill(password);

  const termsCheckbox = main.getByRole("checkbox", { name: /aceito os termos/i }).first();
  await termsCheckbox.check();

  const submitBtn = main.locator("form button[type='submit']").first();
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30000,
    waitUntil: "networkidle",
  });
}

export const ADMIN_CREDS = {
  email: process.env.TEST_ADMIN_EMAIL || "e2e-admin@dados.gov.pt",
  password: process.env.TEST_ADMIN_PASSWORD || "E2eAdmin2026!",
};

export const EDITOR_CREDS = {
  email: process.env.TEST_EDITOR_EMAIL || "e2e-editor@dados.gov.pt",
  password: process.env.TEST_EDITOR_PASSWORD || "E2eEditor2026!",
};

export async function loginAsAdmin(page: Page) {
  await performLogin(page, ADMIN_CREDS.email, ADMIN_CREDS.password);
}

export async function loginAsEditor(page: Page) {
  await performLogin(page, EDITOR_CREDS.email, EDITOR_CREDS.password);
}
