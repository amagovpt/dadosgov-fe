import { lookup } from "node:dns/promises";
import { isIPv4, isIPv6 } from "node:net";

import { NextRequest, NextResponse } from "next/server";

/**
 * CSV preview proxy — fetches the CSV body of a community/dataset resource on
 * behalf of the browser and serves it back as `text/plain` for client-side
 * tabular preview.
 *
 * Security model (TICKET-60 / VULN-2079):
 *
 *   1. Allowlist of hostnames AND ports — the original prefix check
 *      `url.startsWith("https://dados.gov.pt")` was bypassable with
 *      `https://dados.gov.pt.s.inty.io` (audit PoC). We now compare the
 *      parsed `URL.hostname` against an exact allowlist and require port
 *      80/443 (no scanning of arbitrary ports on the allowed hosts).
 *
 *   2. Pre-flight DNS resolution — the hostname is resolved once via
 *      `dns.lookup`, the resolved IP is checked against private/loopback/
 *      link-local/CG-NAT/cloud-metadata ranges, and the resolved IP is
 *      pinned for the actual fetch. This closes the DNS-rebinding window
 *      between "validate hostname" and "open TCP connection" that Node's
 *      default fetch leaves open.
 *
 *   3. Streamed body cap — the response is read chunk-by-chunk and aborted
 *      once it exceeds `MAX_BYTES`, instead of loading the full upstream
 *      body into memory before slicing. A malicious or compromised allowed
 *      upstream can no longer OOM the worker by serving 1 GB.
 *
 *   4. Content-Type allowlist — only text/csv-shaped responses are returned;
 *      the proxy is not a generic relay for arbitrary binary content.
 *
 *   5. Redirect refused (`redirect: "error"`) — bypass via 3xx to a different
 *      host is blocked at the WHATWG Fetch level.
 *
 *   6. Identifiable User-Agent on outbound requests so the upstream operators
 *      and downstream WAFs can distinguish proxy traffic from user traffic.
 *
 *   7. Production guardrail — in `NODE_ENV=production` an allowlist entry
 *      that resolves to a private/loopback IP is logged loudly. Operators
 *      should remove such entries; the request itself is rejected anyway by
 *      the IP-validation step.
 */

const DEFAULT_ALLOWED_HOSTS = ["dados.gov.pt", "preprod.dados.gov.pt"];
const MAX_BYTES = 1_000_000; // 1 MiB cap on preview body
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "dadosgov-csv-proxy/1.0 (+https://dados.gov.pt)";

// Loose allowlist of upstream Content-Type prefixes. We accept
// application/octet-stream because some servers serve plain CSV with a
// generic binary type; the body is still treated as text and capped.
const ALLOWED_CONTENT_TYPE_PREFIXES = [
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
  "application/csv",
  "application/octet-stream",
  "application/vnd.ms-excel",
];

type AllowEntry =
  | { kind: "hostname"; value: string }
  | { kind: "host"; value: string; port: string };

// Hostnames / literal IPs that should never appear in a production allowlist.
// Match is substring-based on purpose: catches "localhost", "localhost:7000",
// "127.0.0.1", "0.0.0.0", "169.254.169.254", and the textual form of common
// RFC1918 prefixes. The runtime IP check (`isInternalIp`) is the actual
// enforcement; this is a loud nudge for operators.
const SUSPICIOUS_ALLOWLIST_TOKENS = [
  "localhost",
  "127.",
  "0.0.0.0",
  "::1",
  "169.254.",
  "10.",
  "192.168.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.2",
  "172.30.",
  "172.31.",
  "100.64.",
];

let allowlistGuardrailWarned = false;

function maybeWarnSuspiciousAllowlist(entries: string[]) {
  if (allowlistGuardrailWarned) return;
  if (process.env.NODE_ENV !== "production") return;
  const offenders = entries.filter((e) => SUSPICIOUS_ALLOWLIST_TOKENS.some((t) => e.includes(t)));
  if (offenders.length === 0) {
    allowlistGuardrailWarned = true;
    return;
  }
  // Loud, single-shot warning. The actual block happens at IP-resolution time.
  console.error(
    JSON.stringify({
      event: "proxy-csv",
      level: "error",
      reason: "suspicious-allowlist-in-production",
      offenders,
      note: "CSV_PROXY_ALLOWED_HOSTS contains entries that look like private/loopback/metadata addresses. Remove them from the env var; they will be refused at request time anyway.",
    })
  );
  allowlistGuardrailWarned = true;
}

function parseAllowedHosts(): AllowEntry[] {
  const raw = process.env.CSV_PROXY_ALLOWED_HOSTS;
  const entries = raw
    ? raw
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_ALLOWED_HOSTS;

  maybeWarnSuspiciousAllowlist(entries);

  return entries.map((entry) => {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) return { kind: "hostname", value: entry };
    const host = entry.slice(0, colonIdx);
    const port = entry.slice(colonIdx + 1);
    return { kind: "host", value: host, port };
  });
}

function allowedProtocols(): Set<string> {
  const allowHttp = process.env.CSV_PROXY_ALLOW_HTTP === "true";
  return allowHttp ? new Set(["https:", "http:"]) : new Set(["https:"]);
}

function allowedPortsFor(protocol: string, allowlist: AllowEntry[]): Set<string> {
  const explicitPorts = allowlist
    .filter((e): e is { kind: "host"; value: string; port: string } => e.kind === "host")
    .map((e) => e.port);
  // Always allow the protocol-default port as the empty string (URL.port is "" when implicit).
  const defaults = protocol === "https:" ? ["", "443"] : ["", "80", "443"];
  return new Set([...defaults, ...explicitPorts]);
}

function entryMatches(target: URL, entry: AllowEntry): boolean {
  const hostname = target.hostname.toLowerCase();
  if (entry.kind === "hostname") return entry.value === hostname;
  return entry.value === hostname && entry.port === target.port;
}

// Private / loopback / link-local / CG-NAT / cloud-metadata ranges. If the
// resolved IP falls in any of these, the request is refused in production.
// 169.254.169.254 (cloud metadata) is covered by the 169.254/16 link-local
// rule below.
const PRIVATE_V4: RegExp[] = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^0\.0\.0\.0$/,
];
const PRIVATE_V6: RegExp[] = [
  /^::1$/,
  /^fc/,
  /^fd/,
  /^fe[89ab]/i,
];

function isInternalIp(ip: string): boolean {
  if (isIPv4(ip)) return PRIVATE_V4.some((re) => re.test(ip));
  if (isIPv6(ip)) return PRIVATE_V6.some((re) => re.test(ip.toLowerCase()));
  // Unknown-shape address: treat as internal (fail-closed).
  return true;
}

async function resolveAndValidate(hostname: string): Promise<{ ip: string; family: 4 | 6 }> {
  const { address, family } = await lookup(hostname);
  // Private IPs are accepted in development so local dev (`localhost:7000`)
  // keeps working. In production, refuse loudly.
  if (process.env.NODE_ENV === "production" && isInternalIp(address)) {
    throw new Error(`Hostname ${hostname} resolved to internal IP ${address}`);
  }
  return { ip: address, family: family === 6 ? 6 : 4 };
}

function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

function logProxyEvent(event: Record<string, unknown>) {
  // Structured-ish log line so downstream tooling (Loki/CloudWatch/etc.) can
  // filter by `event=proxy-csv`. Avoids leaking the resolved IP into
  // user-facing responses but emits it in the operator-facing log.
  console.log(JSON.stringify({ event: "proxy-csv", ...event }));
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const requesterIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return jsonError(400, "Missing url parameter");
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return jsonError(400, "Invalid URL");
  }

  // 1. Protocol allowlist (https-only by default).
  const protocols = allowedProtocols();
  if (!protocols.has(target.protocol)) {
    return jsonError(403, "URL not allowed");
  }

  // 2. Hostname allowlist (exact match) + port allowlist.
  const allowlist = parseAllowedHosts();
  const hostMatches = allowlist.some((entry) => entryMatches(target, entry));
  if (!hostMatches) {
    return jsonError(403, "URL not allowed");
  }
  const ports = allowedPortsFor(target.protocol, allowlist);
  if (!ports.has(target.port)) {
    return jsonError(403, "URL not allowed");
  }

  // 3. DNS resolution + IP validation. The resolved IP is then pinned for
  // the actual fetch via a custom `lookup`. This makes the `fetch()` below
  // ignore any subsequent DNS resolution and protects against rebinding.
  let resolved: { ip: string; family: 4 | 6 };
  try {
    resolved = await resolveAndValidate(target.hostname);
  } catch (err) {
    logProxyEvent({
      level: "warn",
      url: target.toString(),
      ip: requesterIp,
      status: 502,
      reason: "dns-resolution-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return jsonError(502, "Failed to resolve upstream host");
  }

  let res: Response;
  try {
    // Pin the resolved IP for the upcoming TCP connection. Node's `fetch`
    // accepts `dispatcher` (undici) for this; falling back to a manual
    // override of the URL's hostname would break TLS SNI / certificate
    // validation on HTTPS, so we keep the original URL and use undici's
    // connect options.
    const { Agent } = await import("undici");
    const agent = new Agent({
      connect: {
        lookup: (_host: string, _options: unknown, cb: (err: Error | null, address: string, family: 4 | 6) => void) =>
          cb(null, resolved.ip, resolved.family),
      },
    });
    res = await fetch(target, {
      headers: {
        Accept: "text/csv, text/plain, */*",
        "User-Agent": USER_AGENT,
      },
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // @ts-expect-error — `dispatcher` is an undici extension Node accepts at runtime.
      dispatcher: agent,
    });
  } catch (err) {
    logProxyEvent({
      level: "warn",
      url: target.toString(),
      ip: requesterIp,
      status: 502,
      reason: "fetch-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return jsonError(502, "Failed to fetch resource");
  }

  if (!res.ok) {
    logProxyEvent({
      level: "info",
      url: target.toString(),
      ip: requesterIp,
      status: res.status,
      reason: "upstream-error",
    });
    return jsonError(res.status, `Upstream returned ${res.status}`);
  }

  // 4. Content-Type allowlist.
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const ctAllowed = ALLOWED_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p));
  if (!ctAllowed) {
    logProxyEvent({
      level: "warn",
      url: target.toString(),
      ip: requesterIp,
      status: 415,
      reason: "content-type-rejected",
      contentType,
    });
    return jsonError(415, "Upstream returned unsupported content-type");
  }

  // 5. Streamed read with hard size cap. Avoids reading 1 GB into memory
  // before truncating.
  const reader = res.body?.getReader();
  if (!reader) {
    return jsonError(502, "Empty response body");
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        chunks.push(value.subarray(0, value.byteLength - (total - MAX_BYTES)));
        total = MAX_BYTES;
        break;
      }
      chunks.push(value);
    }
  } catch (err) {
    logProxyEvent({
      level: "warn",
      url: target.toString(),
      ip: requesterIp,
      status: 502,
      reason: "stream-failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return jsonError(502, "Failed to fetch resource");
  }

  // Concatenate chunks and decode as UTF-8.
  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder("utf-8").decode(body);

  logProxyEvent({
    level: "info",
    url: target.toString(),
    ip: requesterIp,
    status: 200,
    bytes: total,
    latency_ms: Date.now() - t0,
  });

  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
