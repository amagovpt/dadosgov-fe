import { test, expect, type APIResponse } from "playwright/test";

/**
 * Regression suite for the KITS24 audit vulnerabilities that were resolved
 * pre-migration (deploys 2024-06-04, 2024-06-18, 2024-07-23, ...) on the
 * legacy infrastructure and have NO direct test coverage in the current
 * Next.js + udata-pt monorepo. The goal here is defence-in-depth: confirm
 * that the same mitigations are still enforced after the rewrite.
 *
 * Source of truth: `Vulnerabilidades_mapa_geral.xlsx` rows with
 * `Mitigado (Y/N) = YES`, cross-referenced with the per-VULN PDF reports
 * under `C:\Users\adbru\Downloads\VULN_Reports`.
 *
 * Each test names the originating VULN(s) in its title. Tests that already
 * have dedicated coverage elsewhere are intentionally NOT duplicated:
 *
 *   • VULN-1376 (weak password policy)         → backend test
 *   • VULN-1379 / VULN-1593 (XSS SVG upload)    → backend test
 *   • VULN-1496 (HTML5 CORS misconfiguration)   → backend test
 *   • VULN-1377 / 1532..1534 / 1688 (user enum) → backend test
 *   • VULN-2075 / 2076 (stored XSS)             → 01-xss-stored.spec.ts
 *   • VULN-2079 (SSRF /proxy-csv)               → 03-ssrf-proxy-csv.spec.ts
 *   • VULN-2078 (community resources rate-lim)  → 05-rate-limit-community-resources.spec.ts
 */

const PUBLIC_ROUTES = [
  "/",
  "/datasets",
  "/organizations",
  "/reuses",
];

const SENSITIVE_AUTHENTICATED_ROUTES = [
  "/admin/me/datasets",
  "/admin/me/reuses",
];

// RFC1918 private-network IPs that must never appear in a public response.
// Anchored on word boundaries so we don't false-positive on version strings.
const RFC1918_REGEX =
  /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/;

function stripScripts(html: string): string {
  // Strip framework script/noscript blocks before substring scanning. The
  // RSC streaming payload also lives inside <script> tags and is inert data
  // — same scoping rationale as 01-xss-stored.spec.ts::XSS-04.
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, "");
}

test.describe("Legacy KITS24 vulnerabilities — regression suite", () => {
  // -------------------------------------------------------------------
  // VULN-1594 — Internal IP Address Disclosed (Severity LOW, preprod)
  //
  // Audit found 172.31.203.18 leaked in a JSON-LD `contentUrl` script tag
  // on `/pt/datasets/<slug>/`. The Next.js frontend rebuilt those pages
  // from scratch — no RFC1918 IP should ever surface in a public response.
  // -------------------------------------------------------------------
  test.describe("VULN-1594 — Internal IP disclosure", () => {
    for (const route of PUBLIC_ROUTES) {
      test(`IPLEAK-${route}: no RFC1918 IP in response body`, async ({ request }) => {
        const res: APIResponse = await request.get(route);
        expect(res.ok(), `${route} returned HTTP ${res.status()}`).toBe(true);
        const body = await res.text();
        const match = body.match(RFC1918_REGEX);
        expect(
          match,
          `RFC1918 private IP leaked into ${route}: ${match?.[0]}`,
        ).toBeNull();
      });
    }
  });

  // -------------------------------------------------------------------
  // VULN-1596 — Reflected XSS on `?geozone=` query parameter
  //
  // The original payload was `?geozone=<script>alert(document.domain)</script>`
  // on the legacy Vue list page. The current Next.js list page passes the
  // value to the backend as a filter ID — the value should NEVER end up
  // rendered as HTML in the DOM.
  // -------------------------------------------------------------------
  test.describe("VULN-1596 — Reflected XSS on geozone param", () => {
    test("GEOZ-01: payload does not execute and does not leak into rendered DOM", async ({
      page,
    }) => {
      let dialogTriggered = false;
      page.on("dialog", (d) => {
        dialogTriggered = true;
        void d.dismiss();
      });
      await page.addInitScript(`window.__geozoneXss = 0;`);

      const payload = "<script>window.__geozoneXss=1;alert('vuln-1596')</script>";
      await page.goto(`/datasets?geozone=${encodeURIComponent(payload)}`);
      await page.waitForLoadState("networkidle");

      const flag = await page.evaluate(
        () => (window as unknown as { __geozoneXss?: number }).__geozoneXss,
      );
      expect(
        flag,
        "geozone payload executed — reflected XSS regression",
      ).toBeFalsy();
      expect(
        dialogTriggered,
        "alert() dialog opened — reflected XSS regression",
      ).toBe(false);

      const sanitized = stripScripts(await page.content());
      expect(
        sanitized.toLowerCase(),
        "geozone payload appeared verbatim in rendered DOM (outside <script> blocks)",
      ).not.toContain("<script>window.__geozonexss");
    });
  });

  // -------------------------------------------------------------------
  // VULN-1497 — Cacheable HTTPS responses on sensitive routes
  //
  // Browsers may cache HTTPS responses locally; if the response contains
  // user-private data, an attacker with local access can recover it. The
  // recommendation is `Cache-Control: no-store` (or at minimum a directive
  // that prevents public caching) on authenticated views.
  //
  // The default project storageState is the seeded admin session, so the
  // request includes the auth cookies automatically.
  // -------------------------------------------------------------------
  test.describe("VULN-1497 — Cacheable HTTPS responses (sensitive routes)", () => {
    for (const route of SENSITIVE_AUTHENTICATED_ROUTES) {
      test(`CACHE-${route}: must NOT be publicly cacheable`, async ({ request }) => {
        const res = await request.get(route);
        // Auth pages may redirect (3xx) or render (2xx); either way the
        // intermediate/final response should not be marked `public`.
        const cc = (res.headers()["cache-control"] || "").toLowerCase();
        // Allow empty (defaults safely on Next.js dev), or any directive that
        // is NOT `public`. Reject explicit `public` cache directives.
        expect(
          cc.match(/\bpublic\b/),
          `sensitive route ${route} returned a public cache directive: '${cc}'`,
        ).toBeNull();
      });
    }
  });

  // -------------------------------------------------------------------
  // VULN-1515 / VULN-1595 — Clickjacking
  //
  // `02-security-headers.spec.ts` already asserts `X-Frame-Options=DENY`
  // and `frame-ancestors 'none'` on a fixed list of routes. This test
  // extends coverage to a *dynamic* detail route to catch the case where
  // a misconfigured `headers()` rule applies only to the top-level paths.
  // -------------------------------------------------------------------
  test.describe("VULN-1515 / VULN-1595 — Clickjacking protection on dynamic routes", () => {
    test("CLICKJACK-01: dynamic dataset detail route refuses framing", async ({
      request,
    }) => {
      // Pick any dataset slug from the API; if no datasets exist, skip.
      const apiRes = await request.get("/api/1/datasets/?page_size=1");
      expect(apiRes.ok()).toBe(true);
      const json = await apiRes.json();
      const slug = json?.data?.[0]?.slug;
      test.skip(!slug, "no public datasets available to probe");

      const res = await request.get(`/datasets/${slug}`);
      const xfo = (res.headers()["x-frame-options"] || "").toLowerCase();
      const csp = (res.headers()["content-security-policy"] || "").toLowerCase();

      // Either header is sufficient; we accept any of:
      //   X-Frame-Options: DENY / SAMEORIGIN
      //   CSP frame-ancestors 'none' / 'self'
      const xfoOk = xfo === "deny" || xfo === "sameorigin";
      const cspOk = /frame-ancestors\s+'(none|self)'/.test(csp);
      expect(
        xfoOk || cspOk,
        `dataset detail page lacks clickjacking protection — XFO='${xfo}' CSP='${csp}'`,
      ).toBe(true);
    });
  });
});
