import { test, expect, type Page } from "playwright/test";

/**
 * Usercentrics manages every third party. Its autoblocker (the first <head> script
 * after Next's own chunks, which React always hoists first) holds reCAPTCHA and
 * Power BI back until the visitor consents. gtag.js is rendered
 * `type="text/plain" data-usercentrics="Google Analytics 4"` and the CMP
 * activates it on consent; the CMP's Google Consent Mode sends the update.
 *
 * What gets blocked is decided by the Usercentrics panel (Auto Blocking
 * ruleset, the services and their names, Google Consent Mode), so run this
 * against a deployed environment:
 *
 *   CONSENT_BASE_URL=https://preprod.dados.gov.pt PLAYWRIGHT_SKIP_SEED=1 \
 *   PLAYWRIGHT_SKIP_WARMUP=1 npx playwright test tests/e2e/frontend-public/22-consent.spec.ts
 *
 * Every test starts from a fresh browser context, so no stored choice.
 */

test.use({
  baseURL: process.env.CONSENT_BASE_URL ?? "http://localhost:3000",
  ignoreHTTPSErrors: true,
});

const THIRD_PARTY =
  /google-analytics\.com|googletagmanager\.com|app\.powerbi\.com|www\.google\.com\/recaptcha|gstatic\.com\/recaptcha|cdnjs\.cloudflare\.com/;

const PAGES_WITHOUT_DATASTORY = [
  "/pt",
  "/pt/login",
  "/pt/ajuda-e-contactos",
  "/pt/recursos/desenvolvimento/referencia-api",
];

/** Records third-party requests and CSP / hydration errors for the whole test. */
function watch(page: Page) {
  const thirdParty: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => {
    if (THIRD_PARTY.test(request.url())) thirdParty.push(request.url());
  });
  page.on("console", (message) => {
    const text = message.text();
    if (/Content-Security-Policy|Minified React error #418/.test(text)) consoleErrors.push(text);
  });
  return { thirdParty, consoleErrors };
}

const bannerButton = (page: Page, testId: string, name: RegExp) =>
  // The v3 UI renders in an open shadow root, which Playwright locators pierce.
  page.getByTestId(testId).or(page.getByRole("button", { name })).first();

async function firstDatastoryPath(page: Page): Promise<string> {
  await page.goto("/pt/datastories");
  const href = await page.locator('a[href*="/datastories/"]').first().getAttribute("href");
  expect(href, "no datastory link on /pt/datastories").toBeTruthy();
  return href!;
}

async function gaCookies(page: Page) {
  return (await page.context().cookies()).filter((c) => c.name.startsWith("_ga"));
}

/**
 * A hydration error makes React re-render the whole document, which drops the
 * CMP's banner from <body> and re-inserts the head scripts next to the ones
 * that already ran. Check both after the page settles.
 */
async function expectBannerKeptAndScriptsOnce(page: Page) {
  await expect(bannerButton(page, "uc-deny-all-button", /rejeitar/i)).toBeVisible({
    timeout: 20_000,
  });
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#usercentrics-cmp-ui")).toHaveCount(1);
  await expect(page.locator('script[src*="usercentrics.eu/ui/loader.js"]')).toHaveCount(1);
  await expect(page.locator('script[src*="usercentrics.eu/modules/autoblocker.js"]')).toHaveCount(1);
}

test.describe("Consent (Usercentrics autoblocker)", () => {
  test("CS-01: before any choice, the banner stays up and nothing non-essential loads", async ({
    page,
  }) => {
    const seen = watch(page);
    const datastory = await firstDatastoryPath(page);
    for (const path of ["/pt", "/pt/datastories", datastory]) {
      await page.goto(path);
      await expectBannerKeptAndScriptsOnce(page);
    }

    expect(seen.thirdParty).toEqual([]);
    expect(await gaCookies(page)).toEqual([]);
    expect(seen.consoleErrors).toEqual([]);
  });

  test("CS-02: after 'Rejeitar tudo', nothing non-essential loads on any page", async ({
    page,
  }) => {
    const seen = watch(page);
    await page.goto("/pt");
    await bannerButton(page, "uc-deny-all-button", /rejeitar/i).click({ timeout: 20_000 });

    const datastory = await firstDatastoryPath(page);
    for (const path of [...PAGES_WITHOUT_DATASTORY, datastory]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }

    expect(seen.thirdParty).toEqual([]);
    expect(await gaCookies(page)).toEqual([]);
    expect(seen.consoleErrors).toEqual([]);
  });

  // Needs the "Google Analytics 4" service (exact name) and Google Consent Mode
  // enabled in the Usercentrics panel.
  test("CS-03: after 'Aceitar tudo', GA sends a page_view with analytics granted", async ({
    page,
  }) => {
    const seen = watch(page);
    await page.goto("/pt");
    const collect = page.waitForRequest((r) => /\/g\/collect/.test(r.url()), {
      timeout: 20_000,
    });
    await bannerButton(page, "uc-accept-all-button", /aceitar/i).click({ timeout: 20_000 });

    // gcs=G1<ad_storage><analytics_storage>: the last digit is analytics.
    const gcs = new URL((await collect).url()).searchParams.get("gcs") ?? "";
    expect(gcs, `gcs=${gcs}`).toMatch(/^G1.1$/);
    expect(seen.consoleErrors).toEqual([]);
  });
});
