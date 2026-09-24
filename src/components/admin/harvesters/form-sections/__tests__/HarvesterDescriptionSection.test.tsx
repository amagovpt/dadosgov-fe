/**
 * LEDG-2319: the edit screen marked the harvester description as required with an
 * asterisk while nothing validated it, the creation screen did not, and the
 * backend has always called it optional details about the harvester. The label is
 * now the same on both screens, and says nothing about being required.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import enHarvesters from "@/locales/en/admin-harvesters.json";
import ptCommon from "@/locales/pt/admin-common.json";
import ptHarvesters from "@/locales/pt/admin-harvesters.json";

const bundles: Record<string, unknown> = {
  "admin-harvesters": ptHarvesters,
  "admin-common": ptCommon,
};

const translate = (key: string): string => {
  const [namespace, path] = key.includes(":") ? key.split(":") : ["admin-harvesters", key];
  const raw = path
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      bundles[namespace],
    );
  return typeof raw === "string" ? raw : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate, i18n: { language: "pt" } }),
}));

import HarvesterDescriptionSection from "../HarvesterDescriptionSection";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render() {
  act(() => {
    root.render(
      <HarvesterDescriptionSection
        harvesterName="Dados Abertos Lisboa"
        harvesterDescription="Harvester dos dados abertos do municipio."
        harvesterUrl="http://dados.cm-lisboa.pt/"
        hasHarvesterNameError={false}
        hasHarvesterUrlError={false}
        onHarvesterNameChange={() => {}}
        onHarvesterDescriptionChange={() => {}}
        onHarvesterUrlChange={() => {}}
      />,
    );
  });
}

describe("HarvesterDescriptionSection", () => {
  it("labels the description without a required marker", () => {
    render();

    const label = container.querySelector('label[for="harvester-description"]');
    expect(label?.textContent).toBe(ptHarvesters.fields.description);
    expect(label?.textContent).not.toContain("*");
  });

  it("still marks name and url as required", () => {
    render();

    expect(container.querySelector('label[for="harvester-url"]')?.textContent).toContain("*");
    expect(container.querySelector("#harvester-name")?.hasAttribute("required")).toBe(true);
  });

  /**
   * The asterisk never came from this component: the edit screen overrode the
   * label with a second `fields.*` key that carried one. This is what pins the
   * fix - the rendering assertions above hold either way, since the override was
   * the caller's.
   */
  it.each([
    ["pt", ptHarvesters],
    ["en", enHarvesters],
  ])("has no required-marked description label left in %s", (_locale, bundle) => {
    const fields: Record<string, string> = bundle.fields;

    expect(Object.keys(fields)).not.toContain("descriptionRequired");
    expect(fields.description).not.toContain("*");
  });
});
