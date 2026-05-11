import { test, expect } from "playwright/test";

/**
 * SSRF regression — VULN-2079 / TICKET-60 for `/internal-api/proxy-csv`.
 *
 * The proxy is intentionally hostname-allowlisted (`dados.gov.pt` /
 * `preprod.dados.gov.pt` by default). The original audit PoC bypassed the
 * old `startsWith("https://dados.gov.pt")` check with
 * `https://dados.gov.pt.s.inty.io` — that exact case is asserted below as a
 * named regression.
 *
 * Notes:
 *   - In `NODE_ENV !== "production"` the resolver allows private IPs so the
 *     dev backend on `localhost:7000` stays reachable. We still expect a 403
 *     from the *hostname* allowlist for any non-allowed host, regardless of
 *     IP.
 *   - The proxy returns `403 {"error": "URL not allowed"}` for protocol /
 *     hostname / port rejections, `400` for missing/invalid URL, and `502`
 *     for upstream/resolve failures. The expectations below match exactly
 *     what `route.ts` returns today; if the contract changes, update both
 *     places.
 *   - The route exists at `/internal-api/proxy-csv` (not `/api/proxy-csv`).
 *     The duplicate at `/api/proxy-csv` was deleted as part of TICKET-60;
 *     the assertion at the bottom keeps that promise.
 */

const SSRF_REJECTED: Array<{
  label: string;
  url: string;
  expect: { status: number; error: RegExp };
}> = [
  {
    label: "loopback hostname",
    url: "http://localhost:7000/api/1/site",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "loopback IPv4",
    url: "http://127.0.0.1:7000/api/1/site",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "loopback IPv6",
    url: "http://[::1]:7000/api/1/site",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "0.0.0.0",
    url: "http://0.0.0.0/x.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "AWS metadata endpoint",
    url: "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "GCP metadata endpoint",
    url: "http://metadata.google.internal/computeMetadata/v1/",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "RFC1918 10/8",
    url: "http://10.0.0.1/x.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "RFC1918 192.168/16",
    url: "http://192.168.1.1/x.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "file:// scheme",
    url: "file:///etc/passwd",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "gopher:// scheme",
    url: "gopher://attacker.tld:25/xSMTP",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "ftp:// scheme",
    url: "ftp://attacker.tld/x.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "non-allowlisted host (attacker-controlled)",
    url: "https://attacker.example.com/payload.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "audit bypass: dados.gov.pt.<attacker>",
    url: "https://dados.gov.pt.s.inty.io/payload.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "audit bypass: subdomain ending in allowlisted host",
    url: "https://attackerdados.gov.pt/payload.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
  {
    label: "non-default port on allowed host",
    url: "https://dados.gov.pt:22/payload.csv",
    expect: { status: 403, error: /URL not allowed/i },
  },
];

test.describe("SSRF — /internal-api/proxy-csv (VULN-2079)", () => {
  for (const c of SSRF_REJECTED) {
    test(`SSRF rejects ${c.label}`, async ({ request }) => {
      const res = await request.get("/internal-api/proxy-csv", {
        params: { url: c.url },
        failOnStatusCode: false,
      });
      expect(res.status(), `${c.label} → ${res.status()}`).toBe(c.expect.status);
      const body = await res.json().catch(() => ({}));
      expect(
        typeof body.error === "string" && c.expect.error.test(body.error),
        `${c.label}: expected error matching ${c.expect.error} but got ${JSON.stringify(body)}`,
      ).toBe(true);
    });
  }

  test("SSRF: missing url param returns 400", async ({ request }) => {
    const res = await request.get("/internal-api/proxy-csv", {
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing url/i);
  });

  test("SSRF: malformed URL string returns 400", async ({ request }) => {
    const res = await request.get("/internal-api/proxy-csv", {
      params: { url: "not a url at all" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid url/i);
  });

  test("SSRF: duplicate route at /api/proxy-csv must not exist (TICKET-60)", async ({
    request,
  }) => {
    // Even if the upstream backend doesn't expose a /api/proxy-csv route,
    // we want the Next.js side to NOT shadow it with a CSV proxy of its
    // own. Anything that returns a 200 with CSV-shaped content here is a
    // regression of the TICKET-60 cleanup. 404/503/etc. are fine.
    const res = await request.get("/api/proxy-csv", {
      params: { url: "https://dados.gov.pt/x.csv" },
      failOnStatusCode: false,
    });
    if (res.status() === 200) {
      const ct = (res.headers()["content-type"] ?? "").toLowerCase();
      expect(
        ct.includes("csv") || ct.startsWith("text/plain"),
        "/api/proxy-csv responded 200 with CSV-shaped Content-Type — " +
          "the deleted duplicate proxy has been reintroduced.",
      ).toBe(false);
    }
  });
});
