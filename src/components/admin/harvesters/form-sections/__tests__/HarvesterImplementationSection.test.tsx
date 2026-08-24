/**
 * LEDG-2297: the "Tipo" select of the creation wizard used to carry ten
 * `DropdownOption` literals, so the five backends the API also returns
 * (apambiente, ine, inehvd, dgt, dgtIne) could not be picked when creating a
 * harvester even though the edit screen offered them.
 *
 * The section now renders whatever the caller passes it. These tests render it
 * with a catalogue that no literal could have anticipated, which is what pins
 * the field to the API instead of to the component.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptHarvesters from "@/locales/pt/admin-harvesters.json";
import type { HarvestBackend } from "@/service/types/harvester";

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

import HarvesterImplementationSection from "../HarvesterImplementationSection";

function backend(id: string, label: string): HarvestBackend {
  return { id, label, filters: [], features: [], extra_configs: [] };
}

/** What GET /api/1/harvest/backends/ answers on this deployment. */
const CATALOGUE: HarvestBackend[] = [
  backend("ckan", "CKAN"),
  backend("dcat", "DCAT"),
  backend("dgt", "Harvester DGT"),
  backend("apambiente", "Harvester Portal do Ambiente"),
  backend("ine", "Instituto nacional de estatística"),
];

let container: HTMLDivElement;
let root: Root;

async function renderSection(props: Partial<React.ComponentProps<typeof HarvesterImplementationSection>> = {}) {
  await act(async () => {
    root.render(
      <HarvesterImplementationSection
        backends={CATALOGUE}
        typeNoResultsText={ptHarvesters.form.noResults}
        hasNoBackend={false}
        hasTypeError={false}
        selectedTypeRef={{ current: "" }}
        selectedType=""
        filters={[]}
        isGeoDcat={false}
        showRemoteUrlPrefix={false}
        remoteUrlPrefix=""
        isEnabled
        isAutoArchive
        onTypeChange={() => {}}
        onAddFilter={() => {}}
        onRemoveFilter={() => {}}
        onUpdateFilter={() => {}}
        onToggleGeoDcat={() => {}}
        onShowRemoteUrlPrefix={() => {}}
        onRemoteUrlPrefixChange={() => {}}
        onClearRemoteUrlPrefix={() => {}}
        onToggleEnabled={() => {}}
        onToggleAutoArchive={() => {}}
        {...props}
      />,
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe("HarvesterImplementationSection — campo Tipo", () => {
  it("offers exactly the backends it was given, labelled as the API labels them", async () => {
    await renderSection();

    const text = container.textContent ?? "";
    for (const { label } of CATALOGUE) {
      expect(text).toContain(label);
    }
    // The hardcoded list this replaced had none of these three.
    expect(text).toContain("Harvester DGT");
    expect(text).toContain("Harvester Portal do Ambiente");
    expect(text).toContain("Instituto nacional de estatística");
  });

  it("offers nothing the API did not return", async () => {
    await renderSection({ backends: [backend("dcat", "DCAT")] });

    const text = container.textContent ?? "";
    expect(text).toContain("DCAT");
    // A type disabled in this environment must not be selectable: the backend
    // validates `backend` against get_enabled_backends() and would reject it.
    expect(text).not.toContain("OpenDataSoft PT");
    expect(text).not.toContain("DKAN");
  });

  it("warns instead of showing an empty select when the catalogue cannot be read", async () => {
    await renderSection({ backends: [], hasNoBackend: true });

    expect(container.textContent).toContain(ptHarvesters.form.typesUnavailable);
    expect(container.querySelector("#harvester-type")).toBeNull();
  });

  it("marks the current type as selected so a step back does not blank the control", async () => {
    await renderSection({ selectedType: "dgt" });

    // The wizard remounts this subtree when the user returns from the preview
    // step: without `selected`, IsolatedSelect reseeds to "" and the field
    // shows the placeholder while selectedTypeRef still submits "dgt".
    const selected = container.querySelector('[aria-selected="true"], [data-selected="true"]');
    expect(selected?.textContent).toContain("Harvester DGT");
  });

  it("flags the field when the wizard rejects a submission with no type", async () => {
    await renderSection({ hasTypeError: true });

    expect(container.textContent).toContain(ptHarvesters.form.validationErrors.type);
    expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });

  it("keeps the CKAN-only filter controls keyed on the selected backend id", async () => {
    await renderSection({ selectedType: "ckan" });
    expect(container.textContent).toContain(ptHarvesters.form.addFilter);

    // dgt is one of the five types this change restored; it declares no
    // filters of its own, so the CKAN block must stay hidden for it.
    await renderSection({ selectedType: "dgt" });
    expect(container.textContent).not.toContain(ptHarvesters.form.addFilter);
  });
});
