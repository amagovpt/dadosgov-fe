import { request, type FullConfig } from "playwright/test";

/**
 * Pre-warm the Next.js dev server before the test suite starts.
 *
 * Why: in `next dev` mode every route is compiled on first request. When
 * Playwright workers fan out and hit different routes simultaneously, the
 * compiler thrashes and the server may stop responding (the symptom that
 * caused all "Page loads with…" tests to time out at ~60s).
 *
 * This script fires sequential GETs against the routes the suite exercises,
 * with a generous per-request timeout, so each route is already compiled by
 * the time the workers begin. Each request fails open: if a route 404s or
 * the backend hiccups, the warm-up logs and continues — it never aborts the
 * test run.
 *
 * Skip with PLAYWRIGHT_SKIP_WARMUP=1 (e.g. when running against a prod build).
 */

const ROUTES_TO_WARM: string[] = [
  // Public pages — every spec's beforeEach hits one of these
  "/",
  "/pages/search",
  "/pages/datasets",
  "/pages/organizations",
  "/pages/reuses",
  "/pages/dataservices",
  "/pages/datastories",
  "/pages/themes",
  "/pages/mini-courses",
  "/pages/posts",
  "/pages/about-open-data",
  "/pages/docapi",
  "/pages/support",
  "/pages/login",
  "/pages/register",
  "/pages/loginregister",
  "/pages/migrate-account",
  // FAQ tree
  "/pages/faqs/about-open-data",
  "/pages/faqs/api-docs",
  "/pages/faqs/api-tutorial",
  "/pages/faqs/publish",
  "/pages/faqs/reuse",
  "/pages/faqs/terms",
  // Backoffice landings — only the entry points; sub-routes warm via in-app links
  "/pages/admin/",
  "/pages/admin/me/profile",
  "/pages/admin/me/datasets",
  "/pages/admin/me/reuses",
  "/pages/admin/me/community-resources",
  "/pages/admin/me/statistics",
  "/pages/admin/org/datasets",
  "/pages/admin/org/reuses",
  "/pages/admin/org/discussions",
  "/pages/admin/org/members",
  "/pages/admin/org/profile",
  "/pages/admin/org/statistics",
  "/pages/admin/system/datasets",
  "/pages/admin/system/users",
  "/pages/admin/system/topics",
  "/pages/admin/system/posts",
  "/pages/admin/system/editorial",
  "/pages/admin/harvesters",
  "/pages/admin/organizations",
  "/pages/admin/statistics",
];

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (process.env.PLAYWRIGHT_SKIP_WARMUP === "1") {
    console.log("[warmup] PLAYWRIGHT_SKIP_WARMUP=1 — skipping");
    return;
  }

  const baseURL =
    config.projects[0]?.use?.baseURL || "http://localhost:3000";
  const ctx = await request.newContext({
    baseURL,
    // Each first-compile can be slow on a cold dev server.
    timeout: 120_000,
  });

  console.log(
    `[warmup] Pre-compiling ${ROUTES_TO_WARM.length} routes against ${baseURL}…`
  );
  const start = Date.now();
  let ok = 0;
  let fail = 0;

  for (const route of ROUTES_TO_WARM) {
    const t0 = Date.now();
    try {
      const res = await ctx.get(route, { failOnStatusCode: false });
      const status = res.status();
      const ms = Date.now() - t0;
      // 2xx/3xx = compiled; 401/403/404 = compiled but gated/missing — still fine
      if (status < 500) {
        ok++;
        if (ms > 5_000) {
          // Slow first-compile is the whole reason this script exists — surface it
          console.log(`[warmup]  ${status}  ${ms}ms  ${route}`);
        }
      } else {
        fail++;
        console.warn(`[warmup]  ${status}  ${ms}ms  ${route}`);
      }
    } catch (err) {
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[warmup]  ERR ${Date.now() - t0}ms  ${route} — ${msg}`);
    }
  }

  await ctx.dispose();
  const total = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `[warmup] done — ${ok} compiled, ${fail} failed/timeout in ${total}s`
  );
}
