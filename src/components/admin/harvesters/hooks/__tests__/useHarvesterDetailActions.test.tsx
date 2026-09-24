/**
 * The harvester detail screen has one "Pré-visualizar" button and two routes
 * behind it, and picking the wrong one answers 403 to people who are entitled
 * to a preview.
 *
 *  1. `POST /harvest/source/preview/` previews a config that is not stored yet.
 *     It can only authorize against an organization — and against org-admin at
 *     that, since `Organization.permissions["harvest"]` is
 *     `EditOrganizationPermission`. It is the right call only when the form can
 *     actually differ from what is saved, i.e. when the user may edit.
 *  2. `GET /harvest/source/<id>/preview/` previews the stored source and
 *     authorizes per source through `source.permissions["preview"]`
 *     (`HarvestSourcePermission`), which covers the owner and an
 *     organization's editors.
 *
 * Without edit rights every field in the configuration tab is disabled, so the
 * config the form holds IS the stored config and route 2 returns the same
 * preview that route 1 would have — except it is allowed to.
 */

import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "pt" } }),
}));

const previewHarvestSourceMock = vi.fn();
const previewHarvestSourceByIdMock = vi.fn();
vi.mock("@/service/api/harvesters", () => ({
  deleteHarvester: vi.fn(),
  previewHarvestSource: (payload: unknown) => previewHarvestSourceMock(payload),
  previewHarvestSourceById: (id: string) => previewHarvestSourceByIdMock(id),
  rejectHarvestSource: vi.fn(),
  scheduleHarvester: vi.fn(),
  unscheduleHarvester: vi.fn(),
  updateHarvester: vi.fn(),
  validateHarvestSource: vi.fn(),
}));

import { useHarvesterDetailActions } from "../useHarvesterDetailActions";

type HookResult = ReturnType<typeof useHarvesterDetailActions>;
type HookParams = Parameters<typeof useHarvesterDetailActions>[0];

const PREVIEW_JOB = { id: "job-1", status: "done", items: [] };

/**
 * A source with the given `permissions` flags.
 *
 * The flags must be a combination the backend actually serializes, which is the
 * whole reason this file exists in its current shape. `HarvestSourceAdminPermission`
 * resolves `edit` from `OrganizationAdminNeed(source.organization)` when there is
 * an organization and from `UserNeed(source.owner)` otherwise — so `edit: false`
 * on an owner-only source is unreachable, and a test that asserts on it proves
 * nothing about the owner it claims to cover.
 */
function harvestSource(permissions: Record<string, boolean>, organizationId?: string) {
  return {
    id: "src-1",
    name: "Catálogo",
    description: null,
    url: "https://exemplo.pt/catalogo",
    backend: "ckan",
    organization: organizationId
      ? { id: organizationId, name: "DGT", slug: "dgt", acronym: null, logo: null }
      : null,
    schedule: null,
    config: { apikey: "segredo" },
    filters: [],
    features: {},
    active: true,
    autoarchive: true,
    validation: null,
    created_at: "2026-01-01T00:00:00+00:00",
    last_modified: "2026-01-01T00:00:00+00:00",
    last_job: null,
    datasets_count: 0,
    permissions,
  } as unknown as HookParams["source"];
}

function params(source: HookParams["source"]): HookParams {
  return {
    source,
    backends: [],
    selectedBackend: "ckan",
    harvesterName: "Catálogo",
    harvesterDescription: "",
    harvesterUrl: "https://exemplo.pt/catalogo",
    isEnabled: true,
    isAutoArchive: true,
    filters: [],
    featureValues: {},
    extraConfigValues: {},
    harvesterSchedule: "",
    setSource: vi.fn(),
    setFilters: vi.fn(),
    setIsSaving: vi.fn(),
    setSaveSuccess: vi.fn(),
    setSaveError: vi.fn(),
    showSaveSuccess: vi.fn(),
    setErrors: vi.fn(),
    focusFirstError: vi.fn(),
    setIsPreviewing: vi.fn(),
    setPreviewJob: vi.fn(),
    setPreviewError: vi.fn(),
    hide: vi.fn(),
    push: vi.fn(),
  } as unknown as HookParams;
}

let container: HTMLDivElement;
let root: Root;

const probe: { result: HookResult | null } = { result: null };
const latest = () => probe.result as HookResult;

function Probe({ value }: { value: HookParams }) {
  const result = useHarvesterDetailActions(value);
  useEffect(() => {
    probe.result = result;
  });
  return null;
}

async function render(value: HookParams) {
  await act(async () => {
    root.render(<Probe value={value} />);
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  previewHarvestSourceMock.mockReset();
  previewHarvestSourceByIdMock.mockReset();
  previewHarvestSourceMock.mockResolvedValue(PREVIEW_JOB);
  previewHarvestSourceByIdMock.mockResolvedValue(PREVIEW_JOB);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe("useHarvesterDetailActions — which preview route", () => {
  it("previews an editable source through the config route, naming its organization", async () => {
    await render(params(harvestSource({ edit: true, preview: true }, "org-dgt")));

    await act(async () => {
      await latest().handlePreviewHarvester();
    });

    expect(previewHarvestSourceByIdMock).not.toHaveBeenCalled();
    expect(previewHarvestSourceMock).toHaveBeenCalledTimes(1);
    expect(previewHarvestSourceMock.mock.calls[0][0]).toMatchObject({
      organization: "org-dgt",
    });
  });

  /**
   * An organization editor: `preview` yes, `edit` no. Before this, the screen
   * sent them to the config route with no organization at all, which is why it
   * worked — the endpoint skipped its permission test entirely. Naming the
   * organization would now answer 403, so the route has to change with it.
   */
  it("previews a read-only source through its own source route", async () => {
    await render(params(harvestSource({ edit: false, preview: true }, "org-dgt")));

    await act(async () => {
      await latest().handlePreviewHarvester();
    });

    expect(previewHarvestSourceMock).not.toHaveBeenCalled();
    expect(previewHarvestSourceByIdMock).toHaveBeenCalledWith("src-1");
  });

  /**
   * The owner of an owner-only source, which is the case that makes the second
   * half of the condition load-bearing: the backend grants them `edit: true`
   * (UserNeed on the owner), so testing edit rights alone routes them to the
   * config endpoint — where a payload naming no organization requires a
   * sysadmin, and they get a 403 for a preview they are entitled to.
   */
  it("previews an owner-only source through its own source route", async () => {
    await render(params(harvestSource({ edit: true, preview: true })));

    await act(async () => {
      await latest().handlePreviewHarvester();
    });

    expect(previewHarvestSourceMock).not.toHaveBeenCalled();
    expect(previewHarvestSourceByIdMock).toHaveBeenCalledWith("src-1");
  });
});
