/**
 * LEDG-2326: a failed suggestion request rendered the same "Nenhum resultado
 * encontrado" as a search that ran and matched nothing, so the user concluded
 * the catalogue had nothing when the search had never been answered. A failing
 * group now renders its own error message plus a retry action, and the
 * no-results and minimum-characters states are unchanged.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptCommon from "@/locales/pt/common.json";

const translate = (key: string): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      ptCommon
    );
  return typeof raw === "string" ? raw : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
}));

import { AdvancedFiltersSidebar, type AdvancedFilterGroup } from "../AdvancedFiltersSidebar";

const ERROR_TEXT = translate("search.error");
const RETRY_TEXT = translate("search.retry");
const NO_RESULTS_TEXT = translate("search.noResults");
const MIN_CHARS_TEXT = translate("search.minCharsMessage");

function makeGroup(overrides: Partial<AdvancedFilterGroup> = {}): AdvancedFilterGroup {
  return {
    name: "Palavras-chave",
    param: "tag",
    data: [],
    searchable: true,
    suggest: true,
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

function render(group: AdvancedFilterGroup, searchQuery: string, onSearchChange = vi.fn()) {
  act(() => {
    root.render(
      <AdvancedFiltersSidebar
        groups={[group]}
        searchQueries={{ [group.name]: searchQuery }}
        getActiveValues={() => []}
        onToggleValue={vi.fn()}
        onSearchChange={onSearchChange}
        checkboxIdPrefix="test"
      />
    );
  });
  return onSearchChange;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

describe("AdvancedFiltersSidebar suggest states", () => {
  it("shows the error message and hides the no-results one when the request failed", () => {
    render(makeGroup({ hasError: true }), "pdf");
    const text = container.textContent ?? "";
    expect(text).toContain(ERROR_TEXT);
    expect(text).toContain(RETRY_TEXT);
    expect(text).not.toContain(NO_RESULTS_TEXT);
  });

  it("retrying re-runs the search for the same query", () => {
    const onSearchChange = render(makeGroup({ hasError: true }), "pdf");
    const retry = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === RETRY_TEXT
    );
    expect(retry).toBeDefined();
    act(() => {
      retry?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onSearchChange).toHaveBeenCalledWith("Palavras-chave", "pdf");
  });

  it("still says no results when the search ran and matched nothing", () => {
    render(makeGroup(), "zzzzzz");
    const text = container.textContent ?? "";
    expect(text).toContain(NO_RESULTS_TEXT);
    expect(text).not.toContain(ERROR_TEXT);
  });

  it("keeps the minimum-characters hint below the threshold, error or not", () => {
    render(makeGroup(), "p");
    expect(container.textContent ?? "").toContain(MIN_CHARS_TEXT);
  });

  it("honours an explicit errorMessage override", () => {
    render(makeGroup({ hasError: true, errorMessage: "Falhou a pesquisa de formatos" }), "pdf");
    const text = container.textContent ?? "";
    expect(text).toContain("Falhou a pesquisa de formatos");
    expect(text).not.toContain(ERROR_TEXT);
  });
});
