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

type BackendFilter = HarvestBackend["filters"][number];

function filter(label: string, key: string): BackendFilter {
  return { label, key, type: "string", description: `A ${label.toLowerCase()} name` };
}

function backend(id: string, label: string, filters: BackendFilter[] = []): HarvestBackend {
  return { id, label, filters, features: [], extra_configs: [] };
}

/**
 * What the CKAN backends declare — note the key is `tags`, not `tag`
 * (`HarvestFilter(_("Tag"), "tags", …)`). The wizard used to emit `tag`, which
 * `HarvestConfigField` rejects, so the filter never reached the harvester.
 */
const CKAN_FILTERS = [filter("Organization", "organization"), filter("Tag", "tags")];

/** What GET /api/1/harvest/backends/ answers on this deployment. */
const CATALOGUE: HarvestBackend[] = [
  backend("ckan", "CKAN", CKAN_FILTERS),
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
        activeBackendFilters={[]}
        typeNoResultsText={ptHarvesters.form.noResults}
        hasNoBackend={false}
        hasTypeError={false}
        selectedTypeRef={{ current: "" }}
        selectedType=""
        filters={[]}
        activeBackendFeatures={[]}
        activeBackendExtraConfigs={[]}
        featureValues={{}}
        extraConfigValues={{}}
        visibleExtraConfigKeys={[]}
        isEnabled
        isAutoArchive
        onTypeChange={() => {}}
        onAddFilter={() => {}}
        onRemoveFilter={() => {}}
        onUpdateFilter={() => {}}
        onToggleFeature={() => {}}
        onShowExtraConfig={() => {}}
        onExtraConfigChange={() => {}}
        onClearExtraConfig={() => {}}
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

  it("shows the filters block for a backend that declares filters, and only then", async () => {
    await renderSection({ selectedType: "ckan", activeBackendFilters: CKAN_FILTERS });
    expect(container.textContent).toContain(ptHarvesters.form.addFilter);

    // dgt declares no filters of its own, so the block must stay hidden. This
    // used to be keyed on a hardcoded `selectedType === "ckan" || "ckanpt"`,
    // which also hid the block for odspt and ogc — both of which do declare
    // filters the backend accepts.
    await renderSection({ selectedType: "dgt", activeBackendFilters: [] });
    expect(container.textContent).not.toContain(ptHarvesters.form.addFilter);
  });
});

describe("HarvesterImplementationSection — chaves de filtro", () => {
  /**
   * LEDG-2311: the filter type select carried two literals, `organization` and
   * `tag`. The backends declare `tags`, and `HarvestConfigField.pre_validate`
   * raises `Unknown filter key "tag" for "ckan" backend`, so a "Marcação"
   * filter created in the wizard could never reach the harvester. The options
   * now come from the same metadata the edit screen reads.
   */
  it("offers the keys the backend declares, so `tags` and never `tag`", async () => {
    await renderSection({
      selectedType: "ckan",
      activeBackendFilters: CKAN_FILTERS,
      filters: [{ mode: "include", type: "tags", value: "ambiente" }],
    });

    // The design system does not put the option value in an attribute of its
    // own; it encodes it in `data-section-option-id` as `<id>-text-<value>`,
    // which is the only place the key — the part the backend validates — is
    // observable in the DOM. Asserting on the label instead would pass with the
    // wrong key, since "Marcação" is what both `tag` and `tags` are labelled.
    const keys = [...container.querySelectorAll("#filter-type-0 [data-section-option-id]")].map(
      (node) => node.getAttribute("data-section-option-id")?.replace("filter-type-0-text-", ""),
    );
    expect(keys).toContain("tags");
    expect(keys).not.toContain("tag");
    expect(keys).toContain("organization");
  });

  it("labels each key from the metadata label, translated when we know it", async () => {
    await renderSection({
      selectedType: "ckan",
      activeBackendFilters: CKAN_FILTERS,
      filters: [{ mode: "include", type: "tags", value: "ambiente" }],
    });

    const text = container.querySelector("#filter-type-0")?.textContent ?? "";
    expect(text).toContain(ptHarvesters.form.filterLabels.tags);
    expect(text).toContain(ptHarvesters.form.filterLabels.organization);
  });

  it("falls back to the backend label for a key we have no translation for", async () => {
    await renderSection({
      selectedType: "odspt",
      activeBackendFilters: [filter("Algo Novo", "somethingNew")],
      filters: [{ mode: "include", type: "somethingNew", value: "x" }],
    });

    const text = container.querySelector("#filter-type-0")?.textContent ?? "";
    expect(text).toContain("Algo Novo");
    expect(text).not.toContain("form.filterLabels");
  });

  /**
   * `/api/1` marshals the filter labels through `get_locale()`, which falls back
   * to the deployment's `DEFAULT_LANGUAGE`, so the endpoint answers "Etiqueta"
   * and "Editor" — not "Tag" and "Publisher". Looking the translation up by
   * label therefore never matched; it is looked up by key.
   */
  it("translates by key, so the label the API sends does not decide it", async () => {
    await renderSection({
      selectedType: "ckan",
      activeBackendFilters: [
        { label: "Etiqueta", key: "tags", type: "string", description: "" },
        { label: "Organização", key: "organization", type: "string", description: "" },
      ],
      filters: [{ mode: "include", type: "tags", value: "ambiente" }],
    });

    const text = container.querySelector("#filter-type-0")?.textContent ?? "";
    expect(text).toContain(ptHarvesters.form.filterLabels.tags);
    expect(text).not.toContain("Etiqueta");
  });

  it("marks the saved key as selected so a step back does not blank the control", async () => {
    await renderSection({
      selectedType: "ckan",
      activeBackendFilters: CKAN_FILTERS,
      filters: [{ mode: "exclude", type: "tags", value: "ambiente" }],
    });

    const selected = container.querySelectorAll(
      '#filter-type-0 [aria-selected="true"], #filter-type-0 [data-selected="true"]',
    );
    expect([...selected].map((node) => node.textContent).join(" ")).toContain(
      ptHarvesters.form.filterLabels.tags,
    );
  });
});

/**
 * LEDG-2316: the GeoDCAT-AP switch was gated on `selectedType === "csw-dcat"`
 * and the remote-URL-prefix block on a two-id list, so the `inspire` feature of
 * the OpenDataSoft PT backend had no UI at all. Both now come from the same
 * metadata the filters do.
 */
describe("HarvesterImplementationSection — features e extra configs", () => {
  const GEODCATAP = { key: "geodcatap", label: "GeoDCAT-AP", description: "", default: false };
  const INSPIRE = {
    key: "inspire",
    label: "Harvest Inspire datasets",
    description: "",
    default: false,
  };
  const REMOTE_PREFIX = {
    key: "remote_url_prefix",
    label: "Prefixo de URL remoto",
    description: "",
    default: "",
  };

  it("renders a switch per declared feature, labelled from our own i18n", async () => {
    await renderSection({
      selectedType: "csw-dcat",
      activeBackendFeatures: [GEODCATAP],
      featureValues: { geodcatap: false },
    });

    expect(container.textContent).toContain(ptHarvesters.form.featureLabels.geodcatap);
  });

  it("renders the feature no backend id ever showed", async () => {
    await renderSection({
      selectedType: "odspt",
      activeBackendFeatures: [INSPIRE],
      featureValues: { inspire: false },
    });

    // The pt label is ours: upstream leaves this msgid untranslated, so the API
    // answers it in English.
    expect(container.textContent).toContain(ptHarvesters.form.featureLabels.inspire);
  });

  it("shows nothing when the backend declares no features or extra configs", async () => {
    await renderSection({ selectedType: "dcat" });

    expect(container.textContent).not.toContain(ptHarvesters.form.featureLabels.geodcatap);
    expect(container.textContent).not.toContain(ptHarvesters.form.extraConfigLabels.remote_url_prefix);
  });

  it("offers the extra config behind a reveal link, then its input", async () => {
    await renderSection({
      selectedType: "csw-dcat",
      activeBackendExtraConfigs: [REMOTE_PREFIX],
      visibleExtraConfigKeys: [],
    });
    expect(container.textContent).toContain(ptHarvesters.form.configure);
    expect(container.querySelector("#extra-config-remote_url_prefix")).toBeNull();

    await renderSection({
      selectedType: "csw-dcat",
      activeBackendExtraConfigs: [REMOTE_PREFIX],
      visibleExtraConfigKeys: ["remote_url_prefix"],
      extraConfigValues: { remote_url_prefix: "https://exemplo.pt/dados/" },
    });
    const input = container.querySelector<HTMLInputElement>("#extra-config-remote_url_prefix");
    expect(input?.value).toBe("https://exemplo.pt/dados/");
  });

  it("keys the extra config input on the declared key, not on a fixed id", async () => {
    // The old markup hardcoded `id="remote-url-prefix"`; a second extra config
    // would have collided with it.
    await renderSection({
      selectedType: "odspt",
      activeBackendExtraConfigs: [{ key: "other_thing", label: "Outra Coisa", description: "", default: "" }],
      visibleExtraConfigKeys: ["other_thing"],
    });

    expect(container.querySelector("#extra-config-other_thing")).not.toBeNull();
    expect(container.textContent).toContain("Outra Coisa");
  });
});
