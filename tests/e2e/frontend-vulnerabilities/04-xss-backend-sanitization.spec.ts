import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";
import {
  createReuse,
  deleteReuse,
  getJson,
  randomSuffix,
  updateOrganization,
  type CreatedReuse,
} from "./_backend";

/**
 * Backend sanitization contract — VULN-2075 (organization) + VULN-2076
 * (reuse description + title).
 *
 * The matching pytests live in `backend/udata/tests/` and exercise
 * `pre_save` / `OrganizationForm.validate()` / `api_fields.patch()`
 * directly. This spec is the HTTP-contract version of those: we ship a
 * malicious payload through the public REST API and assert the round-trip
 * GET no longer contains the dangerous tokens.
 *
 * Why this is worth adding alongside the pytests:
 *   pytest can't catch a regression that hides between Flask and the
 *   form, e.g. a middleware that double-decodes JSON, a content-type
 *   negotiation change, or a future API v3 wiring that bypasses
 *   `OrganizationForm`.
 *
 * Rate-limit constraints (TICKET-59):
 *   POST /api/1/organizations/ is gated by HEAVY_CREATE_LIMIT
 *   ("2 per minute; 5 per hour; 10 per day"). To stay under the cap we
 *   PUT the seeded `e2e-test-organization` instead of creating a fresh
 *   one — the same `OrganizationForm.validate()` → `pre_save` pipeline
 *   runs on update. The original description is captured in `beforeAll`
 *   and restored in `afterAll`, so the fixture round-trips back to its
 *   pre-test state. Reuse uses CONTENT_CREATE_LIMIT (5/min), comfortable
 *   for one POST per run.
 *
 * The describe block is `serial` so the two org tests don't race each
 * other on the shared fixture.
 */

test.describe.configure({ mode: "serial" });

const XSS_PAYLOAD_DESCRIPTION = [
  '<img src=x onerror="window.__xssFlags=1">',
  "<script>window.__xss=1</script>",
  '<svg onload="alert(1)"></svg>',
  "[javascript-link](javascript:alert(1))",
].join("\n\n");

const XSS_PAYLOAD_TITLE = '<img src=x onerror="alert(1)"> Title';

/**
 * What the backend MUST strip on write:
 *   - raw `<script>` start tags
 *   - event-handler attributes on any tag (`onerror=`, `onload=`, ...)
 *   - `<svg>` / `<iframe>` with active payloads (covered by bleach's
 *     tag allow-list, which excludes both)
 *
 * What it is NOT required to strip — defense lives at render time
 * (`rehype-sanitize` in react-markdown):
 *   - markdown links with `javascript:` href, e.g. `[click](javascript:…)`.
 *     `sanitize_markdown_html` cleans HTML only; the markdown is stored
 *     verbatim and the rendering pipeline must refuse to emit a clickable
 *     `<a href="javascript:…">`. End-to-end behaviour is verified by
 *     `01-xss-stored.spec.ts` (browser-level XSS flag).
 */
const FORBIDDEN_SUBSTRINGS_DESCRIPTION = ["<script", "onerror=", "onload=", "<svg", "<iframe"];
const FORBIDDEN_SUBSTRINGS_TITLE = ["<", ">", "onerror=", "javascript:"];

function assertSanitized(
  value: string | null,
  fieldLabel: string,
  forbidden: string[],
): void {
  expect(value, `${fieldLabel} should be non-null after round-trip`).not.toBeNull();
  const lower = (value ?? "").toLowerCase();
  for (const needle of forbidden) {
    expect(
      lower.includes(needle),
      `${fieldLabel} contains forbidden substring "${needle}" — backend ` +
        `sanitization regressed. Value:\n${value}`,
    ).toBe(false);
  }
}

test.describe("Backend sanitization (VULN-2075 / VULN-2076)", () => {
  let originalOrgDescription: string | null = null;
  let orgName: string | null = null;

  test.beforeAll(async ({ request }) => {
    const { organization } = loadFixtures();
    const current = await getJson<{ name: string; description: string | null }>(
      request,
      `/api/1/organizations/${organization.slug}/`,
    );
    originalOrgDescription = current.description;
    orgName = current.name;
  });

  test.afterAll(async ({ request }) => {
    // Best-effort restore so other suites that consume the seeded org
    // don't see one of our payloads lingering.
    if (orgName !== null) {
      const { organization } = loadFixtures();
      await updateOrganization(request, organization.slug, {
        name: orgName,
        description: originalOrgDescription ?? "",
      }).catch(() => undefined);
    }
  });

  test("XSS-BE-01: PUT organization with XSS description → round-trip is sanitized", async ({
    request,
  }) => {
    const { organization } = loadFixtures();
    expect(orgName, "beforeAll did not capture the org name").not.toBeNull();

    await updateOrganization(request, organization.slug, {
      name: orgName!,
      description: XSS_PAYLOAD_DESCRIPTION,
    });

    const roundTrip = await getJson<{ description: string | null }>(
      request,
      `/api/1/organizations/${organization.slug}/`,
    );
    assertSanitized(
      roundTrip.description,
      "organization.description",
      FORBIDDEN_SUBSTRINGS_DESCRIPTION,
    );
  });

  test("XSS-BE-02: POST /api/1/reuses/ strips dangerous HTML from description and title", async ({
    request,
  }) => {
    const { dataset } = loadFixtures();
    const suffix = randomSuffix();
    let created: CreatedReuse | null = null;
    try {
      created = await createReuse(request, {
        title: `${XSS_PAYLOAD_TITLE} ${suffix}`,
        description: XSS_PAYLOAD_DESCRIPTION,
        type: "api",
        topic: "open_data_tools",
        // `urlhash` is unique=True on the model; suffix avoids collisions
        // with tombstoned reuses from previous runs.
        url: `https://example.com/vuln-be-spec-${suffix}`,
        datasets: [dataset.id],
      });

      const roundTrip = await getJson<{
        description: string | null;
        title: string | null;
      }>(request, `/api/1/reuses/${created.id}/`);
      assertSanitized(
        roundTrip.description,
        "reuse.description",
        FORBIDDEN_SUBSTRINGS_DESCRIPTION,
      );
      // `Reuse.title` is plain text (`sanitize_strict` strips ALL HTML),
      // so the tighter contract applies: no markup at all.
      assertSanitized(roundTrip.title, "reuse.title", FORBIDDEN_SUBSTRINGS_TITLE);
    } finally {
      if (created) await deleteReuse(request, created.id).catch(() => undefined);
    }
  });

  test("XSS-BE-03: legitimate markdown survives the sanitization pipeline", async ({
    request,
  }) => {
    // Guardrail against over-eager sanitization. If someone tightens the
    // allow-list to the point where `**bold**` or `[link](https://...)`
    // gets mangled, this test surfaces the regression before users do.
    const { organization } = loadFixtures();
    expect(orgName, "beforeAll did not capture the org name").not.toBeNull();

    const safeMarkdown = [
      "## Heading",
      "",
      "Some **bold** and _italic_ copy.",
      "",
      "- list item 1",
      "- list item 2",
      "",
      "[homepage](https://dados.gov.pt)",
    ].join("\n");

    await updateOrganization(request, organization.slug, {
      name: orgName!,
      description: safeMarkdown,
    });

    const roundTrip = await getJson<{ description: string | null }>(
      request,
      `/api/1/organizations/${organization.slug}/`,
    );
    const desc = roundTrip.description ?? "";
    // Markdown markers are preserved (bleach strips raw HTML, not markdown).
    // Asserting on raw markers is resilient to whether the backend
    // serializes as MD or pre-rendered HTML.
    expect(desc).toContain("**bold**");
    expect(desc).toContain("[homepage]");
    expect(desc).toContain("https://dados.gov.pt");
  });
});
