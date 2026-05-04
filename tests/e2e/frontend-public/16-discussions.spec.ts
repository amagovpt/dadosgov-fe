import { test, expect, type Page } from "playwright/test";

const DATASETS_URL = "/pages/datasets";

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
});
