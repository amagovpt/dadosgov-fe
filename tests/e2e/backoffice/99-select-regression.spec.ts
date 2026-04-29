import { test, expect } from "playwright/test";
import { SELECT_REGRESSION_CASES } from "../../helpers/select-regression";

/**
 * Generic regression suite — "every backoffice select that must be populated
 * actually exposes options".
 *
 * Each case in `SELECT_REGRESSION_CASES` is exercised twice:
 *   • normal fetch  — covers the happy path (regression baseline).
 *   • delayed fetch — every API endpoint feeding the page is throttled by
 *     ~1 s so the form definitely paints before the data arrives. Catches
 *     memo-cache bugs that the happy path may race past — notably the
 *     pattern where Agora's `<InputSelect>` keeps the empty `<DropdownSection>`
 *     it cached on first render and never re-reads when state updates.
 *
 * To add coverage for a new form, append an entry to
 * `tests/helpers/select-regression.ts`. The matrix below picks it up
 * automatically.
 */
/**
 * IMPORTANT — option counting must be SCOPED to the dropdown that was just
 * opened, not global. Agora's `<InputSelect>` trigger has
 * `aria-controls="<popupId>"` and the matching popup container has
 * `id="<popupId>"`. Counting `[role="option"]` globally returns options from
 * every select on the page (producer-identity, keywords, datasets, …), so a
 * truly empty Tipo/Tema dropdown still produces a global count > 0 and the
 * assertion silently passes. Always scope to `#<popupId> [role="option"]`.
 */
async function countScopedOptions(
  page: import("playwright/test").Page,
  popupId: string
): Promise<number> {
  return page.locator(`#${popupId} [role="option"]`).count();
}

test.describe("Backoffice — Select regression matrix", () => {
  for (const { route, selectIds, api } of SELECT_REGRESSION_CASES) {
    test(`SR-NORMAL ${route}: every required select exposes options`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      for (const id of selectIds) {
        const select = page.locator(`#${id}`).first();
        await expect(
          select,
          `select #${id} on ${route} must be visible`
        ).toBeVisible({ timeout: 10000 });

        const popupId = await select.getAttribute("aria-controls");
        expect(
          popupId,
          `select #${id} on ${route} must expose aria-controls`
        ).toBeTruthy();

        await select.click();
        await page.waitForTimeout(700);

        const optionsCount = await countScopedOptions(page, popupId!);
        expect(
          optionsCount,
          `select #${id} on ${route} must expose at least one option inside #${popupId}`
        ).toBeGreaterThan(0);

        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }
    });

    test(`SR-DELAYED ${route}: selects populate after delayed API responses`, async ({
      page,
    }) => {
      // Throttle every endpoint feeding the page by ~1 s so the form paints
      // before the data arrives — surfaces memo-cache bugs that hide when
      // fetches finish before the dropdown is opened.
      for (const pattern of api) {
        await page.route(pattern, async (req) => {
          await new Promise((r) => setTimeout(r, 1000));
          await req.continue();
        });
      }

      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2500);

      for (const id of selectIds) {
        const select = page.locator(`#${id}`).first();
        await expect(
          select,
          `select #${id} on ${route} must be visible`
        ).toBeVisible({ timeout: 10000 });

        const popupId = await select.getAttribute("aria-controls");
        expect(
          popupId,
          `select #${id} on ${route} must expose aria-controls`
        ).toBeTruthy();

        await select.click();
        await page.waitForTimeout(700);

        const optionsCount = await countScopedOptions(page, popupId!);
        expect(
          optionsCount,
          `select #${id} on ${route} must populate after a delayed fetch (popup #${popupId})`
        ).toBeGreaterThan(0);

        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }
    });
  }
});
