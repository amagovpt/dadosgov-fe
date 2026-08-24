/**
 * LEDG-2311: both harvester screens decide which filter keys they offer — and
 * whether they show a filters block at all — from the backend metadata. The
 * derivation itself had no test: pointing it at the wrong backend, or dropping
 * the id predicate, would offer `organization` for an OGC harvester and still
 * leave every component test green.
 */

import { describe, expect, it } from "vitest";

import type { HarvestBackend } from "@/service/types/harvester";
import {
  localizeExtraConfigLabel,
  localizeFeatureLabel,
  localizeFilterLabel,
  seedFeatureValues,
  selectBackendExtraConfigs,
  selectBackendFeatures,
  selectBackendFilters,
} from "../harvesterBackendConfig";

function backend(
  id: string,
  filters: HarvestBackend["filters"],
  features: HarvestBackend["features"] = [],
  extraConfigs: HarvestBackend["extra_configs"] = [],
): HarvestBackend {
  return { id, label: id.toUpperCase(), filters, features, extra_configs: extraConfigs };
}

function feature(
  key: string,
  label: string,
  defaultValue = false,
): HarvestBackend["features"][number] {
  return { key, label, description: "", default: defaultValue };
}

function extraConfig(key: string, label: string): HarvestBackend["extra_configs"][number] {
  return { key, label, description: "", default: "" };
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
  // What csw-dcat and odspt declare: a feature each, and the extra config
  // csw-dcat inherits from BaseCswDcatBackend.
  backend(
    "csw-dcat",
    [],
    [feature("geodcatap", "GeoDCAT-AP")],
    [extraConfig("remote_url_prefix", "Prefixo de URL remoto")],
  ),
  backend("odspt", [filter("Etiqueta", "tags")], [feature("inspire", "Harvest Inspire datasets")]),
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

describe("selectBackendFeatures / selectBackendExtraConfigs", () => {
  it("returns what the backend asked for declares, and nothing for the others", () => {
    expect(selectBackendFeatures(CATALOGUE, "csw-dcat").map((f) => f.key)).toEqual(["geodcatap"]);
    // Hidden from the wizard until now: the switch was gated on
    // `selectedType === "csw-dcat"`, so this feature had no UI at all.
    expect(selectBackendFeatures(CATALOGUE, "odspt").map((f) => f.key)).toEqual(["inspire"]);
    expect(selectBackendFeatures(CATALOGUE, "ckan")).toEqual([]);
    expect(selectBackendExtraConfigs(CATALOGUE, "csw-dcat").map((c) => c.key)).toEqual([
      "remote_url_prefix",
    ]);
    expect(selectBackendExtraConfigs(CATALOGUE, "odspt")).toEqual([]);
  });

  it("returns nothing while no type is chosen or the catalogue is unread", () => {
    expect(selectBackendFeatures(CATALOGUE, "")).toEqual([]);
    expect(selectBackendFeatures([], "csw-dcat")).toEqual([]);
    expect(selectBackendExtraConfigs(CATALOGUE, "unknown")).toEqual([]);
  });
});

describe("seedFeatureValues", () => {
  it("starts each feature from the default the backend declares", () => {
    // `has_feature` falls back to the same default server-side, so this only
    // makes the form agree with what the harvest would do untouched.
    expect(
      seedFeatureValues([feature("geodcatap", "GeoDCAT-AP"), feature("other", "Other", true)]),
    ).toEqual({ geodcatap: false, other: true });
  });

  it("seeds nothing for a backend that declares no features", () => {
    expect(seedFeatureValues([])).toEqual({});
  });
});

describe("localizeFeatureLabel / localizeExtraConfigLabel", () => {
  const translate = (subkey: string) => `traduzido:${subkey}`;

  it("looks the translation up by key, like the filter labels", () => {
    expect(localizeFeatureLabel(feature("geodcatap", "GeoDCAT-AP"), translate)).toBe(
      "traduzido:geodcatap",
    );
    // Upstream has no pt translation for this one (`msgstr ""`), so the API
    // answers the English label — which is exactly why we translate by key.
    expect(localizeFeatureLabel(feature("inspire", "Harvest Inspire datasets"), translate)).toBe(
      "traduzido:inspire",
    );
    expect(
      localizeExtraConfigLabel(extraConfig("remote_url_prefix", "Prefixo"), translate),
    ).toBe("traduzido:remote_url_prefix");
  });

  it("falls back to the API label for a key we carry no translation for", () => {
    expect(localizeFeatureLabel(feature("brandNew", "Algo Novo"), translate)).toBe("Algo Novo");
    expect(localizeExtraConfigLabel(extraConfig("brandNew", "Algo Novo"), translate)).toBe(
      "Algo Novo",
    );
  });
});
