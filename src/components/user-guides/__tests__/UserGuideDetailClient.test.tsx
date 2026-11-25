/**
 * Guide detail task tabs: the task named by the URL hash is the one shown (deep link / refresh),
 * the hash is not overwritten by the first tab on load, and the page hydrated from server HTML
 * still shows the tasks when it is opened directly below 1280px.
 */

import React, { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserGuide, UserGuideTask } from "@/service/types/user-guides";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({ default: () => <nav /> }));

import { UserGuideDetailClient } from "../UserGuideDetailClient";

const task = (id: string, title: string): UserGuideTask => ({
  id,
  title,
  audience: "",
  objective: `Objetivo de ${title}`,
  steps: [],
  example: "",
  videoUrl: "",
  video: [],
  mediaCaption: "",
  tip: "",
});

const guide: UserGuide = {
  id: "apis-e-servicos-de-dados",
  title: "APIs e serviços de dados",
  cardDescription: "",
  description: "",
  requirementNote: "",
  status: "available",
  statusNotice: "",
  pdf: [],
  tasks: [
    task("escolher-a-api-adequada", "Escolher a API adequada"),
    task("consultar-uma-api-do-catalogo", "Consultar uma API do catálogo"),
    task("consultar-a-referencia-da-api-do-portal", "Consultar a referência da API do portal"),
  ],
  relatedGuides: [],
  usefulResources: [],
  updatedAt: "",
};

const PATH = "/pt/recursos/como-usar-o-portal/guias-do-utilizador/apis-e-servicos-de-dados";

let container: HTMLDivElement;
let root: Root | undefined;

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}

/** Renders the server HTML at the server's 1920px default, then hydrates it at `width`. */
function openAt(width: number, hash = "") {
  setWidth(1920);
  container.innerHTML = renderToString(<UserGuideDetailClient guide={guide} />);
  window.history.replaceState(null, "", `${PATH}${hash}`);
  setWidth(width);
  act(() => {
    root = hydrateRoot(container, <UserGuideDetailClient guide={guide} />, {
      onRecoverableError: () => {},
    });
  });
}

const desktopPanel = () => container.querySelector(".agora-tabs.desktop [role=tabpanel]");
const mobileTabs = () => container.querySelector<HTMLElement>(".agora-tabs.mobile");
const desktopTabs = () => container.querySelector<HTMLElement>(".agora-tabs.desktop");

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container.remove();
  setWidth(1024);
  vi.restoreAllMocks();
});

describe("UserGuideDetailClient tasks", () => {
  it("shows the first task when the URL has no hash", () => {
    openAt(1440);

    expect(desktopPanel()?.textContent).toContain("Objetivo de Escolher a API adequada");
  });

  it("opens the task named by the hash and keeps the hash", () => {
    openAt(1440, "#consultar-uma-api-do-catalogo");

    expect(desktopPanel()?.textContent).toContain("Objetivo de Consultar uma API do catálogo");
    expect(window.location.hash).toBe("#consultar-uma-api-do-catalogo");
  });

  it("follows an in-page link to another task", () => {
    openAt(1440);

    act(() => {
      window.history.replaceState(null, "", `${PATH}#consultar-a-referencia-da-api-do-portal`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(desktopPanel()?.textContent).toContain("Objetivo de Consultar a referência");
  });

  it("writes the selected task to the hash", () => {
    openAt(1440);

    const tabs = container.querySelectorAll<HTMLButtonElement>(".agora-tabs.desktop [role=tab]");
    act(() => tabs[1].click());

    expect(window.location.hash).toBe("#consultar-uma-api-do-catalogo");
  });

  it.each([1024, 768, 375])("shows the tasks when opened directly at %ipx", (width) => {
    openAt(width, "#consultar-uma-api-do-catalogo");

    expect(mobileTabs()?.hidden).toBe(false);
    expect(desktopTabs()?.hidden).toBe(true);
    expect(mobileTabs()?.textContent).toContain("Objetivo de Consultar uma API do catálogo");
    expect(window.location.hash).toBe("#consultar-uma-api-do-catalogo");
  });
});
