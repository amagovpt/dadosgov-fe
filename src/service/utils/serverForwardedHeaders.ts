import { cookies, headers } from "next/headers";

/**
 * Build the `X-Forwarded-*` headers an SSR (Server Component) fetch must relay
 * to the backend so Flask's `ProxyFix` recovers the real client IP.
 *
 * On the server, `API_BASE_URL` points DIRECTLY at the backend
 * (`${BACKEND_URL}/api/1`), bypassing the F5/WAF → nginx chain. The backend
 * therefore sees the Next.js server's IP, so the IP-keyed rate limiter
 * (`user_or_ip`) collapses every anonymous visitor into a single bucket and the
 * shared ceiling returns site-wide 429s. Relaying the real client IP — already
 * present on the incoming request's `x-forwarded-for` (set by the upstream
 * proxies before reaching Next) — gives each visitor their own bucket again.
 *
 * SERVER COMPONENTS ONLY: this reads the request `headers()` store from
 * `next/headers`, which is unavailable in client components. Pass the result
 * into the relevant fetch function (e.g. `fetchOrganization(slug, forwarded)`);
 * client-side callers simply omit it. Mirrors `forwardedHeaders(request)` in
 * `src/app/backend-fetch.ts`, the equivalent helper for route handlers.
 */
export async function serverForwardedHeaders(): Promise<Record<string, string>> {
  const store = await headers();
  const forwarded: Record<string, string> = {};

  const xff = store.get("x-forwarded-for");
  const realIp = store.get("x-real-ip");
  if (xff) {
    forwarded["X-Forwarded-For"] = xff;
  } else if (realIp) {
    forwarded["X-Forwarded-For"] = realIp;
  }

  const proto = store.get("x-forwarded-proto");
  if (proto) {
    forwarded["X-Forwarded-Proto"] = proto;
  }

  const host = store.get("x-forwarded-host") || store.get("host");
  if (host) {
    forwarded["X-Forwarded-Host"] = host;
  }

  return forwarded;
}

/**
 * Same as `serverForwardedHeaders()` but also relays the visitor's session
 * `Cookie` so an SSR fetch to the DIRECT backend (`API_BASE_URL`) is
 * authenticated as the user.
 *
 * On the server `API_BASE_URL` bypasses the Next.js proxy that normally
 * forwards cookies for client-side authenticated calls, so a Server Component
 * fetch would otherwise be anonymous — losing per-user `permissions` and the
 * visibility of private/unpublished (draft) entities to their owner. Rebuilding
 * the `Cookie` header from `next/headers` `cookies()` restores the session.
 *
 * SERVER COMPONENTS ONLY: reads the request `cookies()`/`headers()` stores from
 * `next/headers`, which also marks the route dynamic (correct for a per-user
 * page). Pass the result into a fetcher's `forwarded` param (e.g.
 * `fetchReuse(rid, forwarded)`); client-side callers simply omit it.
 */
export async function serverAuthHeaders(): Promise<Record<string, string>> {
  const forwarded = await serverForwardedHeaders();

  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (cookie) {
    forwarded["Cookie"] = cookie;
  }

  return forwarded;
}
