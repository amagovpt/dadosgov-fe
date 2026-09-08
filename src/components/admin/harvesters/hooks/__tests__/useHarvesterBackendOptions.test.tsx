/**
 * LEDG-2297: the "Tipo" select of the harvester creation wizard listed ten
 * hardcoded options while the edit screen listed whatever
 * `GET /api/1/harvest/backends/` returned. Five enabled backends were therefore
 * impossible to pick when creating a source, and the labels of the ones that
 * were listed did not match the `display_name` the API declares.
 *
 * The hook exists to make the creation screen read the same endpoint, so these
 * tests pin the list to the API response rather than to any literal.
 */

import React, { useEffect } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptHarvesters from "@/locales/pt/admin-harvesters.json";

const translate = (key: string): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      ptHarvesters as unknown,
    );
  return typeof raw === "string" ? raw : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate, i18n: { language: "pt" } }),
}));

const fetchHarvestBackendsMock = vi.fn();
vi.mock("@/service/api/harvesters", () => ({
  fetchHarvestBackends: () => fetchHarvestBackendsMock(),
}));

import { useHarvesterBackendOptions } from "../useHarvesterBackendOptions";

type HookResult = ReturnType<typeof useHarvesterBackendOptions>;

function backend(id: string, label: string) {
  return { id, label, filters: [], features: [], extra_configs: [] };
}

let container: HTMLDivElement;
let root: Root;

// Published from an effect rather than during render, so the probe stays within
// what the React compiler allows.
const probe: { result: HookResult | null } = { result: null };
const latest = () => probe.result as HookResult;

function Probe() {
  const result = useHarvesterBackendOptions();
  useEffect(() => {
    probe.result = result;
  });
  return null;
}

async function render() {
  await act(async () => {
    root.render(<Probe />);
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  probe.result = null;
  fetchHarvestBackendsMock.mockReset();
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe("useHarvesterBackendOptions", () => {
  it("offers every backend the API returns, in the order it returns them", async () => {
    fetchHarvestBackendsMock.mockResolvedValue([
      backend("ckan", "CKAN"),
      backend("dgt", "Harvester DGT"),
      // Among the five the hardcoded list used to hide.
      backend("apambiente", "Harvester Portal do Ambiente"),
      backend("ine", "Instituto nacional de estatística"),
    ]);

    await render();

    expect(latest().backends.map((b) => b.id)).toEqual(["ckan", "dgt", "apambiente", "ine"]);
    // The label is the backend's `display_name`, not a name invented in the form.
    expect(latest().backends.map((b) => b.label)).toEqual([
      "CKAN",
      "Harvester DGT",
      "Harvester Portal do Ambiente",
      "Instituto nacional de estatística",
    ]);
    expect(latest().isLoading).toBe(false);
    expect(latest().hasNoBackend).toBe(false);
  });

  it("reads the list once, from the API, without seeding any local default", async () => {
    fetchHarvestBackendsMock.mockResolvedValue([backend("dcat", "DCAT")]);

    await render();

    expect(fetchHarvestBackendsMock).toHaveBeenCalledTimes(1);
    expect(latest().backends).toHaveLength(1);
  });

  it("tells the user the list is still loading before the answer arrives", async () => {
    let resolveBackends: (value: unknown) => void = () => {};
    fetchHarvestBackendsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveBackends = resolve;
      }),
    );

    await render();

    expect(latest().isLoading).toBe(true);
    expect(latest().noResultsText).toBe(ptHarvesters.form.typesLoading);
    // Nothing to offer yet, but that is not the same as "no backend exists".
    expect(latest().hasNoBackend).toBe(false);

    await act(async () => {
      resolveBackends([backend("dcat", "DCAT")]);
    });

    expect(latest().isLoading).toBe(false);
    expect(latest().noResultsText).toBe(ptHarvesters.form.noResults);
  });

  it("reports an empty catalogue instead of showing a silently empty select", async () => {
    // `fetchHarvestBackends` swallows a failed request into an empty list.
    fetchHarvestBackendsMock.mockResolvedValue([]);

    await render();

    expect(latest().hasNoBackend).toBe(true);
  });

  it("settles the select even if the request rejects outright", async () => {
    fetchHarvestBackendsMock.mockRejectedValue(new Error("network"));

    await render();

    expect(latest().isLoading).toBe(false);
    expect(latest().backends).toEqual([]);
    expect(latest().hasNoBackend).toBe(true);
  });
});
