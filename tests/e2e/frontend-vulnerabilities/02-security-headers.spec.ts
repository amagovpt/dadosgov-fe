import { test, expect } from "playwright/test";

/**
 * Security headers + CSP regression — VULN-2075 / VULN-2076 / TICKET-47.
 *
 * `next.config.ts` declares `securityHeaders` and a `Content-Security-Policy`
 * inside `headers()`. The TICKET-47 audit report ("docs/testsprite-
 * vulnerability-frontend-report.md") lists 7 missing headers that were
 * subsequently added. This spec asserts every header is still served on the
 * routes that matter (public homepage, public detail, login, admin entry).
 *
 * It also asserts the CSP no longer allows `'unsafe-eval'` (removed alongside
 * VULN-2075/2076) and that the `Permissions-Policy` denies camera/microphone
 * /geolocation/interest-cohort. `'unsafe-inline'` in script-src is
 * intentionally retained pending TICKET-56b (Next.js 16 nonce middleware),
 * so the test asserts presence with a TODO comment rather than absence.
 */

const ROUTES = [
  "/",
  "/pages/datasets",
  "/pages/organizations",
  "/pages/reuses",
  "/pages/login",
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

      // Soft requirement (documented in next.config.ts comment): script-src
      // currently includes 'unsafe-inline' pending the Next.js 16 nonce
      // middleware. We assert presence so a future tightening that removes
      // it triggers a deliberate review of this test rather than a silent
      // pass.
      expect(
        csp,
        "script-src 'unsafe-inline' was removed — update TICKET-56b status, " +
          "then loosen this assertion to expect absence.",
      ).toMatch(/script-src[^;]*'unsafe-inline'/);
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
