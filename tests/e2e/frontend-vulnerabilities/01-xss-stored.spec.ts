import { test, expect, type Page, type Dialog } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";
import { INIT_XSS_FLAGS, XSS_PAYLOADS, type XssFlags } from "./_payloads";

/**
 * Stored-XSS regression suite — VULN-2075 (organization description),
 * VULN-2076 (reuse description + title), and defense-in-depth coverage for
 * dataset description (same `MarkdownField` family).
 *
 * Data path (see `backend/scripts/seed_e2e_fixtures.py`):
 *   1. globalSetup runs `seed_e2e_fixtures.py` against the dev backend.
 *   2. The script creates three fixtures (org / dataset / reuse) whose
 *      `description` (and reuse `title`) are overwritten via
 *      `Organization.objects(id=...).update_one(set__description=...)`.
 *      That `update_one` deliberately bypasses the `pre_save` sanitization
 *      hook so a worst-case malicious record reaches MongoDB intact.
 *   3. The Next.js Server Component fetches the record and renders it.
 *      If the rendering pipeline ever regresses (e.g. someone reintroduces
 *      `dangerouslySetInnerHTML` on a user-controlled string), the payload
 *      executes and one or more `window.__xssFlags.*` entries flip.
 *
 * The spec is intentionally noisy about failure: it catches dialogs, page
 * errors, and the post-render flag bag. Any of those means the regression
 * has landed.
 */

async function assertNoXssExecution(
  page: Page,
  url: string,
  scenario: string,
): Promise<void> {
  const dialogs: string[] = [];
  const pageErrors: string[] = [];
  const dialogHandler = (dialog: Dialog) => {
    dialogs.push(`${dialog.type()}:${dialog.message()}`);
    void dialog.dismiss();
  };
  const errorHandler = (err: Error) => pageErrors.push(err.message);

  page.on("dialog", dialogHandler);
  page.on("pageerror", errorHandler);

  try {
    await page.addInitScript(INIT_XSS_FLAGS);
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    // Give onerror/onload/iframe-srcdoc plenty of time to fire if they ever
    // would. Empirically `window.__xssFlags.imgOnError` flips within a few
    // ms when the regression is present, but iframe srcdoc can take longer.
    await page.waitForTimeout(1500);

    const flags = await page.evaluate(
      () => (window as unknown as { __xssFlags?: XssFlags }).__xssFlags ?? {},
    );
    const fired = Object.entries(flags).filter(([, v]) => Boolean(v));
    expect(
      fired,
      `[${scenario}] XSS payload(s) executed at ${url}: ${JSON.stringify(flags)}`,
    ).toEqual([]);
    expect(
      dialogs,
      `[${scenario}] dialog opened (likely alert/confirm injected via XSS) at ${url}`,
    ).toEqual([]);
    // pageerror is informational — a thrown error is not the same as
    // execution, so we don't assert empty, just surface it.
    if (pageErrors.length > 0) {
      console.warn(`[${scenario}] page errors at ${url}:`, pageErrors);
    }
  } finally {
    page.off("dialog", dialogHandler);
    page.off("pageerror", errorHandler);
  }
}

test.describe("Stored XSS — public detail pages (VULN-2075 / VULN-2076)", () => {
  test("XSS-01: organization description does not execute injected scripts", async ({
    page,
  }) => {
    const { xss_organization } = loadFixtures();
    await assertNoXssExecution(
      page,
      `/organizations/${xss_organization.slug}`,
      "organization.description",
    );
  });

  test("XSS-02: dataset description does not execute injected scripts", async ({
    page,
  }) => {
    const { xss_dataset } = loadFixtures();
    await assertNoXssExecution(
      page,
      `/datasets/${xss_dataset.slug}`,
      "dataset.description",
    );
  });

  test("XSS-03: reuse description + title do not execute injected scripts", async ({
    page,
  }) => {
    const { xss_reuse } = loadFixtures();
    await assertNoXssExecution(
      page,
      `/reuses/${xss_reuse.slug}`,
      "reuse.description+title",
    );
  });

  test("XSS-04: rendered HTML must not contain raw onerror=/onload=/javascript: handlers", async ({
    page,
  }) => {
    // Belt-and-suspenders: even if no flag fires (because rehype-sanitize
    // strips the handler attribute at render time), the rendered HTML should
    // also not contain attack-shaped substrings. A regression that
    // re-enables raw HTML rendering would surface here.
    //
    // Scope of the check: only the rendered DOM that the user sees. We strip
    // out `<script>` and `<noscript>` blocks before scanning because:
    //   • Next.js App Router unconditionally injects framework `<script>`
    //     blocks (streaming runtime `$RC(...)`, `__next_f.push(...)`) — those
    //     are always present and would create a permanent `<script>` false
    //     positive.
    //   • The React Server Components hydration payload encodes the raw
    //     Client Component props (including `description`) as JSON-escaped
    //     strings inside a `<script>` block. Those characters are inert data
    //     (never parsed as HTML), so matching them there is also a false
    //     positive. What matters is the DOM the browser actually renders.
    const { xss_organization } = loadFixtures();
    await page.goto(`/organizations/${xss_organization.slug}`);
    await page.waitForLoadState("networkidle");

    const rawHtml = await page.content();
    const html = rawHtml
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, "");
    const forbidden = ["onerror=", "onload=", "javascript:", "<script>", "srcdoc="];
    const hits = forbidden.filter((needle) => html.toLowerCase().includes(needle));
    expect(
      hits,
      `dangerous markup leaked into rendered DOM: ${hits.join(", ")}. ` +
        "If this fails, check that the description renderer pipes through rehype-sanitize.",
    ).toEqual([]);
  });

  test("XSS-05: payload vector inventory stays in sync with the seed script", () => {
    // Cheap guardrail: if someone trims `_payloads.ts` without also
    // trimming `seed_e2e_fixtures.py`, the seeded data and the assertion
    // contract drift apart silently. Surface that as a clear test failure.
    const keys = XSS_PAYLOADS.map((p) => p.key).sort();
    expect(keys).toEqual(
      [
        "iframeSrcDoc",
        "imgOnError",
        "javascriptLink",
        "scriptTag",
        "svgOnLoad",
      ].sort(),
    );
  });
});
