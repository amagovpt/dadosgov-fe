import { installServerApiErrorInterceptor } from "@/lib/server/apiErrorInterceptor";

/**
 * Server bootstrap hook (Next.js runs `register()` once at startup).
 *
 * Two jobs:
 *
 * 1) Installs the server half of the global API error policy — see
 *    `src/lib/server/apiErrorInterceptor.ts`. This is the only place every
 *    server-side backend call passes through, so it is where a failed SSR
 *    fetch stops being silently painted as an empty result set.
 *
 * 2) Disables HTTP keep-alive for server-side `fetch` calls to the backend.
 * The rewrite proxy uses a separate HTTP pool. Its upstream must advertise
 * connection closure correctly or support persistent HTTP connections.
 *
 * Why: when the upstream (particularly the Werkzeug dev server) closes an
 * idle socket, undici can reuse it before noticing it is gone, producing
 * ECONNRESET / "socket hang up". Closing connections after each response
 * avoids that stale-socket race for server-side fetch calls.
 *
 * `setGlobalDispatcher` writes to the global `Symbol.for('undici.globalDispatcher.1')`,
 * which Next.js's bundled undici reads from the same realm.
 */
export async function register() {
  // Only the Node.js server runtime proxies to the backend; skip Edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  installServerApiErrorInterceptor();

  const { setGlobalDispatcher, Agent } = await import("undici");
  setGlobalDispatcher(
    new Agent({
      // Disable pipelining and close idle connections almost immediately so a
      // half-closed upstream socket is never reused by server-side fetch.
      pipelining: 0,
      keepAliveTimeout: 1,
      keepAliveMaxTimeout: 1,
    })
  );
}
