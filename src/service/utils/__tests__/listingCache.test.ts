import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The cache is module-level state, so each test gets a fresh copy of the
// module via resetModules + dynamic import.
async function loadCachedListingFetch() {
  vi.resetModules();
  const mod = await import("../listingCache");
  return mod.cachedListingFetch;
}

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}

describe("cachedListingFetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("serves repeated loads of the same URL from cache (one upstream fetch)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { total: 42 }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    const first = await cachedListingFetch<{ total: number }>("/api/1/site/datasets-listing/");
    const second = await cachedListingFetch<{ total: number }>("/api/1/site/datasets-listing/");

    expect(first).toEqual({ total: 42 });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares the entry across visitors: different forwarded headers, same URL, one fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { total: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    await cachedListingFetch("/listing", { "X-Forwarded-For": "1.1.1.1" });
    await cachedListingFetch("/listing", { "X-Forwarded-For": "2.2.2.2" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // The miss relayed the first visitor's headers upstream. Nothing opts out of
    // the global error policy: a listing failure belongs to the error boundary.
    expect(fetchMock).toHaveBeenCalledWith("/listing", {
      cache: "no-store",
      headers: { "X-Forwarded-For": "1.1.1.1" },
    });
  });

  it("keys by URL: different query strings fetch separately", async () => {
    // A fresh Response per call — a Response body can only be read once.
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, {})));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    await cachedListingFetch("/listing?page=1");
    await cachedListingFetch("/listing?page=2");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent misses for the same URL into one in-flight fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { total: 7 }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    const [a, b] = await Promise.all([
      cachedListingFetch("/listing"),
      cachedListingFetch("/listing"),
    ]);

    expect(a).toEqual({ total: 7 });
    expect(b).toEqual(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("expires entries after the 60s TTL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { total: 1 }))
      .mockResolvedValueOnce(jsonResponse(200, { total: 2 }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    const fresh = await cachedListingFetch<{ total: number }>("/listing");
    vi.advanceTimersByTime(61_000);
    const stale = await cachedListingFetch<{ total: number }>("/listing");

    expect(fresh).toEqual({ total: 1 });
    expect(stale).toEqual({ total: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on a non-2xx the policy ignores, instead of parsing the body as JSON", async () => {
    // A 429 from the public search limiter: `resolveApiErrorAction` returns
    // "ignore" for it, so the interceptor lets it through and this is what
    // turns it into a failure the error boundary can take.
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("rate limited", { status: 429, statusText: "Too Many" }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    await expect(cachedListingFetch("/listing")).rejects.toThrow(/429 Too Many/);
  });

  it("does not cache HTTP errors: the next request retries upstream", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429, statusText: "Too Many" }))
      .mockResolvedValueOnce(jsonResponse(200, { total: 3 }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    await expect(cachedListingFetch("/listing")).rejects.toThrow();
    const recovered = await cachedListingFetch<{ total: number }>("/listing");

    expect(recovered).toEqual({ total: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache network errors: rethrows and the next request retries", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(200, { total: 4 }));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    await expect(cachedListingFetch("/listing")).rejects.toThrow("fetch failed");
    const recovered = await cachedListingFetch<{ total: number }>("/listing");

    expect(recovered).toEqual({ total: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caps the cache size, evicting the oldest entries first", async () => {
    // A fresh Response per call — a Response body can only be read once.
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, {})));
    vi.stubGlobal("fetch", fetchMock);
    const cachedListingFetch = await loadCachedListingFetch();

    for (let i = 0; i < 100; i++) {
      await cachedListingFetch(`/listing?page=${i}`);
    }
    expect(fetchMock).toHaveBeenCalledTimes(100);

    // Adding one more evicts the oldest (page=0), which then re-fetches;
    // a recent entry (page=99) is still served from cache.
    await cachedListingFetch("/listing?page=100");
    await cachedListingFetch("/listing?page=99");
    expect(fetchMock).toHaveBeenCalledTimes(101);
    await cachedListingFetch("/listing?page=0");
    expect(fetchMock).toHaveBeenCalledTimes(102);
  });
});
