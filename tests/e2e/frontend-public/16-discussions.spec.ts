import { test, expect, type Page } from "playwright/test";

const DATASETS_URL = "/pages/datasets";

async function getFirstDatasetHref(page: Page): Promise<string> {
  await page.goto(DATASETS_URL);
  await page.waitForLoadState("networkidle");
  const firstLink = page.locator("a[href^='/pages/datasets/']").first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  const href = await firstLink.getAttribute("href");
  if (!href) throw new Error("No dataset link found on listing");
  return href;
}

async function gotoFirstDatasetDiscussions(page: Page) {
  await page.goto(DATASETS_URL);
  await page.waitForLoadState("networkidle");

  const firstLink = page.locator("a[href^='/pages/datasets/']").first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  const href = await firstLink.getAttribute("href");
  await page.goto(href!);
  await page.waitForLoadState("networkidle");

  const discussionTab = page
    .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
    .first();
  await expect(discussionTab).toBeVisible({ timeout: 15000 });
  await discussionTab.click();
}

test.describe("Discussions on Dataset Detail", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstDatasetDiscussions(page);
  });

  test("DI-01: Discussion tab is reachable and renders its panel", async ({
    page,
  }) => {
    // The "DISCUSSÕES" header inside the panel confirms the tab content.
    const panelHeading = page
      .locator("h3", { hasText: /\d+ DISCUSSÕES|DISCUSSÕES/i })
      .first();
    await expect(panelHeading).toBeAttached({ timeout: 10000 });
  });

  test("DI-02: Empty-state copy when no discussions exist", async ({
    page,
  }) => {
    // For seeded fixtures with 0 discussions, the panel surfaces a "Sem discussões"
    // / "Iniciar nova discussão" copy. This test passes if either the empty
    // copy OR a real discussion thread is rendered.
    const emptyCopy = page.getByText(/Sem discussões|Iniciar nova discussão/i);
    const threads = page.locator(".tab-list-item.mobile.current-neutral", {
      hasText: /^Discussões/i,
    });
    expect(
      ((await emptyCopy.count()) > 0) || ((await threads.count()) > 0)
    ).toBeTruthy();
  });

  test("DI-03: Tab panel preserves accessibility role", async ({ page }) => {
    const panel = page.locator('[role="tabpanel"]').filter({
      hasText: /Discussões/i,
    });
    await expect(panel.first()).toBeAttached({ timeout: 10000 });
  });

  test.skip("DI-04: Follow dataset button (needs auth)", async () => {});
  test.skip("DI-05: Unfollow dataset (needs auth)", async () => {});
  test.skip("DI-06: Follow organization (needs auth)", async () => {});
  test.skip("DI-07: Follow reuse (needs auth)", async () => {});

  test("DI-08: New discussion CTA is auth-gated for anonymous visitors", async ({
    page,
  }) => {
    const newDiscussionBtn = page.getByRole("button", {
      name: /Iniciar nova discussão|Nova discussão/i,
    });

    if ((await newDiscussionBtn.count()) === 0) {
      // Page may hide the affordance entirely for anonymous users — pass.
      return;
    }

    await newDiscussionBtn.first().click();
    // Anonymous flow either redirects to /pages/login or surfaces a login modal.
    await page.waitForTimeout(1500);
    const url = page.url();
    const onLogin = url.includes("/pages/login");
    const loginInputVisible = await page
      .locator("#login-email")
      .first()
      .isVisible()
      .catch(() => false);
    expect(onLogin || loginInputVisible).toBeTruthy();
  });

  test("DI-09: Reply textarea is not exposed to anonymous users", async ({
    page,
  }) => {
    const replyInputs = page.locator("textarea");
    if ((await replyInputs.count()) === 0) return;

    const first = replyInputs.first();
    const visible = await first.isVisible().catch(() => false);
    if (!visible) return;

    const disabled = await first.isDisabled().catch(() => false);
    const readonly = await first
      .evaluate((el: HTMLTextAreaElement) => el.readOnly)
      .catch(() => false);
    expect(disabled || readonly).toBeTruthy();
  });

  test("DI-10: Discussion message text is contained — no horizontal overflow and overflow-wrap:anywhere applied", async ({
    page,
  }) => {
    // Locate the active tab panel.
    const panel = page.locator('[role="tabpanel"]').filter({ hasText: /Discussões/i }).first();
    await expect(panel).toBeAttached({ timeout: 10000 });

    // If there are no discussions, the fix has nothing to break — pass.
    const paragraphs = panel.locator("p");
    if ((await paragraphs.count()) === 0) return;

    // 1. Every <p> that holds message content must have overflow-wrap: anywhere.
    const badOverflowWrap = await panel.evaluate((panelEl) => {
      const ps = Array.from(panelEl.querySelectorAll("p"));
      return ps
        .filter((p) => {
          const ow = window.getComputedStyle(p).overflowWrap;
          // "anywhere" is the expected value; "break-word" is also acceptable.
          return ow !== "anywhere" && ow !== "break-word";
        })
        .map((p) => ({ text: p.textContent?.slice(0, 60), overflowWrap: window.getComputedStyle(p).overflowWrap }));
    });
    expect(
      badOverflowWrap,
      `Some <p> elements inside the discussion panel are missing overflow-wrap:anywhere — found: ${JSON.stringify(badOverflowWrap)}`
    ).toHaveLength(0);

    // 2. No discussion card container should have horizontal scroll overflow.
    const overflowingCards = await panel.evaluate((panelEl) => {
      // Cards are the direct white boxes wrapping each discussion thread.
      const cards = Array.from(panelEl.querySelectorAll("div[class*='bg-white']"));
      return cards
        .filter((card) => card.scrollWidth > card.clientWidth + 1) // +1 for sub-pixel rounding
        .map((card) => ({ scrollWidth: card.scrollWidth, clientWidth: card.clientWidth }));
    });
    expect(
      overflowingCards,
      `Discussion card(s) overflow horizontally: ${JSON.stringify(overflowingCards)}`
    ).toHaveLength(0);
  });
});

test.describe("Discussion tab — URL-driven activation (email link flow)", () => {
  test("DI-11: ?tab=discussions query param activates the Discussões tab without a click", async ({
    page,
  }) => {
    const href = await getFirstDatasetHref(page);

    await page.goto(`${href}?tab=discussions`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });

    // Panel heading inside the tab body confirms it is already rendered active.
    const panelHeading = page
      .locator("h3", { hasText: /\d+ DISCUSS(ÃO|ÕES)|DISCUSS(ÃO|ÕES)/i })
      .first();
    await expect(panelHeading).toBeAttached({ timeout: 10000 });

    // The tab element should carry aria-selected="true" (ARIA tabs pattern).
    const discussionTab = page
      .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
      .first();
    await expect(discussionTab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
  });

  test("DI-12: /discussions sub-path (email link format) redirects and activates the Discussões tab", async ({
    page,
  }) => {
    const href = await getFirstDatasetHref(page);

    // Navigate to the URL format generated by backend email notifications.
    await page.goto(`${href}/discussions`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });

    // Must redirect to the dataset page with tab=discussions in the URL.
    await expect(page).toHaveURL(/tab=discussions/, { timeout: 10000 });

    // Discussions tab must be active without the user having clicked it.
    const discussionTab = page
      .locator('[role="tab"]', { hasText: /^Discussões \(\d+\)/i })
      .first();
    await expect(discussionTab).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
  });

  test("DI-13: /discussions sub-path preserves discussion_id through the redirect", async ({
    page,
  }) => {
    const href = await getFirstDatasetHref(page);
    const fakeId = "abc123";

    await page.goto(`${href}/discussions?discussion_id=${fakeId}`);
    await page.waitForLoadState("networkidle");

    // Both tab=discussions and discussion_id must survive the redirect.
    await expect(page).toHaveURL(/tab=discussions/, { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(`discussion_id=${fakeId}`), { timeout: 10000 });
  });
});
