import type { NextRequest } from "next/server";

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

  return headers;
}

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  if (BACKEND_HOST) {
    const headers = new Headers(init?.headers);
    if (!headers.has("Host")) {
      headers.set("Host", BACKEND_HOST);
    }
    return fetch(url, { ...init, headers });
  }
  return fetch(url, init);
}

export { BACKEND_URL };
