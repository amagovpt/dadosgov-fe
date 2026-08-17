import {
  ApiPageError,
  resolveApiErrorAction,
  type ApiFailure,
} from "@/service/utils/apiErrorPolicy";
import { installFetchErrorInterceptor } from "@/service/utils/installFetchErrorInterceptor";

/**
 * Server half of the global API error policy, installed once from
 * `src/instrumentation.ts`.
 *
 * Server Components fetch the backend directly during render, and every
 * failure used to be swallowed by the service layer into an empty result set —
 * a backend outage rendered as "no datasets found". Wrapping `globalThis.fetch`
 * catches those failures at the only point every SSR call passes through, with
 * no changes to the ~200 call sites.
 *
 * Which calls are watched and how a failure is detected is
 * `installFetchErrorInterceptor`'s job, shared with the browser half; all that
 * is left here is what the server does about one.
 */

const INSTALLED_FLAG = Symbol.for("dadosgov.serverApiErrorInterceptor");

type GlobalWithFlag = typeof globalThis & { [INSTALLED_FLAG]?: boolean };

export function installServerApiErrorInterceptor(): void {
  const scope = globalThis as GlobalWithFlag;
  // Dev HMR can call register() more than once; patching a patch would stack
  // interceptors and log every failure twice.
  if (scope[INSTALLED_FLAG]) return;
  scope[INSTALLED_FLAG] = true;

  installFetchErrorInterceptor({ scope: globalThis, onFailure: react });
}

/**
 * Unlike the browser half, this is meant to throw: the render has no data, and
 * the throw is what hands the request to the `error.tsx` boundary. Every
 * failure the policy does not ignore lands there, 401 included — the boundary
 * reads the status back off the error's digest and offers a login link for
 * that one, which is more honest than a redirect that never said why.
 */
function react(status: ApiFailure, url: string): void {
  const action = resolveApiErrorAction(status, "server");
  if (action === "ignore") return;

  console.error("[api-error]", { side: "server", status, url, action });

  throw new ApiPageError(status, url);
}
