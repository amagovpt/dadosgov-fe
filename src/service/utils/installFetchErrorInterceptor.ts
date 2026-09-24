import {
  NETWORK_FAILURE,
  isWatchedApiUrl,
  skipsGlobalErrorHandling,
  urlOf,
  type ApiFailure,
} from "./apiErrorPolicy";

/**
 * Wraps a scope's `fetch` so every failed backend call is reported once, from
 * the only point every call passes through.
 *
 * Both halves of the app need this and neither could see the other's failures:
 * Server Components fetch `${BACKEND_URL}/api/1/...` during render, the browser
 * fetches the relative `/api/1/...` through the Next proxy. They differ only in
 * what they do about a failure — throw the render away versus raise a toast —
 * so that is the single thing they pass in. Everything else (which URLs count,
 * how a transport failure is told apart from a status, what a cancelled request
 * means) lives here, once.
 *
 * What it deliberately does NOT do: read the response body. Only
 * `response.status` is inspected, so streaming responses and the chunked upload
 * proxy pass through untouched, and the response reaches the caller unread.
 */

export interface FetchInterceptorOptions {
  /** `globalThis` on the server, `window` in the browser. */
  scope: { fetch: typeof globalThis.fetch };
  /**
   * What this side does about a failure. May throw — on the server that is how
   * the render is handed to the error boundary — and the throw reaches the
   * caller of `fetch` in place of the response.
   */
  onFailure: (status: ApiFailure, url: string) => void | Promise<void>;
}

/** Install the wrapper. Returns the function that puts the original back. */
export function installFetchErrorInterceptor({
  scope,
  onFailure,
}: FetchInterceptorOptions): () => void {
  const originalFetch = scope.fetch;

  scope.fetch = async function patchedFetch(input, init) {
    let url = "";
    let watched = false;
    try {
      url = urlOf(input);
      watched = !skipsGlobalErrorHandling(init) && isWatchedApiUrl(url);
    } catch {
      // Classification must never be the reason a request does not go out.
      watched = false;
    }

    if (!watched) return originalFetch(input, init);

    let response: Response;
    try {
      response = await originalFetch(input, init);
    } catch (error) {
      // A cancelled request is not a failure — `AbortController` is how
      // components drop stale requests on unmount.
      if (!isAbortError(error)) await onFailure(NETWORK_FAILURE, url);
      throw error;
    }

    if (!response.ok) await onFailure(response.status, url);
    return response;
  };

  return () => {
    scope.fetch = originalFetch;
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
