"use client";

import type React from "react";
import { useTranslation } from "react-i18next";
import type { FormErrors } from "@/hooks/forms/useFormErrors";
import { fetchSpatialZonesByIds, updateDataset } from "@/service/api/datasets";
import type { SpatialZone } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import {
  buildDatasetEditPayload,
  type DatasetEditField,
  validateDatasetEditMetadata,
} from "@/components/admin/datasets/form-state/datasetEditFormModel";

interface UseDatasetMetadataActionsParams {
  dataset: Dataset | null;
  title: string;
  description: string;
  shortDescription: string;
  acronym: string;
  featured: boolean;
  temporalStart: string;
  temporalEnd: string;
  keywordsRef: React.MutableRefObject<string>;
  selectedLicenseRef: React.MutableRefObject<string>;
  selectedFrequencyRef: React.MutableRefObject<string>;
  spatialCoverageRef: React.MutableRefObject<string>;
  spatialGranularityRef: React.MutableRefObject<string>;
  setDataset: React.Dispatch<React.SetStateAction<Dataset | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  setApiSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setErrors: (errors: FormErrors<DatasetEditField>) => void;
  resetErrors: () => void;
  focusFirstError: () => void;
  setSelectedSpatialZonesValue: React.Dispatch<React.SetStateAction<string>>;
  showApiSuccess: (message: string, durationMs?: number) => void;
  focusAfterSave: () => void;
}

export function useDatasetMetadataActions({
  dataset,
  title,
  description,
  shortDescription,
  acronym,
  featured,
  temporalStart,
  temporalEnd,
  keywordsRef,
  selectedLicenseRef,
  selectedFrequencyRef,
  spatialCoverageRef,
  spatialGranularityRef,
  setDataset,
  setIsSubmitting,
  setApiError,
  setApiSuccess,
  setErrors,
  resetErrors,
  focusFirstError,
  setSelectedSpatialZonesValue,
  showApiSuccess,
  focusAfterSave,
}: UseDatasetMetadataActionsParams) {
  const { t } = useTranslation("admin-datasets");

  async function handleSaveMetadata() {
    if (!dataset) return;

    const errors = validateDatasetEditMetadata({
      title,
      description,
      temporalStart,
      temporalEnd,
    });
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);

    try {
      const granularity = spatialGranularityRef.current || undefined;
      const zonesValue = spatialCoverageRef.current;
      const zones = zonesValue
        ? zonesValue
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined;

      let validZones = zones;
      let zoneDetails: SpatialZone[] = [];

      if (zones && zones.length > 0) {
        zoneDetails = await fetchSpatialZonesByIds(zones);
        const validZoneIds = new Set(zoneDetails.map((zone) => zone.id));
        validZones = zones.filter((id) => validZoneIds.has(id));

        if (validZones.length !== zones.length) {
          const normalized = validZones.join(",");
          spatialCoverageRef.current = normalized;
          setSelectedSpatialZonesValue(normalized);
        }
      }

      let resolvedGranularity = granularity;
      if (validZones && validZones.length > 0) {
        const selectedZoneSet = new Set(validZones);
        const levels = Array.from(
          new Set(
            zoneDetails
              .filter((zone) => selectedZoneSet.has(zone.id))
              .map((zone) => (typeof zone.level === "string" ? zone.level.trim() : ""))
              .filter(Boolean),
          ),
        );

        if (levels.length === 1) {
          resolvedGranularity = levels[0];
        } else if (
          levels.length > 1 &&
          resolvedGranularity &&
          !levels.includes(resolvedGranularity)
        ) {
          resolvedGranularity = levels[0];
        }

        spatialGranularityRef.current = resolvedGranularity || "";
      }

      const updated = await updateDataset(
        dataset.id,
        buildDatasetEditPayload({
          title,
          description,
          shortDescription,
          acronym,
          featured,
          keywords: keywordsRef.current,
          license: selectedLicenseRef.current,
          frequency: selectedFrequencyRef.current,
          temporalStart,
          temporalEnd,
          spatialGeom: dataset.spatial?.geom,
          spatialZones: validZones,
          spatialGranularity: resolvedGranularity,
          existingSpatialZones: dataset.spatial?.zones,
        }),
      );

      setDataset(updated);
      showApiSuccess(t("edit.metadataSaved"));
      focusAfterSave();
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const flattenValue = (value: unknown): string => {
          if (Array.isArray(value)) return value.map(flattenValue).join("; ");
          if (value && typeof value === "object") {
            return Object.values(value as Record<string, unknown>)
              .map(flattenValue)
              .join("; ");
          }
          return String(value);
        };

        const messages = Object.entries(err.data)
          .map(([key, value]) => `${key}: ${flattenValue(value)}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError(t("edit.metadataSaveError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    handleSaveMetadata,
  };
}
