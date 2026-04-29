import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Tear down everything globalSetup created:
 *   • dev-DB fixtures (org/dataset/reuse) via teardown_e2e_fixtures.py
 *   • the disposable Next.js dev server on port 3001 (PID file)
 *   • the disposable backend on port 7001
 *   • the docker-compose.test.yml stack (Mongo+Redis on 27018/6380)
 *
 * Skip via PLAYWRIGHT_SKIP_SEED=1 (skip the dev-fixture teardown only) or
 * PLAYWRIGHT_KEEP_FIXTURES=1 (keep both fixtures and disposable stack alive).
 */

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "backend");
const FRONTEND_DIR = path.resolve(__dirname, "..");
const DISPOSABLE_PIDS = path.join(FRONTEND_DIR, "tests", ".disposable-pids.json");

function teardownDevFixtures(): void {
  if (process.env.PLAYWRIGHT_SKIP_SEED === "1") {
    console.log("[teardown] PLAYWRIGHT_SKIP_SEED=1 — skipping fixture teardown");
    return;
  }
  if (process.env.PLAYWRIGHT_KEEP_FIXTURES === "1") {
    console.log(
      "[teardown] PLAYWRIGHT_KEEP_FIXTURES=1 — leaving fixtures in place"
    );
    return;
  }
  console.log("[teardown] running scripts/teardown_e2e_fixtures.py via uv");
  const result = spawnSync(
    "uv",
    ["run", "python", "scripts/teardown_e2e_fixtures.py"],
    { cwd: BACKEND_DIR, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (result.status !== 0) {
    console.warn(
      `[teardown] FAILED (status ${result.status}). stderr:\n${result.stderr}`
    );
  } else {
    console.log(`[teardown] ok\n${result.stdout.trim()}`);
  }
}

function teardownDisposableStack(): void {
  if (process.env.PLAYWRIGHT_KEEP_FIXTURES === "1") {
    console.log("[disposable-teardown] PLAYWRIGHT_KEEP_FIXTURES=1 — leaving the disposable stack running");
    return;
  }
  if (!fs.existsSync(DISPOSABLE_PIDS)) {
    return; // never booted
  }

  console.log("[disposable-teardown] tearing down test stack…");
  try {
    const pids = JSON.parse(fs.readFileSync(DISPOSABLE_PIDS, "utf8")) as {
      frontendPid?: number;
    };
    if (pids.frontendPid) {
      try {
        // Killing the dev server's process group so child workers also die.
        process.kill(-pids.frontendPid, "SIGTERM");
      } catch {
        try {
          process.kill(pids.frontendPid, "SIGTERM");
        } catch {
          /* already gone */
        }
      }
    }
  } catch (err) {
    console.warn(`[disposable-teardown] could not read pid file: ${err}`);
  }
  fs.rmSync(DISPOSABLE_PIDS, { force: true });

  // Stop test backend (writes its own .test-backend.pid in the backend dir)
  spawnSync("bash", ["scripts/start_test_backend.sh", "stop"], {
    cwd: BACKEND_DIR,
    stdio: "inherit",
  });

  // Tear the docker stack down (also wipes the tmpfs volumes for safety)
  spawnSync("bash", ["scripts/test_db.sh", "down"], {
    cwd: BACKEND_DIR,
    stdio: "inherit",
  });
}

export default async function globalTeardown(): Promise<void> {
  teardownDevFixtures();
  teardownDisposableStack();
}
