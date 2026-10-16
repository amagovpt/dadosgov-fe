import { installServerApiErrorInterceptor } from "@/lib/server/apiErrorInterceptor";
import { checkBackendVersion } from "@/lib/server/checkBackendVersion";

/**
 * Server bootstrap hook (Next.js runs `register()` once at startup).
 *
 * Three jobs:
 *
 * 1) Installs the server half of the global API error policy — see
 *    `src/lib/server/apiErrorInterceptor.ts`. This is the only place every
 *    server-side backend call passes through, so it is where a failed SSR
 *    fetch stops being silently painted as an empty result set.
 *
 * 2) Checks that the backend answering this environment is new enough for
 *    this frontend -- see `src/lib/server/checkBackendVersion.ts`. Startup is
 *    the right moment: it is the one place the mismatch can be reported to
 *    whoever deployed, instead of surfacing later as a screen quietly showing
 *    less than it should.
 *
 * 3) Disables HTTP keep-alive on the outgoing connection pool that Next.js uses
 * to proxy `rewrites()` (and server-side `fetch`) to the backend.
 *
 * Why: Next.js proxies `/api/*` to the backend through undici, which pools and
 * reuses keep-alive connections. When the upstream (the Werkzeug dev server in
 * particular) closes an idle keep-alive socket, undici can reuse it a moment
 * before noticing it is gone, producing `ECONNRESET` / "socket hang up". On a
 * non-retryable POST (file upload) this surfaces in the browser as `500 {}`
 * while the backend logs a truncated `400`. Forcing connections to close right
 * after each response makes every proxied request use a fresh connection,
 * eliminating the stale-reuse race. The cost (no connection reuse to the
 * backend) is negligible and harmless in every environment.
 *
 * `setGlobalDispatcher` writes to the global `Symbol.for('undici.globalDispatcher.1')`,
 * which Next.js's bundled undici reads from the same realm, so the proxy picks it up.
 */
export async function register() {
  // Only the Node.js server runtime proxies to the backend; skip Edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  installServerApiErrorInterceptor();

  // Deliberately not awaited: a slow or unreachable backend must not hold up
  // the server coming online. It logs whatever it finds, whenever it finds it.
  void checkBackendVersion();

  const { setGlobalDispatcher, Agent } = await import("undici");
  setGlobalDispatcher(
    new Agent({
      // Disable pipelining and close idle connections almost immediately so a
      // half-closed upstream socket is never reused (no ECONNRESET on upload).
      pipelining: 0,
      keepAliveTimeout: 1,
      keepAliveMaxTimeout: 1,
    })
  );
}
