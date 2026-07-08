import { test, expect } from "playwright/test";

/**
 * Security headers + CSP regression — VULN-2075 / VULN-2076 / TICKET-47 /
 * TICKET-56b (LEDG-1718).
 *
 * Static security headers come from `next.config.ts -> headers()`. The CSP
 * is built per-request in `src/proxy.ts` so it can carry a fresh nonce.
 *
 * Hard requirements asserted below:
 *   - The static security headers (X-Frame-Options, HSTS, etc.) are served
 *     on every public route, regardless of whether the response goes
 *     through the proxy or not.
 *   - On HTML routes, the CSP includes `'nonce-<random>'` in `script-src`
 *     and explicitly does NOT include `'unsafe-inline'` or `'unsafe-eval'`
 *     in `script-src` (closes the XSS vector that TICKET-56b targeted).
 *   - On backend-proxied routes (`/api/*`, `/saml/*`), the Next.js CSP is
 *     skipped so the upstream Flask CSP (auto-submit SAML forms, etc.)
 *     is preserved.
 *
 * `style-src 'unsafe-inline'` is intentionally retained — Tailwind 4 and the
 * Agora design system inject runtime <style> tags. Tracked as a TICKET-56c
 * follow-up; the script-src vector (the real XSS risk) is closed here.
 */

const ROUTES = [
  "/",
  "/datasets",
  "/organizations",
  "/reuses",
  "/login",
];

const EXPECTED_HEADERS: Array<{
  name: string;
  match: (value: string | null) => boolean;
  description: string;
}> = [
  {
    name: "x-frame-options",
    match: (v) => v === "DENY",
    description: "X-Frame-Options=DENY (clickjacking)",
  },
  {
    name: "x-content-type-options",
    match: (v) => v === "nosniff",
    description: "X-Content-Type-Options=nosniff",
  },
  {
    name: "referrer-policy",
    match: (v) => v === "strict-origin-when-cross-origin",
    description: "Referrer-Policy=strict-origin-when-cross-origin",
  },
  {
    name: "strict-transport-security",
    match: (v) => Boolean(v?.includes("max-age=63072000")),
    description: "HSTS with 2y max-age",
  },
  {
    name: "permissions-policy",
    match: (v) =>
      Boolean(
        v?.includes("camera=()") &&
          v?.includes("microphone=()") &&
          v?.includes("geolocation=()") &&
          v?.includes("interest-cohort=()"),
      ),
    description: "Permissions-Policy denies camera/mic/geolocation/cohort",
  },
];

test.describe("Security headers (TICKET-47 / VULN-2075-2076)", () => {
  for (const route of ROUTES) {
    test(`HDR-${route}: response includes every required security header`, async ({
      request,
    }) => {
      const res = await request.get(route, {
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      // 2xx/3xx/4xx are all fine — what matters is the headers are set
      // by next.config.ts before any handler decides.
      expect(res.status(), `unexpected 5xx on ${route}`).toBeLessThan(500);

      const headers = res.headers();
      for (const expected of EXPECTED_HEADERS) {
        const value = headers[expected.name] ?? null;
        expect(
          expected.match(value),
          `${route} missing/wrong ${expected.description} ` +
            `(actual: ${value === null ? "<absent>" : value})`,
        ).toBe(true);
      }
    });

    test(`CSP-${route}: Content-Security-Policy is present and hardened`, async ({
      request,
    }) => {
      const res = await request.get(route, {
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      const csp = res.headers()["content-security-policy"] ?? "";
      expect(csp, `${route} has no CSP header`).not.toBe("");

      // Hard requirements: no 'unsafe-eval' anywhere; frame-ancestors locked
      // down to none (clickjacking belt-and-suspenders with X-Frame-Options);
      // default-src self.
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).toMatch(/frame-ancestors\s+'none'/);
      expect(csp).toMatch(/default-src\s+'self'/);

      // LEDG-1718 / TICKET-56b: script-src must carry a runtime nonce and
      // must NOT fall back to 'unsafe-inline'. The nonce token shape comes
      // from `generateNonce()` in `src/proxy.ts` (16 random bytes,
      // base64-encoded, so always [A-Za-z0-9+/=] of length ~24).
      const scriptSrcMatch = csp.match(/script-src([^;]*)/);
      expect(scriptSrcMatch, `${route} missing a script-src directive`).not.toBeNull();
      const scriptSrc = scriptSrcMatch?.[1] ?? "";
      expect(
        scriptSrc,
        `${route} script-src still contains 'unsafe-inline' — LEDG-1718 regressed`,
      ).not.toContain("'unsafe-inline'");
      expect(
        scriptSrc,
        `${route} script-src is missing a runtime 'nonce-...' token`,
      ).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    });
  }

  // -----------------------------------------------------------------
  // Skip-CSP routes — proxied to Flask, must keep the upstream CSP.
  // -----------------------------------------------------------------

  const BACKEND_PROXIED_ROUTES = ["/api/1/site/", "/saml/login"];

  for (const route of BACKEND_PROXIED_ROUTES) {
    test(`CSP-skip-${route}: Next.js must not inject its nonce CSP on backend-proxied routes`, async ({
      request,
    }) => {
      const res = await request.get(route, {
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      expect(res.status(), `unexpected 5xx on ${route}`).toBeLessThan(500);

      // The upstream Flask response may carry its own CSP (the SAML
      // auto-submit form needs `'unsafe-inline'` in script-src). What we
      // assert here is the *negative*: our nonce token (only emitted by
      // src/proxy.ts) must NOT be present. If it were, both CSPs would
      // overlay and the stricter (ours) would break Flask's inline script.
      const csp = res.headers()["content-security-policy"] ?? "";
      expect(
        csp,
        `${route} unexpectedly got a Next.js-issued nonce CSP — proxy.ts NO_CSP_PATHS regressed`,
      ).not.toMatch(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/);
    });
  }

  test("HDR-poweredby: X-Powered-By must not leak Next.js version", async ({
    request,
  }) => {
    const res = await request.get("/", { failOnStatusCode: false });
    const poweredBy = res.headers()["x-powered-by"];
    expect(poweredBy, "X-Powered-By leaks framework identity").toBeUndefined();
  });
});
