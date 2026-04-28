import { spawnSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { request, type FullConfig } from "playwright/test";

/**
 * Pre-warm the Next.js dev server before the test suite starts AND seed
 * deterministic backoffice fixtures (org/dataset/reuse) for the suite.
 *
 * Pre-warm: in `next dev` mode every route is compiled on first request.
 * When Playwright workers fan out and hit different routes simultaneously,
 * the compiler thrashes and the server may stop responding. This script
 * fires sequential GETs against the routes the suite exercises, with a
 * generous per-request timeout, so each route is already compiled by the
 * time the workers begin. Each request fails open.
 *
 * Seed: invokes `backend/scripts/seed_e2e_fixtures.py` via uv. Idempotent —
 * existing fixtures with the same slug are reused. The matching teardown
 * runs in `global-teardown.ts`.
 *
 * Skip env vars:
 *   PLAYWRIGHT_SKIP_WARMUP=1   skip Next.js pre-compilation
 *   PLAYWRIGHT_SKIP_SEED=1     skip backoffice fixture seeding
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

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "backend");
const FRONTEND_DIR = path.resolve(__dirname, "..");
const DISPOSABLE_PIDS = path.join(FRONTEND_DIR, "tests", ".disposable-pids.json");

interface DisposablePids {
  frontendPid?: number;
}

function disposableEnabled(): boolean {
  // Trigger when the user requested the disposable suite. If the user runs
  // `playwright test` with no project filter (i.e. all projects) we keep
  // it on the safe side: don't auto-spin the disposable stack unless they
  // explicitly enabled it via env var.
  const envFlag = process.env.PLAYWRIGHT_USE_DISPOSABLE === "1";
  const projectArg = process.env.npm_config_project ?? "";
  const argv = process.argv.join(" ");
  return (
    envFlag ||
    projectArg.includes("disposable") ||
    argv.includes("backoffice-disposable") ||
    argv.includes("auth-setup-disposable")
  );
}

function runScript(cmd: string, args: string[], cwd: string, label: string): boolean {
  console.log(`[${label}] running: ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    console.warn(`[${label}] FAILED status=${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    return false;
  }
  if (result.stdout.trim()) {
    console.log(result.stdout.trim().split("\n").map((line) => `[${label}] ${line}`).join("\n"));
  }
  return true;
}

async function waitForUrl(
  url: string,
  timeoutMs = 60_000
): Promise<boolean> {
  const ctx = await request.newContext();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await ctx.get(url, { failOnStatusCode: false, timeout: 5_000 });
      if (res.status() < 500) {
        await ctx.dispose();
        return true;
      }
    } catch {
      // ignore — keep polling
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  await ctx.dispose();
  return false;
}

async function isPortServing(url: string, timeoutMs = 3_000): Promise<boolean> {
  const ctx = await request.newContext();
  try {
    const res = await ctx.get(url, { failOnStatusCode: false, timeout: timeoutMs });
    return res.status() < 500;
  } catch {
    return false;
  } finally {
    await ctx.dispose();
  }
}

async function bootDisposableStack(): Promise<void> {
  console.log("[disposable] booting test stack (DB → backend → frontend)…");

  // 1. Test MongoDB + Redis on 27018/6380
  if (!runScript("bash", ["scripts/test_db.sh", "up"], BACKEND_DIR, "test-db")) {
    throw new Error("[disposable] test DB failed to start");
  }

  // 2. Initialise schema + seed admin/editor/org/dataset/reuse
  runScript(
    "uv",
    ["run", "python", "scripts/init_test_db.py"],
    BACKEND_DIR,
    "init-test-db"
  );

  // 3. Test backend on 7001
  runScript(
    "bash",
    ["scripts/start_test_backend.sh", "--bg"],
    BACKEND_DIR,
    "test-backend"
  );

  // 4. Test frontend on 3001 with BACKEND_URL pointing at the test backend.
  // If an instance is already serving 3001 (e.g. from a prior interactive run),
  // reuse it instead of spawning a duplicate that would fail to bind.
  if (await isPortServing("http://127.0.0.1:3001/")) {
    console.log("[disposable] test frontend already running on 3001 — reusing");
  } else {
    const env = {
      ...process.env,
      BACKEND_URL: process.env.TEST_BACKEND_URL ?? "http://127.0.0.1:7001",
      PORT: "3001",
      NEXT_DIST_DIR: ".next-test",
    };
    const child: ChildProcess = spawn("npm", ["run", "dev", "--", "-p", "3001"], {
      cwd: FRONTEND_DIR,
      env,
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    });
    child.unref();
    console.log(`[disposable] test frontend pid=${child.pid} on http://127.0.0.1:3001`);
    fs.writeFileSync(DISPOSABLE_PIDS, JSON.stringify({ frontendPid: child.pid } satisfies DisposablePids));

    // First-compile of /pages/login can take 60-90s on a cold cache.
    const frontendReady = await waitForUrl("http://127.0.0.1:3001/", 180_000);
    if (!frontendReady) {
      throw new Error("[disposable] test frontend did not become ready in 180s");
    }
  }
  console.log("[disposable] stack ready");
}

function seedBackofficeFixtures(): void {
  if (process.env.PLAYWRIGHT_SKIP_SEED === "1") {
    console.log("[seed] PLAYWRIGHT_SKIP_SEED=1 — skipping fixture seeding");
    return;
  }
  const backendDir = path.resolve(__dirname, "..", "..", "backend");
  console.log("[seed] running scripts/seed_e2e_fixtures.py via uv");
  const result = spawnSync(
    "uv",
    ["run", "python", "scripts/seed_e2e_fixtures.py"],
    {
      cwd: backendDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  if (result.status !== 0) {
    console.warn(
      `[seed] FAILED (status ${result.status}). stderr:\n${result.stderr}`
    );
  } else {
    const lastLine = result.stdout.trim().split("\n").pop() ?? "";
    console.log(`[seed] ${lastLine}`);
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Optionally boot the disposable test stack (test DB + backend + frontend).
  if (disposableEnabled()) {
    await bootDisposableStack();
  }

  // Seed backoffice fixtures regardless of warmup setting — fixtures are also
  // useful for ad-hoc local runs without warmup.
  seedBackofficeFixtures();

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
