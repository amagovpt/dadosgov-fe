import { describe, expect, it } from "vitest";
import {
  filterHarvestersBySearch,
  filterHarvestersByStatus,
  sortHarvesters,
  type HarvesterSortField,
} from "../config/harvestersListConfig";
import type { HarvestSource } from "@/service/types/harvester";

function makeHarvester(partial: Partial<HarvestSource> = {}): HarvestSource {
  return {
    id: "h-1",
    name: "Geodados Municipais",
    description: null,
    url: "https://example.pt/geodados",
    backend: "dcat",
    organization: null,
    schedule: null,
    config: {},
    filters: [],
    features: {},
    active: true,
    autoarchive: false,
    validation: null,
    created_at: "2026-01-01T00:00:00Z",
    last_modified: "2026-01-01T00:00:00Z",
    last_job: null,
    ...partial,
  } as HarvestSource;
}

const geodados = makeHarvester();
const ine = makeHarvester({ id: "h-2", name: "INE - Instituto Nacional" });
const ambiente = makeHarvester({ id: "h-3", name: "Portal do Ambiente" });
const all = [geodados, ine, ambiente];

describe("filterHarvestersBySearch", () => {
  it("returns every harvester when the query is empty or whitespace", () => {
    expect(filterHarvestersBySearch(all, "")).toEqual(all);
    expect(filterHarvestersBySearch(all, "   ")).toEqual(all);
  });

  it("matches a substring of the name, not only whole words", () => {
    expect(filterHarvestersBySearch(all, "geo")).toEqual([geodados]);
    expect(filterHarvestersBySearch(all, "dados mun")).toEqual([geodados]);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(filterHarvestersBySearch(all, "  INSTITUTO ")).toEqual([ine]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterHarvestersBySearch(all, "inexistente")).toEqual([]);
  });
});

describe("filterHarvestersByStatus combined with search", () => {
  const acceptedGeo = makeHarvester({
    id: "h-4",
    name: "Geodados Regionais",
    validation: { state: "accepted" } as HarvestSource["validation"],
  });
  const pendingGeo = makeHarvester({
    id: "h-5",
    name: "Geodados Nacionais",
    validation: { state: "pending" } as HarvestSource["validation"],
  });
  const catalogue = [acceptedGeo, pendingGeo, ine];

  it("narrows the search result by status", () => {
    const searched = filterHarvestersBySearch(catalogue, "geodados");
    expect(filterHarvestersByStatus(searched, "accepted")).toEqual([acceptedGeo]);
  });

  it("is order-independent", () => {
    const byStatusFirst = filterHarvestersBySearch(
      filterHarvestersByStatus(catalogue, "accepted"),
      "geodados"
    );
    const bySearchFirst = filterHarvestersByStatus(
      filterHarvestersBySearch(catalogue, "geodados"),
      "accepted"
    );
    expect(byStatusFirst).toEqual(bySearchFirst);
  });
});

/**
 * LEDG-2294: the system view declared `sortField` on the status column only,
 * while the org view had it on four — the same table sorted differently
 * depending on the scope. Both views now declare the same six, which added
 * `implementation` and `datasets` to the shared comparator.
 */
describe("sortHarvesters", () => {
  const dcatOld = makeHarvester({
    id: "s-1",
    name: "Beta",
    backend: "dcat",
    created_at: "2026-01-01T00:00:00Z",
    datasets_count: 40,
  });
  const ckanMid = makeHarvester({
    id: "s-2",
    name: "Alfa",
    backend: "ckan",
    created_at: "2026-02-01T00:00:00Z",
    datasets_count: 5,
  });
  const odsNew = makeHarvester({
    id: "s-3",
    name: "Gama",
    backend: "ods",
    created_at: "2026-03-01T00:00:00Z",
    datasets_count: 12,
  });
  const catalogue = [dcatOld, ckanMid, odsNew];
  const ids = (list: HarvestSource[]) => list.map((harvester) => harvester.id);

  const cases: { field: HarvesterSortField; ascending: string[] }[] = [
    { field: "name", ascending: ["s-2", "s-1", "s-3"] },
    { field: "created_at", ascending: ["s-1", "s-2", "s-3"] },
    { field: "implementation", ascending: ["s-2", "s-1", "s-3"] },
    { field: "datasets", ascending: ["s-2", "s-3", "s-1"] },
  ];

  for (const { field, ascending } of cases) {
    it(`sorts by ${field} in both directions`, () => {
      expect(ids(sortHarvesters(catalogue, field, "ascending"))).toEqual(ascending);
      expect(ids(sortHarvesters(catalogue, field, "descending"))).toEqual([...ascending].reverse());
    });
  }

  it("leaves the order untouched with no field or no direction", () => {
    expect(ids(sortHarvesters(catalogue, null, "ascending"))).toEqual(ids(catalogue));
    expect(ids(sortHarvesters(catalogue, "name", "none"))).toEqual(ids(catalogue));
  });

  it("treats a missing dataset count as zero rather than dropping the row", () => {
    const noCount = makeHarvester({ id: "s-4", datasets_count: undefined });
    expect(ids(sortHarvesters([dcatOld, noCount], "datasets", "ascending"))).toEqual([
      "s-4",
      "s-1",
    ]);
  });

  it("orders the last run by the timestamp the cell now shows", () => {
    const started = makeHarvester({
      id: "s-5",
      last_job: { started: "2026-05-02T00:00:00Z" } as HarvestSource["last_job"],
    });
    const earlier = makeHarvester({
      id: "s-6",
      last_job: { started: "2026-05-01T00:00:00Z" } as HarvestSource["last_job"],
    });
    const never = makeHarvester({ id: "s-7", last_job: null });
    // A job that was created but never started still orders by `created`, which is
    // what the cell shows too.
    const createdOnly = makeHarvester({
      id: "s-8",
      last_job: { created: "2026-04-30T00:00:00Z" } as HarvestSource["last_job"],
    });
    expect(
      ids(sortHarvesters([started, never, earlier, createdOnly], "last_job", "ascending"))
    ).toEqual(["s-7", "s-8", "s-6", "s-5"]);
  });
});
