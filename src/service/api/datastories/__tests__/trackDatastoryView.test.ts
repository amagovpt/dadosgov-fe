import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackDatastoryView } from "@/service/api/datastories";

describe("trackDatastoryView", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("POSTs the visit and returns the metrics", async () => {
    const payload = { slug: "orcamento", metrics: { views: 12 } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(trackDatastoryView("orcamento")).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/1/datastories/orcamento/views/",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("keeps the slash of a nested slug and encodes each segment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await trackDatastoryView("ambiente/qualidade do ar");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/1/datastories/ambiente/qualidade%20do%20ar/views/"
    );
  });

  it("returns null when the backend rejects the slug", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));

    await expect(trackDatastoryView("bad slug")).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(trackDatastoryView("orcamento")).resolves.toBeNull();
  });
});
