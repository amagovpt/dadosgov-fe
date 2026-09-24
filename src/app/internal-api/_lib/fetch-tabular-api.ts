import { UUID_RE, logProxyEvent } from "./fetch-resource-bytes";

/**
 * Shared fetch helper for the api-tabular proxy routes.
 *
 * api-tabular (github.com/datagouv/api-tabular) serves server-side paginated
 * previews of resources ingested by the hydra/csv-detective pipeline. The
 * service is internal-only (not reachable from the public internet and
 * blocked by our CSP `connect-src`), so the browser goes through these
 * proxies. These routes must live under /internal-api/ — every /api/* path
 * is shadowed by the Next rewrite to the Flask backend.
 *
 * Security model mirrors fetch-resource-bytes.ts: the browser supplies only
 * a resource UUID (validated before any outbound request) and the upstream
 * host is the operator-configured TABULAR_API_URL — no user-controlled host,
 * hence no SSRF surface.
 */

const TABULAR_API_URL = process.env.TABULAR_API_URL || "http://localhost:8005";
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "dadosgov-preview-proxy/1.0 (+https://dados.gov.pt)";

export type TabularFetchResult =
  | { ok: true; body: unknown }
  | { ok: false; status: number; error: string };

/**
 * Fetch a resource's `data` or `profile` document from api-tabular.
 * `query` is a pre-built query string (without the leading `?`).
 *
 * Upstream status mapping — 404 (never ingested) and 410 (deleted by the
 * producer) have PLAIN TEXT bodies, so status is branched on before any
 * body parsing; both collapse to a 404 "not-ingested" the client treats as
 * "fall back to the byte-proxy preview".
 */
export async function fetchTabularApi(
  rid: string | null,
  path: "data" | "profile",
  query: string,
  logLabel: string
): Promise<TabularFetchResult> {
  const t0 = Date.now();

  if (!rid || !UUID_RE.test(rid)) {
    return { ok: false, status: 400, error: "Invalid or missing resource id" };
  }

  // Trailing slash before the query string is mandatory (aiohttp routing).
  const target = `${TABULAR_API_URL}/api/resources/${rid}/${path}/${query ? `?${query}` : ""}`;

  let res: Response;
  try {
    res = await fetch(target, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    logProxyEvent(logLabel, {
      level: "warn",
      rid,
      status: 502,
      reason: "fetch-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, status: 502, error: "Failed to reach tabular API" };
  }

  if (res.status === 404 || res.status === 410) {
    logProxyEvent(logLabel, {
      level: "info",
      rid,
      status: res.status,
      reason: res.status === 404 ? "not-ingested" : "deleted",
      latency_ms: Date.now() - t0,
    });
    return { ok: false, status: 404, error: "not-ingested" };
  }

  if (!res.ok) {
    // Other errors carry a JSON {errors:[{title,detail}]} envelope — read it
    // defensively for the log only, never relay upstream internals.
    let detail = "";
    try {
      const errBody = (await res.json()) as { errors?: { title?: string; detail?: string }[] };
      detail = errBody.errors?.[0]?.detail ?? errBody.errors?.[0]?.title ?? "";
    } catch {
      // non-JSON error body — nothing to log beyond the status
    }
    logProxyEvent(logLabel, {
      level: "warn",
      rid,
      status: res.status,
      reason: "upstream-error",
      detail,
    });
    return { ok: false, status: 502, error: "Tabular API error" };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    logProxyEvent(logLabel, {
      level: "warn",
      rid,
      status: 502,
      reason: "invalid-json",
      detail: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, status: 502, error: "Tabular API returned invalid JSON" };
  }

  logProxyEvent(logLabel, {
    level: "info",
    rid,
    status: 200,
    latency_ms: Date.now() - t0,
  });

  return { ok: true, body };
}
