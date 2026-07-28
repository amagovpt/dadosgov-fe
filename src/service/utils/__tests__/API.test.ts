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

  it("sends totalfilesize on every part and on the combine request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["0123456789"], "big.csv"); // size 10, chunk 4 → 3 parts + combine
    await chunkedUploadFetch("/api/1/upload/", file);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, init] of fetchMock.mock.calls) {
      const body = init.body as FormData;
      expect(body.get("totalfilesize")).toBe("10");
    }
    // The combine request carries no file part.
    const combineBody = fetchMock.mock.calls[3][1].body as FormData;
    expect(combineBody.get("file")).toBeNull();
  });

  it("flags a retried combine rejected as already handled instead of surfacing the 400", async () => {
    // The combine response is lost (network error) and the replayed combine
    // finds the chunks already consumed: the first combine almost certainly
    // succeeded, so restarting silently could duplicate the resource.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200)) // part 0
      .mockResolvedValueOnce(jsonResponse(200)) // part 1
      .mockResolvedValueOnce(jsonResponse(200)) // part 2
      .mockRejectedValueOnce(new TypeError("Failed to fetch")) // combine, attempt 1
      .mockResolvedValueOnce(jsonResponse(400, { success: false, code: "upload-not-found" }));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["0123456789"], "big.csv");
    const promise = chunkedUploadFetch("/api/1/upload/", file);
    const assertion = expect(promise).rejects.toThrow("O envio pode já ter sido concluído");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("passes through a combine 400 that was not preceded by a network retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200)) // part 0
      .mockResolvedValueOnce(jsonResponse(200)) // part 1
      .mockResolvedValueOnce(jsonResponse(200)) // part 2
      .mockResolvedValueOnce(jsonResponse(400, { success: false, code: "upload-not-found" }));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["0123456789"], "big.csv");
    const res = await chunkedUploadFetch("/api/1/upload/", file);

    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("aborts retrying with a clear message when the source file changed on disk", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["0123456789"], "big.csv");
    const realSlice = File.prototype.slice.bind(file);
    // The 1-byte readability probe fails as it does when the underlying file
    // was modified after selection (ERR_UPLOAD_FILE_CHANGED); part slices keep
    // working so FormData construction is unaffected.
    vi.spyOn(file, "slice").mockImplementation((start?: number, end?: number) => {
      if (start === 0 && end === 1) {
        return {
          arrayBuffer: () => Promise.reject(new DOMException("changed", "NotReadableError")),
        } as unknown as Blob;
      }
      return realSlice(start, end);
    });

    const promise = chunkedUploadFetch("/api/1/upload/", file);
    const assertion = expect(promise).rejects.toThrow("O ficheiro foi alterado durante o envio");
    await vi.runAllTimersAsync();
    await assertion;

    // The first network failure aborts immediately — no blind retries.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
