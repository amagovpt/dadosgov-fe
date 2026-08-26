/**
 * LEDG-2326: the advanced-filter search boxes never queried the API.
 *
 * `AdvancedFiltersSidebar` handed `onSearchChange` the group's *translated
 * label* ("Palavras-chave"), while this component compared it against internal
 * ids ("tags", "format", "geozone"). Nothing ever matched, so no suggestion was
 * ever fetched and every search rendered "Nenhum resultado encontrado" — which
 * is what a user reported. Routing now goes by `param`.
 *
 * These tests drive the real sidebar, so they fail if either half regresses:
 * the routing (was the helper called at all?) or the error state (does a failed
 * request read as an error rather than as no matches?).
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptCommon from "@/locales/pt/common.json";
import ptDatasets from "@/locales/pt/datasets.json";

const bundles: Record<string, unknown> = { common: ptCommon, datasets: ptDatasets };

const translate = (namespace: string) => (key: string): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      bundles[namespace]
    );
  return typeof raw === "string" ? raw : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: (namespace: string) => ({
    t: translate(namespace),
    i18n: { language: "pt" },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/pt/datasets",
  useSearchParams: () => new URLSearchParams(),
}));

const suggestTags = vi.fn();
const suggestFormats = vi.fn();
const suggestSpatialZones = vi.fn();

vi.mock("@/service/api/search", () => ({
  suggestTags: (...a: unknown[]) => suggestTags(...a),
  suggestSpatialZones: (...a: unknown[]) => suggestSpatialZones(...a),
  getSpatialZones: () => Promise.resolve([]),
}));
vi.mock("@/service/api/datasets", () => ({
  suggestFormats: (...a: unknown[]) => suggestFormats(...a),
}));

import { DatasetsFilters } from "../DatasetsFilters";

const GROUPS = [
  { label: "Palavras-chave", query: "saude", helper: () => suggestTags },
  { label: "Formatos", query: "csv", helper: () => suggestFormats },
  { label: "Cobertura Espacial", query: "lisboa", helper: () => suggestSpatialZones },
];

const ERROR_TEXT = (ptCommon as { search: { error: string } }).search.error;
const NO_RESULTS_TEXT = (ptCommon as { search: { noResults: string } }).search.noResults;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount() {
  act(() => {
    root.render(<DatasetsFilters />);
  });
}

/** Type into the search box of the group whose label is given. */
async function typeInto(label: string, value: string) {
  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>("input"));
  // Each searchable group renders one search box, in declaration order:
  // organization, tag, format, license, frequency, geozone, granularity.
  const order = ["Organizações", "Palavras-chave", "Formatos", "Licenças", "Frequência", "Cobertura Espacial", "Granularidade Espacial"];
  const boxes = inputs.filter((i) => i.type !== "checkbox");
  const box = boxes[order.indexOf(label)];
  expect(box, `search box for ${label}`).toBeDefined();
  // React tracks the value on the node, so assigning `.value` directly is
  // invisible to it; the native setter is what makes onChange fire.
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  await act(async () => {
    setValue?.call(box, value);
    box.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Let the suggest promise settle and its state update flush.
  await act(async () => {
    await Promise.resolve();
  });
}

describe("DatasetsFilters advanced search routing", () => {
  it("queries the API for each group once at least two characters are typed", async () => {
    for (const g of GROUPS) g.helper().mockResolvedValue([]);
    mount();
    for (const g of GROUPS) {
      await typeInto(g.label, g.query);
      expect(g.helper(), `${g.label} must reach its suggest helper`).toHaveBeenCalledWith(g.query);
    }
  });

  it("does not query below the two-character threshold", async () => {
    for (const g of GROUPS) g.helper().mockResolvedValue([]);
    mount();
    await typeInto("Palavras-chave", "s");
    expect(suggestTags).not.toHaveBeenCalled();
  });

  it("shows the error state, not the no-results one, when a request fails", async () => {
    // `null` is what the service returns on failure.
    suggestTags.mockResolvedValue(null);
    suggestFormats.mockResolvedValue([]);
    suggestSpatialZones.mockResolvedValue([]);
    mount();
    await typeInto("Palavras-chave", "saude");
    const text = container.textContent ?? "";
    expect(text).toContain(ERROR_TEXT);
  });

  it("keeps the no-results message when the search ran and matched nothing", async () => {
    for (const g of GROUPS) g.helper().mockResolvedValue([]);
    mount();
    await typeInto("Palavras-chave", "zzzzzz");
    const text = container.textContent ?? "";
    expect(text).toContain(NO_RESULTS_TEXT);
    expect(text).not.toContain(ERROR_TEXT);
  });
});
