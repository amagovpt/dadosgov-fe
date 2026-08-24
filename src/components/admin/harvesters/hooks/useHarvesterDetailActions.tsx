"use client";

import { useMemo } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  deleteHarvester,
  previewHarvestSource,
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
import { selectBackendFilters } from "@/components/admin/harvesters/form-state/harvesterFilterLabels";

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

/**
 * The features and extra configs already stored on the source, in the shape the
 * payload builders take.
 *
 * The API replaces the whole `config` on update, so a save that omits them
 * erases them. Until the edit screen renders its own controls for these, it has
 * to send back what it read — otherwise saving a harvester created with, say,
 * GeoDCAT-AP on would silently turn it off.
 */
function readStoredConfig(source: HarvestSource | null) {
  const config = (source?.config ?? {}) as {
    features?: Record<string, boolean>;
    extra_configs?: { key?: string; value?: string }[];
  };

  return {
    features: config.features ?? {},
    extraConfigs: Object.fromEntries(
      (config.extra_configs ?? [])
        .filter((entry) => entry.key)
        .map((entry) => [entry.key as string, entry.value ?? ""]),
    ),
  };
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
            ...readStoredConfig(source),
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
      const job = await previewHarvestSource(
        buildHarvesterPreviewPayload({
          name: harvesterName,
          fallbackName: source.name,
          url: harvesterUrl,
          fallbackUrl: source.url,
          backend: selectedBackend,
          fallbackBackend: source.backend,
          schedule: harvesterSchedule,
          active: isEnabled,
          autoarchive: isAutoArchive,
          filters,
          ...readStoredConfig(source),
        }),
      );
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
