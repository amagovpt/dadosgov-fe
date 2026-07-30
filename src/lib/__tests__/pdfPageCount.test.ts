import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted above imports, so the controllable mock fn must be
// created via vi.hoisted.
const { getDocumentProxyMock } = vi.hoisted(() => ({ getDocumentProxyMock: vi.fn() }));
vi.mock("unpdf", () => ({ getDocumentProxy: getDocumentProxyMock }));

// The cache is module-level state, so each test gets a fresh copy of the
// module via resetModules + dynamic import.
async function loadFetchPdfPageCount() {
  vi.resetModules();
  const mod = await import("../pdfPageCount");
  return mod.fetchPdfPageCount;
}

function pdfResponse(status = 200) {
  return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { status });
}

describe("fetchPdfPageCount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getDocumentProxyMock.mockReset();
    getDocumentProxyMock.mockResolvedValue({ numPages: 12 });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the page count and serves repeated calls from cache (one download/parse)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(pdfResponse()));
    vi.stubGlobal("fetch", fetchMock);
    const fetchPdfPageCount = await loadFetchPdfPageCount();

    const first = await fetchPdfPageCount("/cms/api/assets/report.pdf");
    const second = await fetchPdfPageCount("/cms/api/assets/report.pdf");

    expect(first).toBe(12);
    expect(second).toBe(12);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getDocumentProxyMock).toHaveBeenCalledTimes(1);
    // The PDF bytes must not enter the Next.js Data Cache (2 MB limit).
    expect(fetchMock).toHaveBeenCalledWith("/cms/api/assets/report.pdf", { cache: "no-store" });
  });

  it("caches per URL", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(pdfResponse()));
    vi.stubGlobal("fetch", fetchMock);
    const fetchPdfPageCount = await loadFetchPdfPageCount();

    await fetchPdfPageCount("/cms/api/assets/a.pdf");
    await fetchPdfPageCount("/cms/api/assets/b.pdf");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("expires entries after the 1h TTL to pick up replaced assets", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(pdfResponse()));
    vi.stubGlobal("fetch", fetchMock);
    getDocumentProxyMock
      .mockResolvedValueOnce({ numPages: 12 })
      .mockResolvedValueOnce({ numPages: 34 });
    const fetchPdfPageCount = await loadFetchPdfPageCount();

    const fresh = await fetchPdfPageCount("/cms/api/assets/report.pdf");
    vi.advanceTimersByTime(60 * 60 * 1000 + 1);
    const refreshed = await fetchPdfPageCount("/cms/api/assets/report.pdf");

    expect(fresh).toBe(12);
    expect(refreshed).toBe(34);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null on an HTTP error and does not cache it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(pdfResponse(404))
      .mockResolvedValueOnce(pdfResponse(200));
    vi.stubGlobal("fetch", fetchMock);
    const fetchPdfPageCount = await loadFetchPdfPageCount();

    const failed = await fetchPdfPageCount("/cms/api/assets/report.pdf");
    const recovered = await fetchPdfPageCount("/cms/api/assets/report.pdf");

    expect(failed).toBeNull();
    expect(recovered).toBe(12);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null on a network error and does not cache it", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(pdfResponse(200));
    vi.stubGlobal("fetch", fetchMock);
    const fetchPdfPageCount = await loadFetchPdfPageCount();

    const failed = await fetchPdfPageCount("/cms/api/assets/report.pdf");
    const recovered = await fetchPdfPageCount("/cms/api/assets/report.pdf");

    expect(failed).toBeNull();
    expect(recovered).toBe(12);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null when PDF parsing fails and does not cache it", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(pdfResponse()));
    vi.stubGlobal("fetch", fetchMock);
    getDocumentProxyMock
      .mockRejectedValueOnce(new Error("Invalid PDF structure"))
      .mockResolvedValueOnce({ numPages: 5 });
    const fetchPdfPageCount = await loadFetchPdfPageCount();

    const failed = await fetchPdfPageCount("/cms/api/assets/report.pdf");
    const recovered = await fetchPdfPageCount("/cms/api/assets/report.pdf");

    expect(failed).toBeNull();
    expect(recovered).toBe(5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
