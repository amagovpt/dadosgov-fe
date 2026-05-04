import { test as setup } from "playwright/test";
import { loginAsAdmin } from "./helpers/auth";

/**
 * Storage-state setup for the disposable backoffice project.
 *
 * Logs into the test backend (port 7001 via the test frontend on 3001) and
 * writes the cookie state to tests/.auth/admin.disposable.json. The
 * disposable project consumes that file so destructive tests start
 * authenticated without paying the UI login cost per test.
 */
setup("authenticate as admin (disposable)", async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({
    path: "tests/.auth/admin.disposable.json",
  });
});
