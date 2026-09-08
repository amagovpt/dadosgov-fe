import { Page } from "playwright/test";

/**
 * Authenticate through the login route, not through the login form.
 *
 * The "E-mail e palavra-passe" tab is the account-association entry point now
 * (LEDG-2360) and carries no password form, so there is no UI left to drive.
 * This posts exactly what that form posted, to exactly the route it posted to
 * — src/app/auth/login/route.ts, which mints the CSRF token server-side and
 * returns the backend's session cookies with Domain stripped. Behaviour is
 * therefore unchanged, including the migration check that route performs.
 *
 * `page.request` and not a bare `request` fixture: it shares the browser
 * context's cookie jar and baseURL, so `page.context().storageState()` still
 * captures the session and the disposable backoffice project keeps hitting
 * its own port. The terms checkbox the form gated on was client-only and was
 * never part of the request.
 *
 * Every caller navigates right after, so this deliberately leaves the page
 * where it was instead of paying for a round trip nobody reads.
 */
async function performLogin(page: Page, email: string, password: string) {
  const response = await page.request.post("/auth/login", {
    form: { email, password, remember: "y" },
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed for ${email}: ${response.status()} ${await response.text()}`
    );
  }
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
