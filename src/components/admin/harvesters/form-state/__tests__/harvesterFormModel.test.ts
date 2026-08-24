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
