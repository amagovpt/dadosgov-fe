"use client";

import { useMemo } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  deleteHarvester,
  previewHarvestSource,
  previewHarvestSourceById,
  rejectHarvestSource,
  scheduleHarvester,
  unscheduleHarvester,
  updateHarvester,
  validateHarvestSource,
} from "@/service/api/harvesters";
import type {
  HarvestBackend,
  HarvestPreviewJob,
  HarvestSource,
} from "@/service/types/harvester";
import {
  buildHarvesterPreviewPayload,
  buildHarvesterUpdatePayload,
  type HarvesterFormField,
  validateHarvesterDetails,
} from "@/components/admin/harvesters/form-state/harvesterFormModel";
import type { FormErrors } from "@/hooks/forms/useFormErrors";
import { can } from "@/utils/permissions";
import {
  keepDeclaredKeys,
  selectBackendExtraConfigs,
  selectBackendFeatures,
  selectBackendFilters,
} from "@/components/admin/harvesters/form-state/harvesterBackendConfig";

interface UseHarvesterDetailActionsParams {
  source: HarvestSource | null;
  backends: HarvestBackend[];
  selectedBackend: string;
  harvesterName: string;
  harvesterDescription: string;
  harvesterUrl: string;
  isEnabled: boolean;
  isAutoArchive: boolean;
  filters: { type: string; value: string; mode: string }[];
  /** The flags and values of the features/extra configs the backend declares. */
  featureValues: Record<string, boolean>;
  extraConfigValues: Record<string, string>;
  harvesterSchedule: string;
  setSource: React.Dispatch<React.SetStateAction<HarvestSource | null>>;
  setFilters: React.Dispatch<
    React.SetStateAction<{ type: string; value: string; mode: string }[]>
  >;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
  showSaveSuccess: (message: boolean, durationMs?: number) => void;
  setErrors: (
    next:
      | FormErrors<HarvesterFormField>
      | ((previous: FormErrors<HarvesterFormField>) => FormErrors<HarvesterFormField>),
  ) => void;
  focusFirstError: () => void;
  setIsPreviewing: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewJob: React.Dispatch<React.SetStateAction<HarvestPreviewJob | null>>;
  setPreviewError: React.Dispatch<React.SetStateAction<string | null>>;
  hide: () => void;
  push: (href: string) => void;
}

export function useHarvesterDetailActions({
  source,
  backends,
  selectedBackend,
  harvesterName,
  harvesterDescription,
  harvesterUrl,
  isEnabled,
  isAutoArchive,
  filters,
  featureValues,
  extraConfigValues,
  harvesterSchedule,
  setSource,
  setFilters,
  setIsSaving,
  setSaveSuccess,
  setSaveError,
  showSaveSuccess,
  setErrors,
  focusFirstError,
  setIsPreviewing,
  setPreviewJob,
  setPreviewError,
  hide,
  push,
}: UseHarvesterDetailActionsParams) {
  const { t } = useTranslation("admin-harvesters");
  const activeBackendFilters = useMemo(
    () => selectBackendFilters(backends, selectedBackend),
    [backends, selectedBackend],
  );
  const activeBackendFeatures = useMemo(
    () => selectBackendFeatures(backends, selectedBackend),
    [backends, selectedBackend],
  );
  const activeBackendExtraConfigs = useMemo(
    () => selectBackendExtraConfigs(backends, selectedBackend),
    [backends, selectedBackend],
  );

  function addFilter() {
    const firstKey = activeBackendFilters[0]?.key ?? "";
    setFilters((previousFilters) => [
      ...previousFilters,
      { type: firstKey, value: "", mode: "include" },
    ]);
  }

  function removeFilter(index: number) {
    setFilters((previousFilters) =>
      previousFilters.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateFilter(index: number, field: string, value: string) {
    setFilters((previousFilters) =>
      previousFilters.map((filter, currentIndex) =>
        currentIndex === index ? { ...filter, [field]: value } : filter,
      ),
    );
  }

  async function handleSaveHarvester() {
    const errors = validateHarvesterDetails({
      name: harvesterName,
      url: harvesterUrl,
      messages: {
        harvesterName: t("form.validationErrors.name"),
        harvesterUrl: t("form.validationErrors.url"),
      },
    });
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    if (!source) return;

    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const newSchedule = harvesterSchedule.trim();
      const oldSchedule = source.schedule || "";
      const validKeys = new Set(activeBackendFilters.map((filter) => filter.key));

      const [updated] = await Promise.all([
        updateHarvester(
          source.id,
          buildHarvesterUpdatePayload({
            name: harvesterName,
            description: harvesterDescription,
            url: harvesterUrl,
            backend: selectedBackend,
            fallbackBackend: source.backend,
            active: isEnabled,
            autoarchive: isAutoArchive,
            filters,
            activeFilterKeys: [...validKeys],
            // What the form holds, seeded from the stored config and pruned to
            // the keys this backend declares.
            features: keepDeclaredKeys(featureValues, activeBackendFeatures),
            extraConfigs: keepDeclaredKeys(extraConfigValues, activeBackendExtraConfigs),
            storedConfig: source.config ?? {},
          }),
        ),
        newSchedule && newSchedule !== oldSchedule
          ? scheduleHarvester(source.id, newSchedule)
          : !newSchedule && oldSchedule
            ? unscheduleHarvester(source.id)
            : Promise.resolve(),
      ]);

      setSource(updated as HarvestSource);
      showSaveSuccess(true);
    } catch (error) {
      const err = error as { status?: number; data?: unknown };
      console.error("Error saving harvester:", err.status, err.data ?? error);
      const message =
        typeof err.data === "object" && err.data !== null
          ? JSON.stringify(err.data)
          : t("form.saveErrorRetry");
      setSaveError(t("form.saveError", { status: err.status ?? "?", message }));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePreviewHarvester() {
    if (!source) return;

    setIsPreviewing(true);
    setPreviewJob(null);
    setPreviewError(null);
    try {
      // Two preview routes, and which one is right follows from whether the
      // form can differ from what is stored. Without edit rights every field in
      // the configuration tab is disabled (`basicDisabled`/`advancedDisabled` in
      // HarvesterConfigForm), so the config here IS the stored config and the
      // per-source route serves it — and that route authorizes through
      // `source.permissions["preview"]`, which covers the owner and an
      // organization's editors. The config-payload route can only authorize
      // against an organization (org-admin), so sending them there would answer
      // 403 for a preview they are entitled to.
      const job = can(source, "edit")
        ? await previewHarvestSource(
            buildHarvesterPreviewPayload({
              name: harvesterName,
              fallbackName: source.name,
              url: harvesterUrl,
              fallbackUrl: source.url,
              backend: selectedBackend,
              fallbackBackend: source.backend,
              schedule: harvesterSchedule,
              organization: source.organization?.id,
              active: isEnabled,
              autoarchive: isAutoArchive,
              filters,
              features: keepDeclaredKeys(featureValues, activeBackendFeatures),
              extraConfigs: keepDeclaredKeys(extraConfigValues, activeBackendExtraConfigs),
              storedConfig: source.config ?? {},
            }),
          )
        : await previewHarvestSourceById(source.id);
      setPreviewJob(job);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      setPreviewError(
        err?.data?.message || err?.message || t("form.previewError"),
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleDeleteHarvester() {
    if (!source) return;

    try {
      await deleteHarvester(source.id);
      hide();
      push("/admin/system/harvesters");
    } catch (error) {
      console.error("Error deleting harvester:", error);
      hide();
    }
  }

  async function handleApproveSource(comment: string) {
    if (!source) return;

    const updated = await validateHarvestSource(source.id, comment || undefined);
    setSource((previousSource) =>
      previousSource
        ? { ...previousSource, validation: updated.validation ?? previousSource.validation }
        : previousSource,
    );
    hide();
  }

  async function handleRejectSource(comment: string) {
    if (!source) return;

    const updated = await rejectHarvestSource(source.id, comment);
    setSource((previousSource) =>
      previousSource
        ? { ...previousSource, validation: updated.validation ?? previousSource.validation }
        : previousSource,
    );
    hide();
  }

  return {
    activeBackendFilters,
    activeBackendFeatures,
    activeBackendExtraConfigs,
    addFilter,
    handleApproveSource,
    handleDeleteHarvester,
    handlePreviewHarvester,
    handleRejectSource,
    handleSaveHarvester,
    removeFilter,
    updateFilter,
  };
}
