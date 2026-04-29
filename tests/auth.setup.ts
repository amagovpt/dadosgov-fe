import { test as setup } from "playwright/test";
import { ADMIN_CREDS, EDITOR_CREDS, loginAsAdmin, loginAsEditor } from "./helpers/auth";

/**
 * Storage-state setup. Runs ONCE before the dependent project's tests start
 * and produces:
 *   - tests/.auth/admin.json
 *   - tests/.auth/editor.json
 *
 * Backoffice specs declare `storageState: tests/.auth/admin.json` so each
 * test gets a logged-in browser context for free, without paying the ~5s
 * UI login per test or fighting CSRF collisions under workers=2+.
 */
setup("authenticate as admin", async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: "tests/.auth/admin.json" });
});

setup("authenticate as editor", async ({ page }) => {
  await loginAsEditor(page);
  await page.context().storageState({ path: "tests/.auth/editor.json" });
});

// Re-export creds for any spec that wants them at runtime.
export { ADMIN_CREDS, EDITOR_CREDS };
