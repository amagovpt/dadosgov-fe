/**
 * LEDG-2311: both harvester screens decide which filter keys they offer — and
 * whether they show a filters block at all — from the backend metadata. The
 * derivation itself had no test: pointing it at the wrong backend, or dropping
 * the id predicate, would offer `organization` for an OGC harvester and still
 * leave every component test green.
 */

import { describe, expect, it } from "vitest";

import type { HarvestBackend } from "@/service/types/harvester";
import { localizeFilterLabel, selectBackendFilters } from "../harvesterFilterLabels";

function backend(id: string, filters: HarvestBackend["filters"]): HarvestBackend {
  return { id, label: id.toUpperCase(), filters, features: [], extra_configs: [] };
}

function filter(label: string, key: string): HarvestBackend["filters"][number] {
  return { label, key, type: "string", description: "" };
}

// The labels are the Portuguese ones `/api/1` actually answers with, since it
// marshals them through `get_locale()` and falls back to `DEFAULT_LANGUAGE`.
const CATALOGUE = [
  backend("ckan", [filter("Organização", "organization"), filter("Etiqueta", "tags")]),
  backend("ogc", [filter("Etiqueta", "tags")]),
  backend("dcat", []),
];

describe("selectBackendFilters", () => {
  it("returns the filters of the backend asked for, not of another one", () => {
    expect(selectBackendFilters(CATALOGUE, "ogc").map((f) => f.key)).toEqual(["tags"]);
    expect(selectBackendFilters(CATALOGUE, "ckan").map((f) => f.key)).toEqual([
      "organization",
      "tags",
    ]);
  });

  it("returns nothing for a backend that declares no filters", () => {
    // Which is what hides the filters block: dcat accepts none, so offering
    // them would only produce `Unknown filter key` on submission.
    expect(selectBackendFilters(CATALOGUE, "dcat")).toEqual([]);
  });

  it("returns nothing while no type is chosen or the catalogue is unread", () => {
    expect(selectBackendFilters(CATALOGUE, "")).toEqual([]);
    expect(selectBackendFilters(CATALOGUE, "unknown")).toEqual([]);
    expect(selectBackendFilters([], "ckan")).toEqual([]);
  });
});

describe("localizeFilterLabel", () => {
  const translate = (subkey: string) => `traduzido:${subkey}`;

  it("looks the translation up by key, ignoring the label the API sent", () => {
    // `tag` was the key the wizard used to emit; `tags` is what the backends
    // declare. Looking up by label would key this on "Etiqueta" and miss.
    expect(localizeFilterLabel(filter("Etiqueta", "tags"), translate)).toBe("traduzido:tags");
    expect(localizeFilterLabel(filter("Editor", "publisher"), translate)).toBe(
      "traduzido:publisher",
    );
  });

  it("falls back to the API label for a key we carry no translation for", () => {
    expect(localizeFilterLabel(filter("Algo Novo", "somethingNew"), translate)).toBe("Algo Novo");
  });
});
