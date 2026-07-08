import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A tiny chunk size keeps the tests fast: a 10-byte file becomes 3 parts.
vi.mock("@/config/site", () => ({
  uiConfig: { resourceFileUploadChunk: 4 },
}));

import { chunkedUploadFetch } from "../API";

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}

describe("chunkedUploadFetch transient-network retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a dropped connection and then succeeds (single-shot upload)", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["ab"], "small.csv"); // size 2 <= chunk 4 → single request
    const promise = chunkedUploadFetch("/api/1/upload/", file);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never retries a deterministic HTTP error response (e.g. 415 rejection)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(415, { message: "rejected" }));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["ab"], "small.csv");
    const res = await chunkedUploadFetch("/api/1/upload/", file);

    expect(res.status).toBe(415);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting retries and rethrows the network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["ab"], "small.csv");
    const promise = chunkedUploadFetch("/api/1/upload/", file);
    // Attach the rejection assertion before advancing timers so the awaited
    // backoff delays resolve without surfacing an unhandled rejection.
    const assertion = expect(promise).rejects.toThrow("Failed to fetch");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4); // initial attempt + 3 retries
  });

  it("retries a mid-stream chunk without aborting the whole chunked upload", async () => {
    // size 10, chunk 4 → 3 parts + 1 combine. Part 2 drops once then succeeds.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200)) // part 0
      .mockResolvedValueOnce(jsonResponse(200)) // part 1
      .mockRejectedValueOnce(new TypeError("Failed to fetch")) // part 2, attempt 1
      .mockResolvedValueOnce(jsonResponse(200)) // part 2, attempt 2
      .mockResolvedValueOnce(jsonResponse(200, { success: true })); // combine
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["0123456789"], "big.csv"); // size 10
    const promise = chunkedUploadFetch("/api/1/upload/", file);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
