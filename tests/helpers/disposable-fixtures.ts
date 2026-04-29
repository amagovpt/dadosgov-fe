/**
 * Constant slug references for the disposable test backend.
 *
 * `backend/scripts/init_test_db.py` provisions records with these exact
 * slugs/emails before each Playwright run, so disposable specs can
 * reference them without a JSON file lookup. They are NEVER the same as
 * the dev-DB fixtures (which live behind `loadFixtures()` in fixtures.ts).
 */
export const DISPOSABLE = {
  admin: { email: "e2e-admin@dados.gov.pt", password: "E2eAdmin2026!" },
  editor: { email: "e2e-editor@dados.gov.pt", password: "E2eEditor2026!" },
  organization: {
    slug: "e2e-test-organization",
    name: "E2E Test Organization",
  },
  dataset: {
    slug: "e2e-test-dataset",
    title: "E2E Test Dataset",
  },
  reuse: {
    slug: "e2e-test-reuse",
    title: "E2E Test Reuse",
  },
} as const;
