"use client";

import type React from "react";
import {
  createDataset,
  createResource,
  fetchDataset,
  fetchSpatialZonesByIds,
  updateDataset,
  updateResource,
  uploadResource,
} from "@/service/api/datasets";
import type { SpatialZone } from "@/service/types/catalog";
import type { Dataset, DatasetUpdatePayload } from "@/service/types/dataset";
import { translateUploadError } from "@/lib/security/translateUploadError";
import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal";
import type { DatasetWizardDraftContact } from "@/components/admin/datasets/publication-wizard/datasetWizardTypes";
import {
  buildDatasetCreatePayload,
  toDatasetIsoDate,
  type DatasetFormField,
  validateDatasetDetails,
} from "@/components/admin/datasets/publication-wizard/datasetFormModel";

interface UseDatasetWizardSubmissionActionsParams {
  currentStep: number;
  datasetId?: string | null;
  createdDataset: Dataset | null;
  datasetTitle: string;
  datasetAcronym: string;
  datasetDescription: string;
  datasetShortDescription: string;
  selectedProducer: string;
  selectedContactPointIds: string[];
  draftContacts: DatasetWizardDraftContact[];
  temporalStart: string;
  temporalEnd: string;
  uploadedFiles: File[];
  resourceUrls: string[];
  resourceMetadata: Record<string, PendingResourceMeta>;
  selectedProducerRef: React.MutableRefObject<string>;
  selectedLicenseRef: React.MutableRefObject<string>;
  selectedFrequencyRef: React.MutableRefObject<string>;
  selectedKeywordsRef: React.MutableRefObject<string>;
  spatialCoverageRef: React.MutableRefObject<string>;
  spatialGranularityRef: React.MutableRefObject<string>;
  setCreatedDataset: React.Dispatch<React.SetStateAction<Dataset | null>>;
  setSelectedSpatialZonesValue: React.Dispatch<React.SetStateAction<string | null>>;
  setDraftContacts: React.Dispatch<React.SetStateAction<DatasetWizardDraftContact[]>>;
  setResourceUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setResourceMetadata: React.Dispatch<
    React.SetStateAction<Record<string, PendingResourceMeta>>
  >;
  setShowFileError: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  setErrors: (
    next:
      | FormErrors<DatasetFormField>
      | ((previous: FormErrors<DatasetFormField>) => FormErrors<DatasetFormField>),
  ) => void;
  resetErrors: () => void;
  focusFirstError: () => void;
  onDatasetCreated?: (datasetId: string) => void;
  onNextStep: () => void;
  onComplete?: () => void;
  navigateToStep: (nextStep: number, nextDatasetId: string) => void;
  finishWizard: () => void;
}

function flattenApiError(errorData: Record<string, unknown>): string {
  const flattenValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(flattenValue).join("; ");
    if (value && typeof value === "object") {
      return Object.values(value as Record<string, unknown>).map(flattenValue).join("; ");
    }
    return String(value);
  };

  return Object.entries(errorData)
    .map(([key, value]) => `${key}: ${flattenValue(value)}`)
    .join(", ");
}

export function useDatasetWizardSubmissionActions({
  currentStep,
  datasetId,
  createdDataset,
  datasetTitle,
  datasetAcronym,
  datasetDescription,
  datasetShortDescription,
  selectedProducer,
  selectedContactPointIds,
  draftContacts,
  temporalStart,
  temporalEnd,
  uploadedFiles,
  resourceUrls,
  resourceMetadata,
  selectedProducerRef,
  selectedLicenseRef,
  selectedFrequencyRef,
  selectedKeywordsRef,
  spatialCoverageRef,
  spatialGranularityRef,
  setCreatedDataset,
  setSelectedSpatialZonesValue,
  setDraftContacts,
  setResourceUrls,
  setResourceMetadata,
  setShowFileError,
  setIsSubmitting,
  setApiError,
  setErrors,
  resetErrors,
  focusFirstError,
  onDatasetCreated,
  onNextStep,
  onComplete,
  navigateToStep,
  finishWizard,
}: UseDatasetWizardSubmissionActionsParams) {
  async function handleStep2Next(e?: React.MouseEvent<HTMLButtonElement>) {
    const { errors, draftErrors } = validateDatasetDetails({
      producer: selectedProducerRef.current,
      title: datasetTitle,
      description: datasetDescription,
      frequency: selectedFrequencyRef.current,
      temporalStart,
      temporalEnd,
      selectedProducer,
      selectedContactPointIds,
      draftContacts,
    });

    if (errors.contactDrafts) {
      setDraftContacts((previousDrafts) =>
        previousDrafts.map((draft) =>
          draftErrors[draft.id] ? { ...draft, errors: draftErrors[draft.id] } : draft,
        ),
      );
    }

    if (
      (errors.temporalCoverage || errors.temporalCoverageInvalidFormat) &&
      Object.keys(errors).length === 1
    ) {
      e?.preventDefault();
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload = buildDatasetCreatePayload({
        title: datasetTitle,
        acronym: datasetAcronym,
        description: datasetDescription,
        shortDescription: datasetShortDescription,
        producer: selectedProducerRef.current,
        license: selectedLicenseRef.current,
        frequency: selectedFrequencyRef.current,
        keywords: selectedKeywordsRef.current,
        contactPointIds: selectedContactPointIds,
        temporalStart,
        temporalEnd,
      });

      const spatialZoneIds = spatialCoverageRef.current
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      let validSpatialZoneIds = spatialZoneIds;
      let zoneDetails: SpatialZone[] = [];

      if (spatialZoneIds.length > 0) {
        zoneDetails = await fetchSpatialZonesByIds(spatialZoneIds);
        const validZoneIds = new Set(zoneDetails.map((zone) => zone.id));
        validSpatialZoneIds = spatialZoneIds.filter((id) => validZoneIds.has(id));
        if (validSpatialZoneIds.length !== spatialZoneIds.length) {
          const normalized = validSpatialZoneIds.join(",");
          spatialCoverageRef.current = normalized;
          setSelectedSpatialZonesValue(normalized);
        }
      }

      let resolvedGranularity = spatialGranularityRef.current || null;
      if (validSpatialZoneIds.length > 0) {
        const selectedZoneSet = new Set(validSpatialZoneIds);
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

      if (validSpatialZoneIds.length > 0 || resolvedGranularity) {
        payload.spatial = {
          geom: null,
          zones: validSpatialZoneIds,
          granularity: resolvedGranularity,
        };
      }

      const dataset = createdDataset
        ? await updateDataset(createdDataset.id, payload as DatasetUpdatePayload)
        : await createDataset(payload);

      setCreatedDataset(dataset);
      if (onDatasetCreated) {
        onDatasetCreated(dataset.id);
      } else {
        navigateToStep(currentStep + 1, dataset.id);
      }
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        setApiError(flattenApiError(err.data));
      } else {
        setApiError("Erro ao guardar o conjunto de dados. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateResourceMetadata(key: string, meta: PendingResourceMeta, newUrl?: string) {
    if (newUrl !== undefined && key.startsWith("url-")) {
      const oldUrl = key.slice(4);
      if (oldUrl !== newUrl) {
        setResourceUrls((previousUrls) => previousUrls.map((url) => (url === oldUrl ? newUrl : url)));
        setResourceMetadata((previousMetadata) => {
          const updated = { ...previousMetadata, [`url-${newUrl}`]: meta };
          delete updated[key];
          return updated;
        });
        return;
      }
    }
    setResourceMetadata((previousMetadata) => ({ ...previousMetadata, [key]: meta }));
  }

  async function handleStep3Next() {
    const trimmedUrls = resourceUrls.map((url) => url.trim()).filter(Boolean);
    const hasFiles = uploadedFiles.length > 0;
    const hasUrls = trimmedUrls.length > 0;

    if (!hasFiles && !hasUrls) {
      setShowFileError(true);
      return;
    }

    setShowFileError(false);
    setApiError(null);
    setIsSubmitting(true);

    let dataset = createdDataset;
    if (!dataset) {
      if (!datasetId) {
        setApiError(
          "Erro: o conjunto de dados não foi criado. Volte ao passo anterior e preencha o formulário.",
        );
        setIsSubmitting(false);
        return;
      }
      try {
        dataset = await fetchDataset(datasetId);
        setCreatedDataset(dataset);
      } catch {
        setApiError("Erro ao carregar o conjunto de dados. Tente novamente.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (hasFiles) {
        for (const file of uploadedFiles) {
          const meta = resourceMetadata[`file-${file.name}`];
          const resource = await uploadResource(dataset.id, file);
          if (meta) {
            await updateResource(dataset.id, resource.id, {
              title: meta.title || file.name,
              type: meta.resourceType || "main",
              description: meta.description || undefined,
              format: meta.format || undefined,
              mime: meta.mime || undefined,
              filesize: meta.filesize ? Number(meta.filesize) : undefined,
            });
          }
        }
      }

      for (const url of trimmedUrls) {
        const meta = resourceMetadata[`url-${url}`];
        await createResource(dataset.id, {
          title: meta?.title || url,
          type: meta?.resourceType || "main",
          description: meta?.description || undefined,
          url,
          filetype: "remote",
          format: meta?.format || undefined,
          mime: meta?.mime || undefined,
          filesize: meta?.filesize ? Number(meta.filesize) : undefined,
        });
      }

      onNextStep();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error uploading resources:", error.message, error.stack);
        setApiError(`Erro ao guardar recurso: ${translateUploadError(error.message)}`);
      } else {
        const err = error as { status?: number; data?: Record<string, unknown> };
        console.error("Error uploading resources:", err.status, err.data);
        if (err.data && typeof err.data === "object" && Object.keys(err.data).length > 0) {
          const message =
            (err.data.message as string) || flattenApiError(err.data);
          setApiError(`Erro ao guardar recurso: ${translateUploadError(message)}`);
        } else {
          const statusHint = err.status ? ` (${err.status})` : "";
          setApiError(`Erro ao guardar recurso${statusHint}. Tente novamente.`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!createdDataset) return;

    setApiError(null);
    setIsSubmitting(true);
    try {
      const refTags = selectedKeywordsRef.current
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const tags = refTags.length > 0 ? refTags : createdDataset.tags || [];
      const publishPayload: DatasetUpdatePayload = {
        private: false,
        title: createdDataset.title,
        description: createdDataset.description,
        description_short: createdDataset.description_short || undefined,
        acronym: createdDataset.acronym || undefined,
        tags,
        license: createdDataset.license || undefined,
        frequency: createdDataset.frequency || undefined,
        temporal_coverage: createdDataset.temporal_coverage || undefined,
        spatial: createdDataset.spatial || undefined,
        organization: createdDataset.organization?.id,
      };
      await updateDataset(createdDataset.id, publishPayload);
      if (onComplete) onComplete();
      else finishWizard();
    } catch (error) {
      console.error("Error publishing dataset:", error);
      setApiError("Erro ao publicar o conjunto de dados. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (!createdDataset) {
      if (onComplete) onComplete();
      else finishWizard();
      return;
    }

    setApiError(null);
    setIsSubmitting(true);
    try {
      const refTags = selectedKeywordsRef.current
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const tags = refTags.length > 0 ? refTags : createdDataset.tags || [];
      const startIso = toDatasetIsoDate(temporalStart);
      const endIso = toDatasetIsoDate(temporalEnd);
      let temporalCoverage: DatasetUpdatePayload["temporal_coverage"] =
        createdDataset.temporal_coverage || undefined;
      if (startIso || endIso) {
        const start = startIso || createdDataset.temporal_coverage?.start;
        if (start) {
          temporalCoverage = {
            start,
            ...(endIso
              ? { end: endIso }
              : createdDataset.temporal_coverage?.end
                ? { end: createdDataset.temporal_coverage.end }
                : {}),
          };
        }
      }

      const draftPayload: DatasetUpdatePayload = {
        private: true,
        title: createdDataset.title,
        description: createdDataset.description,
        description_short: createdDataset.description_short || undefined,
        acronym: createdDataset.acronym || undefined,
        tags,
        license: createdDataset.license || undefined,
        frequency: createdDataset.frequency || undefined,
        temporal_coverage: temporalCoverage,
        spatial: createdDataset.spatial || undefined,
        organization: createdDataset.organization?.id,
      };

      await updateDataset(createdDataset.id, draftPayload);
      if (onComplete) onComplete();
      else finishWizard();
    } catch (error) {
      console.error("Error saving draft dataset:", error);
      setApiError("Erro ao guardar o rascunho. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    updateResourceMetadata,
    handlePublish,
    handleSaveDraft,
    handleStep2Next,
    handleStep3Next,
  };
}
