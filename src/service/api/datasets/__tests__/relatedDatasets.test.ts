/**
 * The European funds datastories list every dataset matched by the program's searches. The
 * searches overlap, so the union must be deduplicated, the program's own organization comes
 * first, and one failed search must not empty the section.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/app/backend-fetch", () => ({ backendFetch }));

import { getRelatedDatasets } from "@/service/api/datasets/server";

const RECUPERAR_PORTUGAL = { id: "61140a0107819099529af103", name: "Recuperar Portugal" };
const ADC = { id: "600850ac454ae38cbce87116", name: "AD&C" };
const OTHER = { id: "other", name: "DGT" };

function dataset(id: string, lastUpdate: string, organization = RECUPERAR_PORTUGAL) {
  return {
    id,
    slug: `slug-${id}`,
    title: `Dataset ${id}`,
    description: "",
    last_update: lastUpdate,
    last_modified: lastUpdate,
    metrics: { views: 1 },
    quality: { score: 0.5 },
    organization: { ...organization, logo: "logo.png" },
    owner: null,
    badges: [{ kind: "spd" }],
  };
}

function ok(data: unknown[]) {
  return { ok: true, json: async () => ({ data, total: data.length }) };
}

// Responds by the query each URL carries, so the test does not depend on call order
function respond(routes: { q?: Record<string, unknown>; org?: unknown }) {
  backendFetch.mockImplementation(async (path: string) => {
    const params = new URLSearchParams(path.split("?")[1]);
    const response = params.has("organization") ? routes.org : routes.q?.[params.get("q")!];
    if (response instanceof Error) throw response;
    return response;
  });
}

function calledParams() {
  return backendFetch.mock.calls.map(
    ([path]) => new URLSearchParams(String(path).split("?")[1])
  );
}

describe("getRelatedDatasets", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    backendFetch.mockReset();
  });

  it("PRR: merges the searches without duplicates, own organization first", async () => {
    respond({
      q: {
        prr: ok([dataset("a", "2026-01-01"), dataset("dgt", "2026-09-01", OTHER)]),
        "plano de recuperação e resiliência": ok([dataset("dgt", "2026-09-01", OTHER)]),
      },
      org: ok([dataset("a", "2026-01-01"), dataset("c", "2026-03-01")]),
    });

    const result = await getRelatedDatasets("prr");

    // The DGT dataset is the newest, yet Recuperar Portugal's own datasets come first
    expect(result.map((d) => d.slug)).toEqual(["slug-c", "slug-a", "slug-dgt"]);
    expect(result[0]).toMatchObject({
      organizationName: "Recuperar Portugal",
      image: ["logo.png"],
      createdAt: "2026-03-01",
      quality: { score: 0.5 },
      badges: [{ kind: "spd" }],
    });
  });

  it("falls back to the owner of a dataset without an organization, as /datasets does", async () => {
    const owner = {
      id: "u1",
      slug: "ana-silva",
      first_name: "Ana",
      last_name: "Silva",
      avatar: null,
      avatar_thumbnail: "ana.png",
    };
    respond({
      q: {
        pt2030: ok([{ ...dataset("u", "2026-02-01"), organization: null, owner }]),
      },
    });

    const [result] = await getRelatedDatasets("pt2030");

    expect(result).toMatchObject({
      organizationName: "",
      image: [],
      owner: { slug: "ana-silva", first_name: "Ana", last_name: "Silva", avatar_thumbnail: "ana.png" },
    });
  });

  it("dates each dataset by its latest change, like the /datasets cards", async () => {
    respond({
      q: {
        pt2030: ok([
          { ...dataset("x", "2026-01-01"), last_modified: "2026-04-01", created_at: "2025-01-01" },
        ]),
      },
    });

    const [result] = await getRelatedDatasets("pt2030");

    expect(result.createdAt).toBe("2026-04-01");
  });

  it("PRR: keeps the other searches' datasets when one fails", async () => {
    respond({
      q: {
        prr: ok([dataset("a", "2026-01-01")]),
        "plano de recuperação e resiliência": { ok: false, status: 502 },
      },
      org: new Error("ECONNREFUSED"),
    });

    const result = await getRelatedDatasets("prr");

    expect(result.map((d) => d.slug)).toEqual(["slug-a"]);
    // Each failure stays visible in the console for diagnosis
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("PT2030: searches the text only, AD&C datasets first", async () => {
    respond({
      q: {
        pt2030: ok([dataset("ops", "2026-05-15", ADC), dataset("reg", "2026-08-15", ADC)]),
        "portugal 2030": ok([dataset("apa", "2026-10-01", OTHER)]),
      },
    });

    const result = await getRelatedDatasets("pt2030");

    // Listing AD&C by organization would bring in Portugal 2020
    expect(calledParams().map((p) => p.get("q"))).toEqual(["pt2030", "portugal 2030"]);
    expect(calledParams().some((p) => p.has("organization"))).toBe(false);
    expect(result.map((d) => d.slug)).toEqual(["slug-reg", "slug-ops", "slug-apa"]);
  });
});
