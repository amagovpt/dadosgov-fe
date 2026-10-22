// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/service/commom/routeRestrictions", () => ({
  getRouteRestrictions: vi.fn().mockResolvedValue([]),
}));

import { proxy } from "../proxy";

const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");
const run = (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  proxy(new NextRequest(`http://localhost:3000${path}`, init));

describe("proxy backend forwarding", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "http://backend.test:7000/");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["/get-csrf", "/get-csrf"],
    ["/saml/sso/", "/saml/sso"],
    ["/saml/link/start", "/saml/link/start"],
    ["/saml/eidas/link/start", "/saml/eidas/link/start"],
    ["/saml/eidas/sso_logout", "/saml/eidas/sso_logout"],
    ["/saml/migration/a/b", "/saml/migration/a/b"],
    ["/confirm/tok", "/confirm/tok"],
    ["/reset/tok", "/reset/tok"],
    ["/confirm-change-email/tok", "/confirm-change-email/tok"],
    ["/s/images/a.png", "/s/images/a.png"],
    ["/api/1/datasets/?page=2", "/api/1/datasets?page=2"],
    ["/swaggerui/swagger-ui.css", "/swaggerui/swagger-ui.css"],
  ])("forwards %s to the backend as %s", async (path, forwarded) => {
    const res = await run(path);
    expect(rewriteTarget(res)).toBe(`http://backend.test:7000${forwarded}`);
    expect(res.headers.get("content-security-policy")).toBeNull();
  });

  it("reads BACKEND_URL per request, not at build/module load", async () => {
    vi.stubEnv("BACKEND_URL", "http://other.test");
    expect(rewriteTarget(await run("/api/1/site/"))).toBe("http://other.test/api/1/site");
  });

  it("keeps the SAML list exhaustive: unknown routes are not forwarded", async () => {
    const res = await run("/saml/unknown");
    expect(rewriteTarget(res)).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(["/apis", "/pt/apis", "/pt/datasets/"])(
    "does not treat page path %s as a backend route",
    async (path) => {
      const res = await run(path);
      expect(rewriteTarget(res) ?? "").not.toMatch(/^http:\/\/backend\.test/);
      expect(res.headers.get("content-security-policy")).toContain("nonce-");
    }
  );
});

describe("proxy CSP", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const directives = async () => {
    const csp = (await run("/pt")).headers.get("content-security-policy") ?? "";
    return Object.fromEntries(
      csp.split(";").map((d) => {
        const [name, ...sources] = d.trim().split(/\s+/);
        return [name, sources];
      })
    ) as Record<string, string[]>;
  };

  it("keeps local hosts out of production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = await directives();
    for (const name of ["img-src", "connect-src"]) {
      expect(csp[name].some((s) => s.startsWith("http://"))).toBe(false);
    }
  });

  it("allows the Usercentrics autoblocker, its images and the embedded frames", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = await directives();
    expect(csp["script-src"]).toContain("https://web.cmp.usercentrics.eu");
    expect(csp["img-src"]).toContain("https://*.usercentrics.eu");
    expect(csp["frame-src"]).toEqual(
      expect.arrayContaining(["https://app.powerbi.com", "https://www.google.com"])
    );
  });

  it("no longer allows cdnjs: Swagger UI is served same-origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = await directives();
    for (const name of ["script-src", "style-src"]) {
      expect(csp[name]).not.toContain("https://cdnjs.cloudflare.com");
    }
  });

  it("allows the local backend in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const csp = await directives();
    expect(csp["img-src"]).toContain("http://localhost:7000");
    expect(csp["connect-src"]).toContain("http://localhost:7000");
  });
});
