import type { NextRequest } from "next/server";
import {
  SKIP_GLOBAL_ERROR_HANDLING,
  type FetchInitWithPolicy,
} from "@/service/utils/apiErrorPolicy";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:7000";
const BACKEND_HOST = process.env.BACKEND_HOST || "";

/**
 * Build the `X-Forwarded-*` headers a server-side route handler must relay to
 * the backend so Flask's `ProxyFix` recovers the real client context.
 *
 * Requests proxied through these route handlers reach the backend from the
 * Next.js server's IP (`127.0.0.1`). Without `X-Forwarded-For`, the IP-keyed
 * rate limiter collapses every user into one bucket and returns spurious 429s
 * (which the frontend reads as a logout). We relay the incoming `x-forwarded-for`
 * verbatim — it was already populated by the upstream proxies (F5/WAF → nginx)
 * before reaching Next, so the backend sees the same chain it sees on direct
 * requests and `PROXY_FIX_X_FOR` keeps working unchanged.
 */
export function forwardedHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};

  const xff = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  if (xff) {
    headers["X-Forwarded-For"] = xff;
  } else if (realIp) {
    headers["X-Forwarded-For"] = realIp;
  }

  const host = request.headers.get("host");
  if (host) {
    headers["X-Forwarded-Host"] = host;
  }

  const proto = request.headers.get("x-forwarded-proto");
  if (proto) {
    headers["X-Forwarded-Proto"] = proto;
  }

  // Flask-WTF's SSL-strict CSRF check (WTF_CSRF_SSL_STRICT, on by default)
  // rejects secure POSTs whose Referer doesn't match the public origin with
  // "400 The referrer header is missing". Server-side fetches send no Referer,
  // and forwarding `X-Forwarded-Proto: https` (needed by the rate limiter fix)
  // makes the backend treat them as secure — breaking POST /login/ behind the
  // F5/WAF. Rebuild the Referer from the forwarded proto + host so the check
  // passes; harmless on GETs and on plain-HTTP dev requests.
  if (proto && host) {
    headers["Referer"] = `${proto}://${host}/`;
  }

  return headers;
}

/**
 * These route handlers exist to proxy the backend, so they must forward its
 * status verbatim. `SKIP_GLOBAL_ERROR_HANDLING` keeps the server-side error
 * interceptor out of the way: without it, `/auth/me` calling
 * `${BACKEND_URL}/api/1/me/` would turn the expected 401 of a stale cookie
 * into a redirect, replacing the handler's JSON with an HTML login page.
 * The browser-side interceptor still sees whatever the handler returns.
 */
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  const base: FetchInitWithPolicy = { ...init, [SKIP_GLOBAL_ERROR_HANDLING]: true };
  if (BACKEND_HOST) {
    const headers = new Headers(init?.headers);
    if (!headers.has("Host")) {
      headers.set("Host", BACKEND_HOST);
    }
    return fetch(url, { ...base, headers });
  }
  return fetch(url, base);
}

export { BACKEND_URL };
