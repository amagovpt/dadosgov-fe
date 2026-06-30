import fs from "node:fs";
import path from "node:path";

/**
 * Shape of `tests/.fixtures/e2e-fixtures.json`, written by
 * `backend/scripts/seed_e2e_fixtures.py` during globalSetup.
 *
 * Specs that need real seeded data import `loadFixtures()` and key off the
 * exported slugs/IDs, e.g.:
 *
 *   const { dataset } = loadFixtures();
 *   await page.goto(`/admin/me/datasets/edit?slug=${dataset.slug}`);
 */
export interface E2eFixtures {
  admin: { id: string; email: string; slug: string };
  editor: { id: string; email: string; slug: string };
  organization: { id: string; slug: string; name: string };
  dataset: {
    id: string;
    slug: string;
    title: string;
    resource_id: string | null;
  };
  reuse: { id: string; slug: string; title: string };
  // VULN-2075/2076 regression fixtures. Description / title contain raw XSS
  // payloads written via update_one (bypasses pre_save sanitization), so
  // tests in `frontend-vulnerabilities` exercise the rendering pipeline
  // against a worst-case malicious record. See
  // `tests/e2e/frontend-vulnerabilities/_payloads.ts` for the matching keys.
  xss_organization: { id: string; slug: string };
  xss_dataset: { id: string; slug: string };
  xss_reuse: { id: string; slug: string };
}

const FIXTURE_PATH = path.resolve(__dirname, "..", ".fixtures", "e2e-fixtures.json");

let cached: E2eFixtures | null = null;

export function loadFixtures(): E2eFixtures {
  if (cached) return cached;
  if (!fs.existsSync(FIXTURE_PATH)) {
    throw new Error(
      `e2e fixtures not seeded — expected ${FIXTURE_PATH}. ` +
        "Run `npx playwright test` (globalSetup seeds automatically) or " +
        "`uv run python scripts/seed_e2e_fixtures.py` from backend/."
    );
  }
  cached = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf-8")) as E2eFixtures;
  return cached;
}
