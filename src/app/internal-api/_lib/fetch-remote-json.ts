import dns from "node:dns/promises";
import net from "node:net";

import { logProxyEvent } from "./fetch-resource-bytes";

/**
 * SSRF-hardened fetch of a browser-supplied remote JSON document.
 *
 * Unlike the catalogue proxies (which only take a UUID), the Swagger proxy
 * receives an arbitrary URL from the dataservice's `machine_documentation_url`.
 * That is a server-side request forgery surface, so before every hop we:
 *   - require an http(s) scheme;
 *   - reject localhost / *.local and any host that resolves to a private,
 *     loopback, link-local or CGNAT address (blocks hostname -> internal IP);
 *   - follow redirects manually (max 3), re-validating each Location.
 * A TOCTOU DNS-rebinding window remains between check and connect; acceptable
 * here because the URL is operator/publisher-set, not anonymous input.
 */

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const USER_AGENT = "dadosgov-swagger-proxy/1.0 (+https://dados.gov.pt)";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
  if (lower.startsWith("fe80")) return true; // link-local
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("invalid-url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("bad-scheme");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("blocked-host");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("blocked-ip");
    return url;
  }
  const resolved = await dns.lookup(host, { all: true });
  if (resolved.some((r) => isPrivateIp(r.address))) throw new Error("blocked-resolved-ip");
  return url;
}

export type RemoteJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

export async function fetchRemoteJson(
  rawUrl: string | null,
  opts: { maxBytes: number; logLabel: string }
): Promise<RemoteJsonResult> {
  const { maxBytes, logLabel } = opts;
  if (!rawUrl) return { ok: false, status: 400, error: "Missing url" };

  let current = rawUrl;
  let res: Response | null = null;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const url = await assertSafeUrl(current);
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json, */*" },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        if (hop === MAX_REDIRECTS) {
          return { ok: false, status: 502, error: "Too many redirects" };
        }
        current = new URL(location, url).toString();
        continue;
      }
      break;
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logProxyEvent(logLabel, { level: "warn", status: 502, reason });
    return { ok: false, status: 502, error: "Failed to fetch spec" };
  }

  if (!res || !res.ok) {
    return { ok: false, status: res?.status ?? 502, error: "Upstream error" };
  }

  const reader = res.body?.getReader();
  if (!reader) return { ok: false, status: 502, error: "Empty response body" };
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Spec too large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 502, error: "Failed to read spec" };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8").decode(bytes);
    return { ok: true, data: JSON.parse(text) };
  } catch {
    // YAML specs (or non-JSON responses) are not supported.
    return { ok: false, status: 415, error: "Spec is not valid JSON" };
  }
}
