import { NextRequest } from "next/server";

/**
 * Catalogue-scoped resource fetch for the tabular-preview proxy routes.
 *
 * Security model:
 *
 * The browser never supplies a URL — only a resource UUID. We resolve and
 * stream the bytes exclusively through the backend's own download resolver
 * `GET /api/1/datasets/r/<id>/`, which:
 *   - looks the resource up in the udata catalogue (dataset or community),
 *   - serves hosted files from storage, and
 *   - proxies remote files through the backend's hardened SSRF guard.
 *
 * Because the only outbound request this route makes is to the trusted,
 * operator-configured BACKEND_URL with a strictly-validated UUID path, there
 * is no server-side request forgery surface here at all (no user-controlled
 * host, no host allowlist to maintain, no DNS-rebinding window). The SSRF
 * boundary lives in the backend, on the same path the public download button
 * already uses.
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:7000";
const FETCH_TIMEOUT_MS = 20_000;
const USER_AGENT = "dadosgov-preview-proxy/1.0 (+https://dados.gov.pt)";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function logProxyEvent(label: string, event: Record<string, unknown>) {
  console.log(JSON.stringify({ event: label, ...event }));
}

export interface FetchResourceOptions {
  /** Hard cap on the streamed body, in bytes. */
  maxBytes: number;
  /** Log event label (e.g. "proxy-csv", "proxy-spreadsheet"). */
  logLabel: string;
}

export type FetchResourceResult =
  | { ok: true; bytes: Uint8Array; total: number; lastModified: string | null }
  | { ok: false; status: number; error: string };

/**
 * Stream a catalogue resource's bytes via the backend download resolver.
 * `rid` must be the resource UUID; anything else is rejected before any
 * outbound request is made.
 */
export async function fetchResourceBytes(
  request: NextRequest,
  rid: string | null,
  opts: FetchResourceOptions
): Promise<FetchResourceResult> {
  const t0 = Date.now();
  const { maxBytes, logLabel } = opts;
  const requesterIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

  if (!rid || !UUID_RE.test(rid)) {
    return { ok: false, status: 400, error: "Invalid or missing resource id" };
  }

  const target = `${BACKEND_URL}/api/1/datasets/r/${rid}/`;

  let res: Response;
  try {
    res = await fetch(target, {
      headers: {
        "User-Agent": USER_AGENT,
        // Forward the original client IP so the backend's user_or_ip rate
        // limiter keys on the real visitor instead of collapsing every
        // preview to this server's egress IP.
        ...(requesterIp !== "?" ? { "X-Forwarded-For": requesterIp } : {}),
      },
      // The resolver streams the body directly (HTTP 200, no redirect). Fail
      // closed if it ever redirects, rather than following into an unvetted
      // location.
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    logProxyEvent(logLabel, {
      level: "warn",
      rid,
      ip: requesterIp,
      status: 502,
      reason: "fetch-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, status: 502, error: "Failed to fetch resource" };
  }

  if (!res.ok) {
    logProxyEvent(logLabel, {
      level: "info",
      rid,
      ip: requesterIp,
      status: res.status,
      reason: "upstream-error",
    });
    return { ok: false, status: res.status, error: `Upstream returned ${res.status}` };
  }

  // Streamed read with a hard size cap.
  const reader = res.body?.getReader();
  if (!reader) {
    return { ok: false, status: 502, error: "Empty response body" };
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        chunks.push(value.subarray(0, value.byteLength - (total - maxBytes)));
        total = maxBytes;
        break;
      }
      chunks.push(value);
    }
  } catch (err) {
    logProxyEvent(logLabel, {
      level: "warn",
      rid,
      ip: requesterIp,
      status: 502,
      reason: "stream-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, status: 502, error: "Failed to fetch resource" };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }

  logProxyEvent(logLabel, {
    level: "info",
    rid,
    ip: requesterIp,
    status: 200,
    bytes: total,
    latency_ms: Date.now() - t0,
  });

  return { ok: true, bytes, total, lastModified: res.headers.get("last-modified") };
}
