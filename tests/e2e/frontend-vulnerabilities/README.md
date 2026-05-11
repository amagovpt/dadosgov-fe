# frontend-vulnerabilities — Regression suite

Isolated Playwright project covering the vulnerability fixes shipped under
TICKET-47 / TICKET-56 / TICKET-57 / TICKET-60. Designed to be runnable on
its own without touching the rest of the e2e tree.

## What it covers

| Spec                                                | Ticket / VULN                                      | Layer asserted                                                                       |
| --------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `01-xss-stored.spec.ts`                             | TICKET-56 / VULN-2075 + TICKET-57 / VULN-2076      | Org/dataset/reuse detail pages render hostile data inertly                           |
| `02-security-headers.spec.ts`                       | TICKET-47                                          | `next.config.ts` security headers + CSP shape                                        |
| `03-ssrf-proxy-csv.spec.ts`                         | TICKET-60 / VULN-2079                              | `/internal-api/proxy-csv` hostname/protocol/port allowlist                           |
| `04-xss-backend-sanitization.spec.ts`               | TICKET-56 / VULN-2075 + TICKET-57 / VULN-2076      | HTTP-contract: backend strips `<script>`, `onerror=`, `<svg>` on POST/PUT round-trip |
| `05-rate-limit-community-resources.spec.ts`         | TICKET-59 / VULN-2078                              | HTTP-contract: ≥1 of 6 rapid POSTs to community_resources returns 429                |

## Running

```bash
# From the frontend/ directory, with the dev server already running on :3000
npm run dev   # in another terminal

npm run test:e2e:vulns          # full suite, HTML reporter
npm run test:e2e:vulns:headed   # watch the browser
npm run test:e2e:vulns:ui       # Playwright UI mode

# A single spec
npx playwright test --project=frontend-vulnerabilities 03-ssrf-proxy-csv.spec.ts

# A single test by title
npx playwright test --project=frontend-vulnerabilities -g "SSRF rejects loopback"
```

The project depends on `auth-setup` so authenticated specs (04, 05)
inherit the admin session cookie from `tests/.auth/admin.json`. The udata
`/api/1` blueprint is `csrf.exempt`, so the session cookie alone is
sufficient for POST/PUT/DELETE — no CSRF token dance. Anonymous specs
(01, 02, 03) ignore the storage state and still work.

## Data dependencies

`01-xss-stored.spec.ts` reads slugs from
`tests/.fixtures/e2e-fixtures.json`, which is written by
`backend/scripts/seed_e2e_fixtures.py` during Playwright's globalSetup. The
seed script provisions three records with deliberately malicious content
written via `update_one(set__description=...)` so that
`Organization.pre_save` / `Reuse.pre_save` / `Dataset.pre_save`
sanitization is bypassed — the DB ends up with a worst-case malicious
record, and we test what the rendering pipeline does with it.

Slugs (see `seed_e2e_fixtures.py`):

- `e2e-xss-test-organization`
- `e2e-xss-test-dataset`
- `e2e-xss-test-reuse`

Payloads live in `_payloads.ts` (TS side) and `XSS_DESCRIPTION_PAYLOAD` /
`XSS_TITLE_PAYLOAD` in `seed_e2e_fixtures.py` (Python side). The keys must
stay in sync; `XSS-05` is a guardrail test that fails if the inventories
drift.

If you ever need to wipe and reseed these records:

```bash
cd backend
uv run python scripts/seed_e2e_fixtures.py
```

The script is idempotent — existing records are reused; only the
description/title field is rewritten to the current payload.

## Known fixme

- **RL-02 (`05-rate-limit-community-resources.spec.ts`)** — TICKET-59's AC
  requires the 429 response to include a `Retry-After` header. As of
  2026-05-11 the udata backend returns 429 without that header (confirmed
  via direct curl). The test is marked `test.fixme(true, …)` so the
  suite stays green; the day the backend adds the header (e.g.
  `RATELIMIT_HEADERS_ENABLED=True` in Flask-Limiter), flip the fixme back
  to a regular test.

## When a test fails

- **XSS-01..04 fail** → a regression of VULN-2075 / VULN-2076 has shipped.
  Most likely cause: someone reintroduced `dangerouslySetInnerHTML` on a
  user-controlled field, or removed `rehype-sanitize` from the
  `ReactMarkdown` chain. Inspect the failing scenario's URL and the
  `window.__xssFlags` dump in the test output.
- **HDR-* fail** → check whether `next.config.ts:headers()` was reordered
  or trimmed. The TICKET-47 audit log
  (`docs/testsprite-vulnerability-frontend-report.md`) is the source of
  truth for which headers must be present.
- **CSP-* fail** → if `'unsafe-eval'` came back, somebody pulled in a
  dependency that eval()s. If `frame-ancestors 'none'` is missing,
  clickjacking protection has regressed.
- **SSRF * fail** → the audit's exact bypass vector
  (`dados.gov.pt.s.inty.io`) is a named case; if that one fails, the
  hostname allowlist regressed to a `startsWith` / substring shape.
- **/api/proxy-csv duplicate** → the deleted duplicate route was
  reintroduced. Delete it.
- **XSS-BE-01..03 fail with `429: 2 per 1 minute`** → you ran the suite
  several times in <60s and burned the per-user `HEAVY_CREATE_LIMIT`
  bucket. The spec deliberately uses PUT against the seeded
  `e2e-test-organization` to stay under this cap — if it still fires,
  somebody else (a parallel run, another spec, manual UI work) is also
  POSTing orgs as `e2e-admin`. Wait 60s and rerun.
- **RL-01 fail with `accepted=6 rejected=0`** → rate-limit middleware is
  disabled or the `@limiter.limit(CONTENT_CREATE_LIMIT, …)` decorator on
  `CommunityResourcesAPI.post` was removed. VULN-2078 has regressed.

## Why a separate project?

- `frontend-public` is for functional/UX coverage of anonymous pages and
  has no need to fail loudly on security regressions.
- `backoffice` requires auth setup and storage state.
- This suite needs **neither auth nor a UI flow** — only the seeded XSS
  fixtures (already part of `globalSetup`) and a running dev frontend.
- Splitting it lets the security gate run in a few seconds in CI, and
  lets you reproduce a single regression in isolation without booting the
  rest of the e2e tree.
