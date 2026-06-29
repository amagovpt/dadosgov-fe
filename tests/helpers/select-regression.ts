/**
 * Shared matrix of "selects that must be populated" across the backoffice.
 *
 * Each entry pairs:
 *   • a form `route`,
 *   • the Agora `<InputSelect>` `id`s on that form whose option list MUST be
 *     non-empty for the form to be usable, and
 *   • the API URL patterns whose payload feeds those selects.
 *
 * Search-as-you-type selects (placeholder "Pesquise…" / "Pesquisar…") are
 * intentionally excluded — they're empty until the user types a query, so a
 * 0-option assertion would be a false negative.
 *
 * Auto-prefilled selects (the producer identity dropdown that defaults to
 * the current user's name) are also excluded — clicking them may surface
 * just the active value with no other choices when the user is not in any
 * organisation.
 *
 * Adding coverage = adding an entry here. The regression spec
 * (`tests/e2e/backoffice/99-select-regression.spec.ts`) iterates the whole
 * list automatically.
 */
export interface SelectRegressionCase {
  route: string;
  selectIds: string[];
  api: string[];
}

/**
 * The fixtures the matrix depends on are imported lazily via
 * `loadFixtures()` so tests using this helper still work when the seed has
 * not run yet. Edit pages substitute the seeded slugs (`e2e-test-dataset`,
 * `e2e-test-reuse`, `e2e-test-organization`) at runtime.
 */
const FIXTURE_DATASET_SLUG = "e2e-test-dataset";
const FIXTURE_REUSE_SLUG = "e2e-test-reuse";

export const SELECT_REGRESSION_CASES: SelectRegressionCase[] = [
  // ── Reuses wizard (step 1) ────────────────────────────────────────────
  {
    route: "/admin/me/reuses/new/",
    selectIds: [
      "agora-input-select-reuse-type-control",
      "agora-input-select-reuse-theme-control",
    ],
    api: ["**/api/1/reuses/types/", "**/api/1/reuses/topics/"],
  },
  {
    route: "/admin/reuses/new/",
    selectIds: [
      "agora-input-select-reuse-type-control",
      "agora-input-select-reuse-theme-control",
    ],
    api: ["**/api/1/reuses/types/", "**/api/1/reuses/topics/"],
  },

  // ── Datasets wizard (step 2 = metadata) ───────────────────────────────
  // Note: `spatial-coverage` is excluded — it is a search-as-you-type select
  // backed by `/api/1/spatial/zones/suggest/?q=…`, so it is empty until the
  // user types. Asserting >0 options would be a false negative.
  {
    route: "/admin/me/datasets/new/?step=2",
    selectIds: [
      "agora-input-select-dataset-license-control",
      "agora-input-select-dataset-frequency-control",
      "agora-input-select-dataset-spatial-granularity-control",
    ],
    api: [
      "**/api/1/datasets/licenses/",
      "**/api/1/datasets/frequencies/",
      "**/api/1/spatial/granularities/",
    ],
  },

  // ── Harvesters wizard ─────────────────────────────────────────────────
  {
    route: "/admin/harvesters/new/",
    selectIds: ["agora-input-select-harvester-type-control"],
    api: ["**/api/1/harvest/backends/"],
  },

  // ── Dataset edit (seeded fixture) ─────────────────────────────────────
  {
    route: `/admin/me/datasets/edit?slug=${FIXTURE_DATASET_SLUG}`,
    selectIds: [
      "agora-input-select-edit-license-control",
      "agora-input-select-edit-frequency-control",
      "agora-input-select-edit-spatial-coverage-control",
      "agora-input-select-edit-spatial-granularity-control",
    ],
    api: [
      "**/api/1/datasets/licenses/",
      "**/api/1/datasets/frequencies/",
      "**/api/1/spatial/zones/",
      "**/api/1/spatial/granularities/",
    ],
  },

  // ── Reuse edit (seeded fixture) ───────────────────────────────────────
  {
    route: `/admin/me/reuses/edit?slug=${FIXTURE_REUSE_SLUG}`,
    selectIds: [
      "agora-input-select-edit-type-control",
      "agora-input-select-edit-topic-control",
    ],
    api: ["**/api/1/reuses/types/", "**/api/1/reuses/topics/"],
  },
];
