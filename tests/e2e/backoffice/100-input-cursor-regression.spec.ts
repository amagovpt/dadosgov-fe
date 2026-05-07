import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";

/**
 * Regression suite — IsolatedInput cursor position.
 *
 * Before the fix, Agora's InputText imperatively set `inputElement.value`
 * in an internal effect on every render where the value prop changed. This
 * reset the cursor to the end of the string after the first keystroke, so
 * typing "abc" at position 0 of "hello" produced "ahellobc" instead of
 * "abchello".
 *
 * The fix (IsolatedInput + useLayoutEffect cursor restoration) is exercised
 * here by:
 *   1. Navigating to a real edit form that uses IsolatedInput.
 *   2. Placing the cursor at the start of the field.
 *   3. Typing a prefix one key at a time via keyboard.type().
 *   4. Asserting that the resulting value has the prefix at the front.
 *
 * These tests do NOT save — they are non-destructive.
 */

const fixtures = loadFixtures();

test.describe("Backoffice — IsolatedInput cursor regression", () => {
  test("CR-01: Title field preserves cursor when typing at the start", async ({
    page,
  }) => {
    await page.goto(
      `/pages/admin/me/datasets/edit?slug=${fixtures.dataset.slug}`
    );
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator("#edit-title").first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // Wait for IsolatedInput to populate from the loaded dataset.
    await expect(titleInput).toHaveValue(fixtures.dataset.title, {
      timeout: 10000,
    });

    // Move cursor to position 0.
    await titleInput.click();
    await page.keyboard.press("Home");

    // Type a multi-character prefix one key at a time.
    // Before the fix: chars 2-N would land at the end of the string.
    // After the fix: all chars appear contiguously at the front.
    const prefix = "CURSOR";
    await page.keyboard.type(prefix);

    await expect(titleInput).toHaveValue(prefix + fixtures.dataset.title);
  });

  test("CR-02: Title field preserves cursor when typing in the middle", async ({
    page,
  }) => {
    await page.goto(
      `/pages/admin/me/datasets/edit?slug=${fixtures.dataset.slug}`
    );
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator("#edit-title").first();
    await expect(titleInput).toHaveValue(fixtures.dataset.title, {
      timeout: 10000,
    });

    // Place cursor after the 3rd character.
    await titleInput.click();
    await page.keyboard.press("Home");
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowRight");
    }

    await page.keyboard.type("XY");

    const expected =
      fixtures.dataset.title.slice(0, 3) +
      "XY" +
      fixtures.dataset.title.slice(3);
    await expect(titleInput).toHaveValue(expected);
  });

  test("CR-03: Acronym field preserves cursor when typing at the start", async ({
    page,
  }) => {
    await page.goto(
      `/pages/admin/me/datasets/edit?slug=${fixtures.dataset.slug}`
    );
    await page.waitForLoadState("networkidle");

    const acronymInput = page.locator("#edit-acronym").first();
    await expect(acronymInput).toBeVisible({ timeout: 10000 });

    // Clear any existing value and type a known base string.
    await acronymInput.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.type("BASE");
    await expect(acronymInput).toHaveValue("BASE");

    // Move to start and prepend — verifies cursor doesn't jump to end.
    await page.keyboard.press("Home");
    await page.keyboard.type("PRE");

    await expect(acronymInput).toHaveValue("PREBASE");
  });

  test("CR-04: Title field value is correct after rapid multi-character edit at the start", async ({
    page,
  }) => {
    await page.goto(
      `/pages/admin/me/datasets/edit?slug=${fixtures.dataset.slug}`
    );
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator("#edit-title").first();
    await expect(titleInput).toHaveValue(fixtures.dataset.title, {
      timeout: 10000,
    });

    await titleInput.click();
    await page.keyboard.press("Home");

    // 6 rapid keystrokes — exercises every intermediate cursor-restore cycle.
    await page.keyboard.type("ABCDEF");

    const value = await titleInput.inputValue();
    // The first 6 characters must be exactly "ABCDEF" (in order, at the front).
    expect(value.slice(0, 6)).toBe("ABCDEF");
    // The rest must be the original title, unmodified.
    expect(value.slice(6)).toBe(fixtures.dataset.title);
  });
});
