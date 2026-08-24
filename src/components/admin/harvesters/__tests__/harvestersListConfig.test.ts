import { describe, expect, it } from "vitest";
import {
  filterHarvestersBySearch,
  filterHarvestersByStatus,
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
