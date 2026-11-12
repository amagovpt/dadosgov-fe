/**
 * Guides index search: the term filters the themes from `?q=`, a term without matches shows the
 * shared `FoNoResults` card, and the search bar writes the term to the URL while typing and drops
 * it when the input is emptied.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptUserGuides from "@/locales/pt/user-guides.json";
import type { UserGuideTheme } from "@/service/types/user-guides";

const translate = (key: string, options?: Record<string, unknown>): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      ptUserGuides
    );
  const text = typeof raw === "string" ? raw : key;
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? ""));
};

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: translate }) }));

const searchParams = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
  useParams: () => ({ locale: "pt" }),
  usePathname: () => "/pt/recursos/como-usar-o-portal/guias-do-utilizador",
}));

// jsdom has no IntersectionObserver; the scroll-spy is not under test here.
vi.mock("@/components/Shared/SiteMap/SimpleSiteMap", () => ({
  default: ({ title }: { title?: string }) => <nav>{title}</nav>,
}));

import { UserGuidesIndexClient } from "../UserGuidesIndexClient";
import { UserGuidesSearchBar } from "../UserGuidesSearchBar";

const themes: UserGuideTheme[] = [
  {
    id: "encontrar",
    title: "Encontrar, consultar e explorar dados",
    description: "Pesquise Conjuntos de Dados.",
    guides: [
      {
        id: "encontrar-e-consultar-dados",
        title: "Encontrar e consultar dados",
        cardDescription: "Refine a pesquisa.",
      },
    ],
  },
];

let container: HTMLDivElement;
let root: Root;

function render(element: React.ReactElement) {
  act(() => root.render(element));
}

/** Types into a controlled React input the way the browser does. */
function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeEach(() => {
  searchParams.current = new URLSearchParams();
  window.history.replaceState(null, "", "/pt/recursos/como-usar-o-portal/guias-do-utilizador");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("UserGuidesIndexClient", () => {
  it("lists every theme without a search term", () => {
    render(<UserGuidesIndexClient themes={themes} />);

    expect(container.querySelector("section#encontrar")).not.toBeNull();
    expect(container.textContent).toContain("Encontrar e consultar dados");
  });

  it("shows the shared no-results card when nothing matches", () => {
    searchParams.current = new URLSearchParams("q=harvester");
    render(<UserGuidesIndexClient themes={themes} />);

    expect(container.querySelector("section#encontrar")).toBeNull();
    expect(container.textContent).toContain('Não encontrámos guias para "harvester"');
    expect(container.textContent).toContain(ptUserGuides.noResults.subtitle);
  });
});

describe("UserGuidesSearchBar", () => {
  function renderBar() {
    render(<UserGuidesSearchBar label="Pesquisar" placeholder="Pesquisar" searchActionAltText="Pesquisar" />);
    const input = container.querySelector<HTMLInputElement>("input#user-guides-search");
    if (!input) throw new Error("search input not rendered");
    return input;
  }

  it("writes the term to the URL while typing, without waiting for Enter", () => {
    vi.useFakeTimers();
    const replaceState = vi.spyOn(window.history, "replaceState");
    const input = renderBar();

    typeInto(input, "dados");
    expect(replaceState).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(250));

    expect(replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/pt/recursos/como-usar-o-portal/guias-do-utilizador?q=dados"
    );
  });

  it("drops the term from the URL when the input is emptied", () => {
    vi.useFakeTimers();
    searchParams.current = new URLSearchParams("q=dados");
    window.history.replaceState(null, "", "/pt/recursos/como-usar-o-portal/guias-do-utilizador?q=dados");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const input = renderBar();

    expect(input.value).toBe("dados");
    typeInto(input, "");
    act(() => vi.advanceTimersByTime(250));

    expect(replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/pt/recursos/como-usar-o-portal/guias-do-utilizador"
    );
  });

  it("does not offer voice search yet", () => {
    renderBar();

    expect(container.querySelectorAll("button")).toHaveLength(1);
  });
});
