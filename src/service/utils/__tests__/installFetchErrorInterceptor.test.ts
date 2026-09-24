// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NETWORK_FAILURE, SKIP_GLOBAL_ERROR_HANDLING } from "../apiErrorPolicy";
import { installFetchErrorInterceptor } from "../installFetchErrorInterceptor";

const BACKEND = "http://backend.internal:7000";

/** A scope object standing in for `globalThis` / `window`. */
function makeScope(fetchImpl: typeof globalThis.fetch) {
  return { fetch: fetchImpl } as { fetch: typeof globalThis.fetch };
}

const ok = () => Promise.resolve(new Response(null, { status: 200 }));
const failing = (status: number) => () => Promise.resolve(new Response(null, { status }));

describe("installFetchErrorInterceptor", () => {
  let originalBackendUrl: string | undefined;

  beforeEach(() => {
    originalBackendUrl = process.env.BACKEND_URL;
    process.env.BACKEND_URL = BACKEND;
  });

  afterEach(() => {
    if (originalBackendUrl === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = originalBackendUrl;
  });

  it("reports a failed response on a watched URL", async () => {
    const onFailure = vi.fn();
    const scope = makeScope(failing(503));
    installFetchErrorInterceptor({ scope, onFailure });

    await scope.fetch("/api/1/datasets/");

    expect(onFailure).toHaveBeenCalledWith(503, "/api/1/datasets/");
  });

  it("stays out of the way for a successful response", async () => {
    const onFailure = vi.fn();
    const scope = makeScope(ok);
    installFetchErrorInterceptor({ scope, onFailure });

    const response = await scope.fetch("/api/1/datasets/");

    expect(response.status).toBe(200);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("ignores URLs the policy does not watch", async () => {
    const onFailure = vi.fn();
    const scope = makeScope(failing(503));
    installFetchErrorInterceptor({ scope, onFailure });

    await scope.fetch("https://cms.example.com/api/content/graphql");
    await scope.fetch("/_next/static/chunk.js");

    expect(onFailure).not.toHaveBeenCalled();
  });

  // The route handlers under src/app/auth/* proxy the backend and must forward
  // its status verbatim; backendFetch stamps every call with this.
  it("honours the per-call opt-out", async () => {
    const onFailure = vi.fn();
    const scope = makeScope(failing(500));
    installFetchErrorInterceptor({ scope, onFailure });

    await scope.fetch(`${BACKEND}/api/1/me/`, {
      [SKIP_GLOBAL_ERROR_HANDLING]: true,
    } as RequestInit);

    expect(onFailure).not.toHaveBeenCalled();
  });

  it("reports a transport failure as NETWORK_FAILURE and still throws", async () => {
    const onFailure = vi.fn();
    const boom = new TypeError("fetch failed");
    const scope = makeScope(() => Promise.reject(boom));
    installFetchErrorInterceptor({ scope, onFailure });

    await expect(scope.fetch("/api/1/datasets/")).rejects.toThrow(boom);
    expect(onFailure).toHaveBeenCalledWith(NETWORK_FAILURE, "/api/1/datasets/");
  });

  // AbortController is how components drop stale requests on unmount.
  it("does not report a cancelled request", async () => {
    const onFailure = vi.fn();
    const aborted = new DOMException("The operation was aborted.", "AbortError");
    const scope = makeScope(() => Promise.reject(aborted));
    installFetchErrorInterceptor({ scope, onFailure });

    await expect(scope.fetch("/api/1/datasets/")).rejects.toThrow(aborted);
    expect(onFailure).not.toHaveBeenCalled();
  });

  // This is the server half's whole mechanism: the throw is what hands the
  // render to the error boundary.
  it("lets onFailure throw in place of the response", async () => {
    const boom = new Error("page error");
    const scope = makeScope(failing(503));
    installFetchErrorInterceptor({
      scope,
      onFailure: () => {
        throw boom;
      },
    });

    await expect(scope.fetch("/api/1/datasets/")).rejects.toThrow(boom);
  });

  it("survives a malformed input instead of breaking the request", async () => {
    const onFailure = vi.fn();
    const scope = makeScope(failing(503));
    installFetchErrorInterceptor({ scope, onFailure });

    await scope.fetch("not a url");

    expect(onFailure).not.toHaveBeenCalled();
  });

  it("puts the original fetch back on uninstall", async () => {
    const original = failing(503);
    const scope = makeScope(original);
    const onFailure = vi.fn();

    const uninstall = installFetchErrorInterceptor({ scope, onFailure });
    expect(scope.fetch).not.toBe(original);

    uninstall();
    expect(scope.fetch).toBe(original);

    await scope.fetch("/api/1/datasets/");
    expect(onFailure).not.toHaveBeenCalled();
  });
});
