/**
 * LEDG-2323: the "Pré-visualizar" button was the one action on this form with no
 * authorization behind it. Saving sits behind `canEdit` and deleting behind
 * `canDelete`, both backend-computed flags, while preview was rendered for
 * anyone who reached the screen — and the detail routes (`/admin/harvesters/…`)
 * are under no route guard, so that is any authenticated account.
 *
 * It now follows `canPreview`, which the detail screen fills from
 * `source.permissions["preview"]`. The flag comes from the backend on purpose:
 * `src/utils/permissions.ts` is explicit that the UI consumes the serialized
 * flags instead of re-deriving owner/role rules on the client.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { HarvesterConfigForm } from "../HarvesterConfigForm";

type FormProps = React.ComponentProps<typeof HarvesterConfigForm>;

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

function render(overrides: Partial<FormProps> = {}) {
  const props = {
    harvesterName: "Catálogo",
    setHarvesterName: () => {},
    harvesterDescription: "",
    setHarvesterDescription: () => {},
    harvesterUrl: "https://exemplo.pt/catalogo",
    setHarvesterUrl: () => {},
    isEnabled: true,
    setIsEnabled: () => {},
    isAutoArchive: true,
    setIsAutoArchive: () => {},
    filters: [],
    loadedSchedule: "",
    selectedBackend: "ckan",
    setSelectedBackend: () => {},
    backends: [],
    activeBackendFilters: [],
    activeBackendFeatures: [],
    activeBackendExtraConfigs: [],
    featureValues: {},
    extraConfigValues: {},
    onToggleFeature: () => {},
    onExtraConfigChange: () => {},
    formErrors: {},
    clearError: () => {},
    addFilter: () => {},
    removeFilter: () => {},
    updateFilter: () => {},
    setHarvesterSchedule: () => {},
    isSaving: false,
    onSave: () => {},
    isPreviewing: false,
    previewJob: null,
    previewError: null,
    onPreview: () => {},
    onDelete: () => {},
    ...overrides,
  } as unknown as FormProps;

  act(() => {
    root.render(<HarvesterConfigForm {...props} />);
  });
}

function buttonLabels() {
  return Array.from(container.querySelectorAll("button")).map((button) =>
    (button.textContent ?? "").trim(),
  );
}

describe("HarvesterConfigForm — the preview action", () => {
  it("offers the preview to whoever the backend says may preview", () => {
    render({ canPreview: true, canEdit: false });

    expect(buttonLabels()).toContain(ptHarvesters.actions.preview);
  });

  it("does not offer it to whoever may not", () => {
    render({ canPreview: false, canEdit: false });

    expect(buttonLabels()).not.toContain(ptHarvesters.actions.preview);
  });

  /**
   * Preview and save are separate rights: an organization's editors may preview
   * a source they cannot edit (`HarvestSourcePermission` vs
   * `HarvestSourceAdminPermission`), so one flag must not gate the other.
   */
  it("keeps preview and save independent", () => {
    render({ canPreview: true, canEdit: false });

    expect(buttonLabels()).toContain(ptHarvesters.actions.preview);
    expect(buttonLabels()).not.toContain(ptHarvesters.actions.save);
  });

  /** The creation wizard has no source yet, so it renders with neither flag set. */
  it("offers the preview by default, for the creation flow", () => {
    render();

    expect(buttonLabels()).toContain(ptHarvesters.actions.preview);
  });
});
