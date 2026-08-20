import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ApiPageError,
  NETWORK_FAILURE,
  ROLLBACK_COOLDOWN_MS,
  apiFailureDigest,
  apiFailureFromDigest,
  isRefusal,
  isWatchedApiUrl,
  resolveApiErrorAction,
  shouldRollbackNavigation,
  urlOf,
} from "../apiErrorPolicy";

const BACKEND = "http://backend.internal:7000";

describe("isWatchedApiUrl", () => {
  let originalBackendUrl: string | undefined;

  beforeEach(() => {
    originalBackendUrl = process.env.BACKEND_URL;
    process.env.BACKEND_URL = BACKEND;
  });

  afterEach(() => {
    if (originalBackendUrl === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = originalBackendUrl;
  });

  it("watches the relative API paths the browser uses", () => {
    expect(isWatchedApiUrl("/api/1/datasets/")).toBe(true);
    expect(isWatchedApiUrl("/api/2/datasets/")).toBe(true);
    expect(isWatchedApiUrl("/internal-api/csv")).toBe(true);
    expect(isWatchedApiUrl("/auth/change-email")).toBe(true);
  });

  it("watches the absolute backend URLs Server Components use", () => {
    expect(isWatchedApiUrl(`${BACKEND}/api/1/datasets/`)).toBe(true);
  });

  it("ignores the Squidex CMS, which degrades on purpose", () => {
    expect(isWatchedApiUrl("https://cms.example.com/api/content/dadosgov/graphql")).toBe(false);
  });

  it("ignores non-API paths on our own origin", () => {
    expect(isWatchedApiUrl("/pt/datasets")).toBe(false);
    expect(isWatchedApiUrl("/_next/static/chunk.js")).toBe(false);
  });

  // Without this exclusion every anonymous visitor gets the 401 error page:
  // src/app/auth/me/route.ts answers 401 to anyone without a session cookie.
  it("excludes /auth/me and the session lifecycle routes", () => {
    expect(isWatchedApiUrl("/auth/me")).toBe(false);
    expect(isWatchedApiUrl("/auth/login")).toBe(false);
    expect(isWatchedApiUrl("/auth/logout")).toBe(false);
    expect(isWatchedApiUrl("/auth/csrf")).toBe(false);
  });

  it("still watches the authenticated backend endpoints", () => {
    expect(isWatchedApiUrl("/api/1/me/")).toBe(true);
    expect(isWatchedApiUrl("/api/1/me/datasets/")).toBe(true);
  });

  it("survives malformed input", () => {
    expect(isWatchedApiUrl("")).toBe(false);
    expect(isWatchedApiUrl("not a url")).toBe(false);
  });
});

describe("resolveApiErrorAction", () => {
  // Opening a page that needs a session without one is a page failure: the
  // error page names it and offers the login link. Mid-session, in the browser,
  // the visitor still has a page worth keeping, so they are moved instead.
  it("turns a server-side 401 into a page error and a client-side 401 into a login redirect", () => {
    expect(resolveApiErrorAction(401, "server")).toBe("page-error");
    expect(resolveApiErrorAction(401, "client")).toBe("redirect-login");
  });

  // The asymmetry is the point: during SSR there is no page to keep the user
  // on, so a 5xx becomes the error page instead of an empty result set.
  it("turns a server-side 5xx into a page error and a client-side 5xx into a toast", () => {
    expect(resolveApiErrorAction(500, "server")).toBe("page-error");
    expect(resolveApiErrorAction(503, "server")).toBe("page-error");
    expect(resolveApiErrorAction(500, "client")).toBe("toast");
  });

  it("treats a transport failure like a 5xx", () => {
    expect(resolveApiErrorAction(NETWORK_FAILURE, "server")).toBe("page-error");
    expect(resolveApiErrorAction(NETWORK_FAILURE, "client")).toBe("toast");
  });

  // Signing in cannot fix a 403, so the server side says "you lack the
  // permission" rather than offering the login link a 401 gets. The client side
  // stays out of it: a 403 there answers a form, whose own catch reports the
  // backend's message, and a stale CSRF token is a 403 too.
  it("turns a server-side 403 into a page error and leaves a client-side 403 alone", () => {
    expect(resolveApiErrorAction(403, "server")).toBe("page-error");
    expect(resolveApiErrorAction(403, "client")).toBe("ignore");
  });

  // A rejected request leaves an SSR render with nothing to show, so it gets
  // the same failure page as a 5xx rather than an empty result set. In the
  // browser it stays the call site's business — a 400 there answers a form.
  it("turns a server-side 400 or 406 into a page error and leaves the client side alone", () => {
    for (const status of [400, 406]) {
      expect(resolveApiErrorAction(status, "server")).toBe("page-error");
      expect(resolveApiErrorAction(status, "client")).toBe("ignore");
    }
  });

  it("leaves the other 4xx to the call site, which already reports them inline", () => {
    for (const status of [404, 409, 422, 429]) {
      expect(resolveApiErrorAction(status, "client")).toBe("ignore");
      expect(resolveApiErrorAction(status, "server")).toBe("ignore");
    }
  });
});

describe("isRefusal", () => {
  // What the boundary opts out of rollback on, and what the error page draws a
  // lock for. A refusal has a way on to offer; going back would hide it.
  it("is the two statuses that mean access was refused", () => {
    expect(isRefusal(401)).toBe(true);
    expect(isRefusal(403)).toBe(true);
  });

  it("is not a failure, a missing page, or an absent status", () => {
    for (const status of [400, 404, 429, 500, 503, NETWORK_FAILURE] as const) {
      expect(isRefusal(status)).toBe(false);
    }
    expect(isRefusal(null)).toBe(false);
    expect(isRefusal(undefined)).toBe(false);
  });
});

describe("urlOf", () => {
  it("reads every fetch input shape", () => {
    expect(urlOf("/api/1/datasets/")).toBe("/api/1/datasets/");
    expect(urlOf(new URL("http://example.com/api/1/"))).toBe("http://example.com/api/1/");
    expect(urlOf(new Request("http://example.com/api/1/"))).toBe("http://example.com/api/1/");
  });
});

describe("shouldRollbackNavigation", () => {
  const NOW = 1_700_000_000_000;

  it("does not roll back the first page of the session", () => {
    // A direct URL or a refresh: there is no earlier page to return to, so the
    // error page is the only honest answer.
    expect(
      shouldRollbackNavigation({ softNavigations: 0, lastRollbackAt: null, now: NOW })
    ).toBe(false);
  });

  it("rolls back a navigation made from a page the visitor already had", () => {
    expect(
      shouldRollbackNavigation({ softNavigations: 1, lastRollbackAt: null, now: NOW })
    ).toBe(true);
  });

  it("stops instead of bouncing when the page it went back to also failed", () => {
    expect(
      shouldRollbackNavigation({
        softNavigations: 2,
        lastRollbackAt: NOW - (ROLLBACK_COOLDOWN_MS - 1),
        now: NOW,
      })
    ).toBe(false);
  });

  it("rolls back again once the cooldown has passed", () => {
    expect(
      shouldRollbackNavigation({
        softNavigations: 2,
        lastRollbackAt: NOW - ROLLBACK_COOLDOWN_MS,
        now: NOW,
      })
    ).toBe(true);
  });
});

describe("ApiPageError", () => {
  it("carries the status and URL for the boundary logs", () => {
    const error = new ApiPageError(503, "/api/1/datasets/");
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(503);
    expect(error.url).toBe("/api/1/datasets/");
  });

  // The status has to reach `error.tsx`, and the digest is the only field of
  // the error React carries there — see the class comment.
  it("stamps the digest the boundary reads the status back from", () => {
    expect(new ApiPageError(503, "/api/1/datasets/").digest).toBe(apiFailureDigest(503));
    expect(new ApiPageError(NETWORK_FAILURE, "/api/1/datasets/").digest).toBe(
      apiFailureDigest(NETWORK_FAILURE)
    );
  });
});

describe("apiFailureFromDigest", () => {
  it("reads back every status the interceptor can raise", () => {
    for (const status of [401, 403, 500, 502, 503]) {
      expect(apiFailureFromDigest(apiFailureDigest(status))).toBe(status);
    }
    expect(apiFailureFromDigest(apiFailureDigest(NETWORK_FAILURE))).toBe(NETWORK_FAILURE);
  });

  it("does not claim a digest that is not ours", () => {
    // What Next stamps on any other error: a hash of the message and stack.
    expect(apiFailureFromDigest("1234567890")).toBeNull();
    expect(apiFailureFromDigest("NEXT_NOT_FOUND")).toBeNull();
    expect(apiFailureFromDigest(undefined)).toBeNull();
    expect(apiFailureFromDigest("")).toBeNull();
  });

  it("rejects a malformed status rather than reporting NaN", () => {
    expect(apiFailureFromDigest(`${apiFailureDigest(500)}extra`)).toBeNull();
    expect(apiFailureFromDigest("DADOSGOV_API:")).toBeNull();
  });
});
