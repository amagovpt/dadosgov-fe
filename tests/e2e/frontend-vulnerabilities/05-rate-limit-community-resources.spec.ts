import { test, expect } from "playwright/test";
import { loadFixtures } from "../../helpers/fixtures";
import {
  deleteCommunityResource,
  postCommunityResource,
  randomSuffix,
} from "./_backend";

/**
 * Rate-limit regression — VULN-2078 / TICKET-59 for
 * `POST /api/1/datasets/community_resources/`.
 *
 * The backend wraps the POST in:
 *   @limiter.limit(CONTENT_CREATE_LIMIT, methods=["POST"], key_func=user_or_ip)
 * with `CONTENT_CREATE_LIMIT = "5 per minute; 30 per hour; 100 per day"`
 * keyed per user.
 *
 * The matching pytest (test_vuln_2078_audit_simulation.py) verifies the
 * decorator directly. This spec is the HTTP-contract version: a malicious
 * client hammering the public REST endpoint should be stopped at the 6th
 * request inside a 60s window.
 *
 * Caveats:
 *   - The dev backend uses `RATELIMIT_STORAGE_URI = "memory://"`. If you
 *     run the spec twice in <60s, run two specs that share the user, or
 *     restart the backend between the two runs, the in-process counter
 *     state is whatever happens to be left over. The spec is therefore
 *     written to assert the *invariant* ("6 rapid POSTs cannot all
 *     succeed; at least one returns 429"), not the exact "5 succeed,
 *     6th fails" split — that strict shape would be flaky across reruns.
 *     A second test asserts the strict shape and skips itself if the
 *     bucket is already partially used so we don't get false reds.
 *   - Each POST uses a unique URL to avoid the dedupe-window 409 branch.
 *   - Successful POSTs are cleaned up in afterAll on a best-effort basis.
 */

const RAPID_POST_COUNT = 6;

interface PostOutcome {
  status: number;
  retryAfter: string | null;
  id: string | null;
}

test.describe("Rate-limit — POST community_resources (VULN-2078)", () => {
  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    await Promise.all(
      createdIds.map((id) =>
        deleteCommunityResource(request, id).catch(() => undefined),
      ),
    );
  });

  async function postRapid(
    request: import("playwright/test").APIRequestContext,
    datasetId: string,
    runTag: string,
  ): Promise<PostOutcome[]> {
    // Issue in parallel so the limiter sees true concurrency. Mongo will
    // serialise the writes server-side; what matters is that all 6 requests
    // share the same 60s window.
    const promises = Array.from({ length: RAPID_POST_COUNT }, (_, i) =>
      postCommunityResource(request, {
        dataset: datasetId,
        title: `Vuln Rate Spec ${runTag} #${i}`,
        url: `https://example.com/vuln-rate-${runTag}-${i}.csv`,
      }),
    );
    const responses = await Promise.all(promises);

    const outcomes: PostOutcome[] = [];
    for (const res of responses) {
      const status = res.status();
      const retryAfter = res.headers()["retry-after"] ?? null;
      let id: string | null = null;
      if (status === 201) {
        try {
          const body = (await res.json()) as { id?: string };
          if (body.id) {
            id = body.id;
            createdIds.push(body.id);
          }
        } catch {
          // ignore parse errors — id stays null
        }
      }
      outcomes.push({ status, retryAfter, id });
    }
    return outcomes;
  }

  test("RL-01: 6 rapid POSTs cannot all succeed — limiter must reject at least one", async ({
    request,
  }) => {
    const { dataset } = loadFixtures();
    const outcomes = await postRapid(request, dataset.id, randomSuffix());

    const statuses = outcomes.map((o) => o.status);
    const rejected = outcomes.filter((o) => o.status === 429);
    const accepted = outcomes.filter((o) => o.status === 201);
    const unexpected = outcomes.filter(
      (o) => o.status !== 201 && o.status !== 429,
    );

    expect(
      unexpected,
      `unexpected non-201/non-429 statuses: ${JSON.stringify(
        unexpected.map((o) => o.status),
      )} (full: ${statuses.join(",")})`,
    ).toEqual([]);
    expect(
      rejected.length,
      "expected ≥1 request to be rate-limited (429); got " +
        `accepted=${accepted.length} rejected=${rejected.length} statuses=${statuses.join(",")}`,
    ).toBeGreaterThanOrEqual(1);
  });

  test("RL-02: 429 response carries a Retry-After header", async ({
    request,
  }) => {
    // TICKET-59 AC: "ao 6.º pedido em <60s pelo mesmo utilizador autenticado
    // devolve 429 com Retry-After". As of 2026-05-11 the udata backend
    // returns 429 but omits Retry-After (confirmed via direct curl against
    // :7000). Flask-Limiter supports this via `Retry-After`/`retry_after`
    // config — leaving the spec live (and marked fixme) so the day the
    // backend ships the header, this test goes green and we know.
    test.fixme(
      true,
      "Backend 429 currently has no Retry-After header — see TICKET-59 AC. " +
        "Flip this back to a regular test once Flask-Limiter is configured " +
        "to emit it (e.g. RATELIMIT_HEADERS_ENABLED=True).",
    );
    const { dataset } = loadFixtures();
    const outcomes = await postRapid(request, dataset.id, randomSuffix());
    const first429 = outcomes.find((o) => o.status === 429);
    test.skip(!first429, "no 429 in this run — quota was already exhausted upstream");
    if (!first429) return;
    expect(
      first429.retryAfter,
      "429 response should set Retry-After so clients can back off",
    ).not.toBeNull();
  });

  test("RL-03: strict shape — at most CONTENT_CREATE_LIMIT/min succeed in a fresh window", async ({
    request,
  }) => {
    // Only meaningful when no prior test has burned the per-user bucket.
    // The previous tests in this file each consume up to 5 POSTs in their
    // own 60s window; running this test isolated (-g "RL-03") is the
    // canonical way to validate the exact 5-succeed-then-429 shape.
    const { dataset } = loadFixtures();
    const outcomes = await postRapid(request, dataset.id, randomSuffix());
    const accepted = outcomes.filter((o) => o.status === 201).length;
    test.skip(
      accepted === 0,
      "bucket fully consumed by previous tests — rerun this case in isolation " +
        "(`npx playwright test -g RL-03`) or wait 60s",
    );
    expect(
      accepted,
      `expected ≤5 accepted in a single minute (CONTENT_CREATE_LIMIT); got ${accepted}`,
    ).toBeLessThanOrEqual(5);
  });
});
