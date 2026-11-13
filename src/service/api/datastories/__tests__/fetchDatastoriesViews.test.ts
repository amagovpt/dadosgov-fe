import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchDatastoriesViews } from "@/service/api/datastories";

describe("fetchDatastoriesViews", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("asks for every slug in one request and maps the answer by slug", async () => {
    const payload = {
      data: [
        { slug: "orcamento", metrics: { views: 3 } },
        { slug: "ambiente/ar", metrics: { views: 0 } },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchDatastoriesViews(["orcamento", "ambiente/ar"])).resolves.toEqual({
      orcamento: 3,
      "ambiente/ar": 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0], "http://localhost");
    expect(url.pathname).toBe("/api/1/datastories/");
    expect(url.searchParams.get("slugs")).toBe("orcamento,ambiente/ar");
  });

  it("does not call the backend for an empty list", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchDatastoriesViews([])).resolves.toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the backend answers with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));

    await expect(fetchDatastoriesViews(["bad slug"])).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(fetchDatastoriesViews(["orcamento"])).resolves.toBeNull();
  });
});
