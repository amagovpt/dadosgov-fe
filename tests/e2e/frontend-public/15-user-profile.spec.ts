import { test, expect } from "playwright/test";

const USERS_BASE = "/pages/users";

test.describe("User Profile Page", () => {
  test.skip(
    "PF-01: Profile page loads",
    async () => {
      // Public access to user profiles is gated and discoverable only from
      // authenticated contexts (header user dropdown). Without seeded users
      // and a logged-in session, we cannot deterministically navigate to a
      // valid /pages/users/[slug] URL. Re-enable once a stable test fixture
      // is available.
    }
  );

  test.skip("PF-02: Shows name, avatar, bio, website, registration date", async () => {});
  test.skip("PF-03: Metrics show datasets, reuses, followers, views, downloads", async () => {});
  test.skip("PF-04: Organizations section visible", async () => {});
  test.skip("PF-05: Default avatar shown for users without photo", async () => {});

  test("PF-06: Unknown user slug returns the profile shell heading", async ({
    page,
  }) => {
    // The users/[slug] route returns the page shell ("Perfil" heading) and
    // surfaces the failure client-side. Validate the route doesn't crash.
    const response = await page.goto(`${USERS_BASE}/this-user-cannot-exist-xyz123`);
    expect(response?.status()).toBeLessThan(500);

    const profileHeading = page.getByRole("heading", { name: /^Perfil$/i, level: 1 });
    await expect(profileHeading).toBeVisible({ timeout: 10000 });
  });
});
