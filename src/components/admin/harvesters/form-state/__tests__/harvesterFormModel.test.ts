/**
 * `buildHarvesterCreatePayload` falls back to `backend: "dcat"` when the form
 * carries no type. That fallback is only safe while the wizard cannot reach the
 * submit with an empty type — which is what `requireBackend` enforces.
 *
 * LEDG-2297 made the gap reachable: when `GET /api/1/harvest/backends/` fails,
 * `fetchHarvestBackends` swallows it into an empty list and the "Tipo" select is
 * replaced by a warning, so the user cannot pick anything. Without the check
 * below, "Seguinte" would validate and silently create a DCAT harvester against
 * whatever URL was typed.
 */

import { describe, expect, it } from "vitest";

import {
  buildHarvesterCreatePayload,
  validateHarvesterDetails,
} from "../harvesterFormModel";

const wizardValues = {
  producer: "org-dgt",
  name: "Catálogo DGT",
  url: "https://exemplo.pt/catalogo",
  requireOrganizationProducer: true,
  requireBackend: true,
  messages: {
    harvesterProducer: "produtor",
    harvesterName: "nome",
    harvesterUrl: "url",
    harvesterType: "tipo",
  },
};

describe("validateHarvesterDetails — creation wizard", () => {
  it("refuses a submission with no harvester type", () => {
    const errors = validateHarvesterDetails({ ...wizardValues, backend: "" });

    expect(errors.harvesterType).toBe("tipo");
    // The other fields are filled in, so the type is the only thing blocking.
    expect(Object.keys(errors)).toEqual(["harvesterType"]);
  });

  it("accepts a submission once a type is chosen", () => {
    const errors = validateHarvesterDetails({ ...wizardValues, backend: "ckanpt" });

    expect(errors).toEqual({});
  });

  it("treats a whitespace-only type as no type at all", () => {
    const errors = validateHarvesterDetails({ ...wizardValues, backend: "   " });

    expect(errors.harvesterType).toBe("tipo");
  });
});

describe("validateHarvesterDetails — edit screen", () => {
  it("does not demand a type, which the saved source already has", () => {
    // The edit screen calls this without `requireBackend`, and falls back to the
    // stored backend in buildHarvesterUpdatePayload.
    const errors = validateHarvesterDetails({
      name: "Catálogo DGT",
      url: "https://exemplo.pt/catalogo",
      messages: { harvesterName: "nome", harvesterUrl: "url" },
    });

    expect(errors).toEqual({});
  });
});

describe("buildHarvesterCreatePayload", () => {
  it("still defaults to dcat, which is why the validation above must hold", () => {
    const payload = buildHarvesterCreatePayload({
      name: "Catálogo",
      description: "",
      url: "https://exemplo.pt/catalogo",
      producer: "org-dgt",
      backend: "",
      active: true,
      autoarchive: true,
      filters: [],
    });

    expect(payload.backend).toBe("dcat");
  });

  it("submits the chosen backend untouched", () => {
    const payload = buildHarvesterCreatePayload({
      name: "Catálogo",
      description: "",
      url: "https://exemplo.pt/catalogo",
      producer: "org-dgt",
      backend: "apambiente",
      active: true,
      autoarchive: true,
      filters: [],
    });

    expect(payload.backend).toBe("apambiente");
  });
});

/**
 * LEDG-2311: the creation payload used to put the filters at the top level of
 * the POST body. `HarvestSourceForm` declares no top-level `filters` field, so
 * WTForms discarded them without a word and every harvester created through the
 * wizard was created unfiltered — the update and preview payloads had it right
 * all along.
 */
describe("buildHarvesterCreatePayload — filters", () => {
  const base = {
    name: "Catálogo",
    description: "",
    url: "https://exemplo.pt/catalogo",
    producer: "org-dgt",
    backend: "ckan",
    active: true,
    autoarchive: true,
  };

  it("nests the filters under config, where the API reads them", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      filters: [{ mode: "include", type: "tags", value: "ambiente" }],
    });

    expect(payload.config).toEqual({
      filters: [{ key: "tags", value: "ambiente", type: "include" }],
    });
    // The shape the backend silently ignored.
    expect(payload).not.toHaveProperty("filters");
  });

  it("carries the exclude mode through as the filter type", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      filters: [{ mode: "exclude", type: "organization", value: "dgt" }],
    });

    expect(payload.config).toEqual({
      filters: [{ key: "organization", value: "dgt", type: "exclude" }],
    });
  });

  it("sends no config when the only filter has no value", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      // A filter row the user added and left empty: `mapFilters` drops it, so
      // keying the payload off the raw list would post an empty `config`.
      filters: [{ mode: "include", type: "tags", value: "  " }],
    });

    expect(payload).not.toHaveProperty("config");
  });

  it("sends no config when there are no filters at all", () => {
    const payload = buildHarvesterCreatePayload({ ...base, filters: [] });

    expect(payload).not.toHaveProperty("config");
  });
});
