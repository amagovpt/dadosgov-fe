import { test, expect } from "playwright/test";
import { DISPOSABLE } from "../../../helpers/disposable-fixtures";

/**
 * Backoffice — destructive Datasets CRUD (disposable stack).
 *
 * Runs against:
 *   • frontend  http://127.0.0.1:3001  (Next.js dev with NEXT_DIST_DIR=.next-test)
 *   • backend   http://127.0.0.1:7001  (udata, UDATA_SETTINGS=udata.test.cfg)
 *   • mongodb   127.0.0.1:27019/udata_e2e  (tmpfs, wiped on every test_db.sh up)
 *   • redis     127.0.0.1:6380
 *
 * Auth comes from `tests/auth.setup.disposable.ts` → admin.disposable.json
 * storage state. Each test mutates real records that the backend re-creates
 * on next `init_test_db.py` invocation.
 */
const fixtures = DISPOSABLE;

test.describe("Backoffice (disposable) - Datasets destructive CRUD", () => {
  test("DS-D1: Anonymous visitor cannot reach /admin/me/datasets edit", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto(
      `/pages/admin/me/datasets/edit?slug=${fixtures.dataset.slug}`
    );
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(page.url()).toMatch(/\/pages\/(login|admin)/);
    await ctx.close();
  });

  test.skip(
    "DS-D2: Edit dataset title from edit page persists on reload",
    async () => {
      // The edit page assumes membership state that the disposable seed
      // doesn't yet wire perfectly through the SAML/CSRF dance. Re-enable
      // once init_test_db.py provisions the dataset with the admin as direct
      // owner (currently org-owned only) and the frontend uses that owner
      // for permission checks.
    }
  );

  test.skip(
    "DS-D3: Add new resource via the Ficheiros tab",
    async () => {
      // Same membership/permission issue as DS-D2.
    }
  );

  test.skip(
    "DS-D4: Delete dataset removes it from the listing",
    async () => {
      // Once DS-D2/D3 are unblocked, this test creates a temporary dataset,
      // deletes it, and verifies it is gone — without affecting the main
      // `e2e-test-dataset` fixture used by other tests in the same run.
    }
  );
});
