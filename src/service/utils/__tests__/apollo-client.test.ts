// @vitest-environment node
// The SWR behaviour under test only runs server-side (typeof window ===
// "undefined"), so this file must run in the node environment, not jsdom.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gql } from "@apollo/client";

const QUERY_PT = gql`
  query GetContent {
    pt
  }
`;
const QUERY_EN = gql`
  query GetContent {
    en
  }
`;

function graphqlResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// The client is a module-level singleton with internal state, so each test
// gets a fresh copy via resetModules + dynamic import.
async function loadClient() {
  vi.resetModules();
  const mod = await import("../apollo-client");
  return mod.default;
}

// Flush the microtask/IO queue so a background refresh settles.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("SwrApolloClient (server-side stale-while-revalidate)", () => {
  beforeEach(() => {
    // Fake only Date: the TTL logic reads Date.now(), but Apollo's internals
    // and AbortSignal.timeout need real timers to settle.
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("serves repeated queries from cache within the TTL (one CMS request)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(graphqlResponse({ pt: "olá" })));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    const first = await client.query<{ pt: string }>({ query: QUERY_PT });
    const second = await client.query<{ pt: string }>({ query: QUERY_PT });

    expect(first.data?.pt).toBe("olá");
    expect(second.data?.pt).toBe("olá");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("attaches an abort signal to server-side CMS requests (timeout wired)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(graphqlResponse({ pt: "olá" })));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    await client.query({ query: QUERY_PT });

    const init = fetchMock.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("past the TTL, serves the stale result immediately and refreshes in the background", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(graphqlResponse({ pt: "old" })))
      .mockImplementationOnce(() => Promise.resolve(graphqlResponse({ pt: "new" })));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    const fresh = await client.query<{ pt: string }>({ query: QUERY_PT });
    vi.advanceTimersByTime(301_000); // past the default 300s TTL

    const stale = await client.query<{ pt: string }>({ query: QUERY_PT });
    await flush(); // let the background refresh land
    const refreshed = await client.query<{ pt: string }>({ query: QUERY_PT });

    expect(fresh.data?.pt).toBe("old");
    expect(stale.data?.pt).toBe("old"); // served without waiting for the CMS
    expect(refreshed.data?.pt).toBe("new");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps serving the stale result when the background refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(graphqlResponse({ pt: "good" })))
      .mockImplementation(() => Promise.reject(new TypeError("fetch failed")));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    await client.query<{ pt: string }>({ query: QUERY_PT });
    vi.advanceTimersByTime(301_000);

    const stale = await client.query<{ pt: string }>({ query: QUERY_PT });
    await flush();
    const stillStale = await client.query<{ pt: string }>({ query: QUERY_PT });

    expect(stale.data?.pt).toBe("good");
    expect(stillStale.data?.pt).toBe("good");
  });

  it("rejects when there is no cached result and the CMS fails (caller fallback path)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.reject(new TypeError("fetch failed")));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    await expect(client.query({ query: QUERY_PT })).rejects.toThrow();
  });

  it("dedupes concurrent cold misses for the same query into one CMS request", async () => {
    let resolveFetch: (r: Response) => void;
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => (resolveFetch = resolve))
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    const [a, b] = [
      client.query<{ pt: string }>({ query: QUERY_PT }),
      client.query<{ pt: string }>({ query: QUERY_PT }),
    ];
    resolveFetch!(graphqlResponse({ pt: "olá" }));
    const [ra, rb] = await Promise.all([a, b]);

    expect(ra.data?.pt).toBe("olá");
    expect(rb.data?.pt).toBe("olá");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches per query text (locale-interpolated documents don't collide)", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(graphqlResponse({ pt: "olá" })))
      .mockImplementationOnce(() => Promise.resolve(graphqlResponse({ en: "hello" })));
    vi.stubGlobal("fetch", fetchMock);
    const client = await loadClient();

    const pt = await client.query<{ pt: string }>({ query: QUERY_PT });
    const en = await client.query<{ en: string }>({ query: QUERY_EN });

    expect(pt.data?.pt).toBe("olá");
    expect(en.data?.en).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
