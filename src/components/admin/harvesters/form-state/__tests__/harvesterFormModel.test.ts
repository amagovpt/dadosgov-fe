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
  buildHarvesterPreviewPayload,
  buildHarvesterUpdatePayload,
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
      features: {},
      extraConfigs: {},
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
      features: {},
      extraConfigs: {},
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
    features: {},
    extraConfigs: {},
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

  it("drops a row whose key was deselected instead of posting an empty key", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      // Clicking the already-selected option in the key select deselects it:
      // the design system reports an empty selection and the row keeps only its
      // value. Posting that gives `Unknown filter key ""` — a 400 on the step
      // 1 → 2 preview and on creation, where the old top-level `filters` shape
      // was silently discarded instead.
      filters: [{ mode: "include", type: "", value: "ambiente" }],
    });

    expect(payload).not.toHaveProperty("config");
  });

  it("keeps the filters whose key survived alongside a deselected one", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      filters: [
        { mode: "include", type: "", value: "ambiente" },
        { mode: "include", type: "organization", value: "dgt" },
      ],
    });

    expect(payload.config).toEqual({
      filters: [{ key: "organization", value: "dgt", type: "include" }],
    });
  });

  it("names the include mode when the mode select was deselected too", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      filters: [{ mode: "", type: "tags", value: "ambiente" }],
    });

    // The backends read anything but "exclude" as an include, so this was never
    // wrong on the wire — it just left the intent implicit.
    expect(payload.config).toEqual({
      filters: [{ key: "tags", value: "ambiente", type: "include" }],
    });
  });

  it("sends no config when there are no filters at all", () => {
    const payload = buildHarvesterCreatePayload({ ...base, filters: [] });

    expect(payload).not.toHaveProperty("config");
  });
});

/**
 * LEDG-2316: the GeoDCAT-AP switch and the "Remote URL prefix" field were
 * collected by the wizard and submitted by nothing. Both are real backend
 * config — `HarvestFeature("geodcatap", …)` and
 * `HarvestExtraConfig(…, "remote_url_prefix", …)` — read at harvest time from
 * `config.features[key]` and `config.extra_configs`.
 */
describe("buildHarvesterCreatePayload — features and extra configs", () => {
  const base = {
    name: "Catálogo",
    description: "",
    url: "https://exemplo.pt/catalogo",
    producer: "org-dgt",
    backend: "csw-dcat",
    active: true,
    autoarchive: true,
    filters: [],
    features: {},
    extraConfigs: {},
  };

  it("sends the features as a flag per key, where has_feature reads them", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      features: { geodcatap: true },
    });

    expect(payload.config).toEqual({ features: { geodcatap: true } });
    // The shape the API has no field for, and dropped in silence.
    expect(payload).not.toHaveProperty("features");
  });

  it("sends a feature switched off, so turning a default-on feature off sticks", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      features: { geodcatap: false },
    });

    // `has_feature` falls back to the declared default when the key is absent,
    // so omitting `false` would leave a default-on feature on.
    expect(payload.config).toEqual({ features: { geodcatap: false } });
  });

  it("sends the extra configs as the {key, value} list the API expects", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      extraConfigs: { remote_url_prefix: "https://exemplo.pt/dados/" },
    });

    expect(payload.config).toEqual({
      extra_configs: [{ key: "remote_url_prefix", value: "https://exemplo.pt/dados/" }],
    });
  });

  it("drops an extra config left empty, and trims the one that is set", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      extraConfigs: { remote_url_prefix: "   " },
    });
    expect(payload).not.toHaveProperty("config");

    const trimmed = buildHarvesterCreatePayload({
      ...base,
      extraConfigs: { remote_url_prefix: "  https://exemplo.pt/  " },
    });
    expect(trimmed.config).toEqual({
      extra_configs: [{ key: "remote_url_prefix", value: "https://exemplo.pt/" }],
    });
  });

  /**
   * The regression this ticket is most exposed to: `filters`, `features` and
   * `extra_configs` share one `config` object. Spreading `{ config: … }` once
   * per part would leave only the last, silently dropping the others — and the
   * filters are what LEDG-2311 had just fixed.
   */
  it("composes one config carrying filters, features and extra configs together", () => {
    const payload = buildHarvesterCreatePayload({
      ...base,
      filters: [{ mode: "include", type: "tags", value: "ambiente" }],
      features: { geodcatap: true },
      extraConfigs: { remote_url_prefix: "https://exemplo.pt/dados/" },
    });

    expect(payload.config).toEqual({
      filters: [{ key: "tags", value: "ambiente", type: "include" }],
      features: { geodcatap: true },
      extra_configs: [{ key: "remote_url_prefix", value: "https://exemplo.pt/dados/" }],
    });
  });

  it("sends no config at all when nothing was configured", () => {
    expect(buildHarvesterCreatePayload(base)).not.toHaveProperty("config");
  });
});

describe("buildHarvesterUpdatePayload and buildHarvesterPreviewPayload — config", () => {
  const base = {
    name: "Catálogo",
    description: "Uma descrição",
    url: "https://exemplo.pt/catalogo",
    backend: "csw-dcat",
    fallbackBackend: "csw-dcat",
    active: true,
    autoarchive: true,
    filters: [],
    activeFilterKeys: ["tags"],
    features: {},
    extraConfigs: {},
  };

  it("carries features and extra configs through the update payload", () => {
    const payload = buildHarvesterUpdatePayload({
      ...base,
      filters: [{ mode: "include", type: "tags", value: "ambiente" }],
      features: { geodcatap: true },
      extraConfigs: { remote_url_prefix: "https://exemplo.pt/dados/" },
    });

    // The API replaces the whole `config` on update, so anything missing here
    // is erased from the harvester.
    expect(payload.config).toEqual({
      filters: [{ key: "tags", value: "ambiente", type: "include" }],
      features: { geodcatap: true },
      extra_configs: [{ key: "remote_url_prefix", value: "https://exemplo.pt/dados/" }],
    });
  });

  it("carries them through the preview payload, so the preview tests them", () => {
    const payload = buildHarvesterPreviewPayload({
      ...base,
      fallbackName: "Catálogo",
      fallbackUrl: "https://exemplo.pt/catalogo",
      schedule: "",
      features: { geodcatap: true },
    });

    expect(payload.config).toEqual({ features: { geodcatap: true } });
  });
});
