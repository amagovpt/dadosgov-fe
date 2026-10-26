"use client";

import type React from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { getDatasetDraftExtras, getDatasetPublicationIssues } from "@/utils/datasetPublication";
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
import type { Dataset, DatasetUpdatePayload, Resource } from "@/service/types/dataset";
import { translateUploadError } from "@/lib/security/translateUploadError";
import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";
import type { DatasetWizardDraftContact } from "@/components/admin/datasets/publication-wizard/datasetWizardTypes";
import {
  buildDatasetCreatePayload,
  type DatasetFormField,
  validateDatasetDetails,
} from "@/components/admin/datasets/publication-wizard/datasetFormModel";

interface UseDatasetWizardSubmissionActionsParams {
  currentStep: number;
  optionalContacts?: boolean;
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
  uploadProgressKey?: string;
  selectedProducerRef: React.MutableRefObject<string>;
  selectedLicenseRef: React.MutableRefObject<string>;
  selectedFrequencyRef: React.MutableRefObject<string>;
  selectedKeywordsRef: React.MutableRefObject<string>;
  spatialCoverageRef: React.MutableRefObject<string>;
  spatialGranularityRef: React.MutableRefObject<string>;
  setCreatedDataset: React.Dispatch<React.SetStateAction<Dataset | null>>;
  setSelectedSpatialZonesValue: React.Dispatch<React.SetStateAction<string | null>>;
  setDraftContacts: React.Dispatch<React.SetStateAction<DatasetWizardDraftContact[]>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setResourceUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setResourceMetadata: React.Dispatch<React.SetStateAction<Record<string, PendingResourceMeta>>>;
  setShowFileError: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  setErrors: (
    next:
      | FormErrors<DatasetFormField>
      | ((previous: FormErrors<DatasetFormField>) => FormErrors<DatasetFormField>)
  ) => void;
  resetErrors: () => void;
  focusFirstError: () => void;
  onDatasetCreated?: (datasetId: string) => void;
  onDraftSaved: (datasetId: string) => void;
  onNextStep: () => void;
  onComplete?: () => void;
  navigateToStep: (nextStep: number, nextDatasetId: string) => void;
  finishWizard: () => void;
  validationMessages: {
    producerRequired: string;
    titleRequired: string;
    titleTooLong: string;
    descriptionRequired: string;
    frequencyRequired: string;
    invalidDate: string;
    invalidRange: string;
    contactDraftRequired: string;
  };
  restoreErrors: {
    missingDataset: string;
    loadDataset: string;
    saveDataset: string;
    saveResource: string;
    saveResourceRetry: string;
    publish: string;
    saveDraft: string;
  };
}

function flattenApiError(errorData: Record<string, unknown>): string {
  const flattenValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(flattenValue).join("; ");
    if (value && typeof value === "object") {
      return Object.values(value as Record<string, unknown>)
        .map(flattenValue)
        .join("; ");
    }
    return String(value);
  };

  return Object.entries(errorData)
    .map(([key, value]) => `${key}: ${flattenValue(value)}`)
    .join(", ");
}

function readUploadProgress(key: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || "{}");
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).filter(([, id]) => typeof id === "string"));
    }
  } catch {
    // A malformed local record must not stop resource uploads.
  }
  return {};
}

export function useDatasetWizardSubmissionActions({
  currentStep,
  optionalContacts = false,
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
  uploadProgressKey,
  selectedProducerRef,
  selectedLicenseRef,
  selectedFrequencyRef,
  selectedKeywordsRef,
  spatialCoverageRef,
  spatialGranularityRef,
  setCreatedDataset,
  setSelectedSpatialZonesValue,
  setDraftContacts,
  setUploadedFiles,
  setResourceUrls,
  setResourceMetadata,
  setShowFileError,
  setIsSubmitting,
  setApiError,
  setErrors,
  resetErrors,
  focusFirstError,
  onDatasetCreated,
  onDraftSaved,
  onNextStep,
  onComplete,
  navigateToStep,
  finishWizard,
  validationMessages,
  restoreErrors,
}: UseDatasetWizardSubmissionActionsParams) {
  const { t } = useTranslation("admin-datasets");
  // Keep the upload result if updating its metadata fails, so retrying never uploads it twice.
  const uploadedResourceIds = useRef(new Map<File, Resource>());

  async function savePendingResources(dataset: Dataset) {
    const recordSaved = (resource: Resource) => {
      setCreatedDataset((previous) =>
        previous
          ? {
              ...previous,
              resources: [
                ...(previous.resources ?? []).filter((item) => item.id !== resource.id),
                resource,
              ],
            }
          : previous
      );
    };
    for (const file of uploadedFiles) {
      const meta = resourceMetadata[`file-${file.name}`];
      let resource = uploadedResourceIds.current.get(file);
      const fileKey = JSON.stringify([file.name, file.size, file.lastModified]);
      if (!resource && uploadProgressKey) {
        const progress = readUploadProgress(uploadProgressKey);
        resource = dataset.resources?.find((item) => item.id === progress[fileKey]);
      }
      if (!resource) {
        resource = await uploadResource(dataset.id, file);
        uploadedResourceIds.current.set(file, resource);
        if (uploadProgressKey) {
          const progress = readUploadProgress(uploadProgressKey);
          progress[fileKey] = resource.id;
          sessionStorage.setItem(uploadProgressKey, JSON.stringify(progress));
        }
      }
      if (meta)
        resource = await updateResource(dataset.id, resource.id, {
          title: meta.title || file.name,
          type: meta.resourceType || "main",
          description: meta.description || undefined,
          format: meta.format || undefined,
          mime: meta.mime || undefined,
          filesize: meta.filesize ? Number(meta.filesize) : undefined,
        });
      recordSaved(resource);
      uploadedResourceIds.current.delete(file);
      setUploadedFiles((previous) => previous.filter((item) => item !== file));
    }
    for (const url of resourceUrls) {
      const meta = resourceMetadata[`url-${url}`];
      const payload = {
        title: meta?.title || url,
        type: meta?.resourceType || "main",
        description: meta?.description || undefined,
        url: url.trim(),
        filetype: "remote",
        format: meta?.format || undefined,
        mime: meta?.mime || undefined,
        filesize: meta?.filesize ? Number(meta.filesize) : undefined,
      };
      const existing = dataset.resources?.find((resource) => resource.url === url.trim());
      const resource = existing
        ? await updateResource(dataset.id, existing.id, payload)
        : await createResource(dataset.id, payload);
      recordSaved(resource);
      setResourceUrls((previous) => previous.filter((item) => item !== url));
    }
  }
  async function handleStep2Next(e?: React.MouseEvent<HTMLButtonElement>, saveAsDraft = false) {
    const { errors, draftErrors } = validateDatasetDetails(
      {
        producer: selectedProducerRef.current,
        title: datasetTitle,
        description: datasetDescription,
        frequency: selectedFrequencyRef.current,
        temporalStart,
        temporalEnd,
        selectedProducer: optionalContacts ? "user" : selectedProducer,
        selectedContactPointIds,
        draftContacts,
      },
      validationMessages
    );

    if (saveAsDraft) {
      delete errors.datasetFrequency;
      delete errors.contactDrafts;
    }

    if (errors.contactDrafts) {
      setDraftContacts((previousDrafts) =>
        previousDrafts.map((draft) =>
          draftErrors[draft.id] ? { ...draft, errors: draftErrors[draft.id] } : draft
        )
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
      if (
        saveAsDraft &&
        (errors.datasetProducer || errors.datasetTitle || errors.datasetDescription)
      ) {
        setApiError(t("publication.draftMinimum"));
      }
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
        frequency: selectedFrequencyRef.current || (saveAsDraft ? "unknown" : ""),
        keywords: selectedKeywordsRef.current,
        contactPointIds: selectedContactPointIds,
        temporalStart,
        temporalEnd,
      });

      payload.extras = getDatasetDraftExtras(createdDataset?.extras, selectedFrequencyRef.current);

      // An empty selection must also clear associations when updating a draft.
      if (optionalContacts) payload.contact_points = selectedContactPointIds;

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
              .filter(Boolean)
          )
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
      if (saveAsDraft) {
        await savePendingResources(dataset);
        onDraftSaved(dataset.id);
      } else if (onDatasetCreated) {
        onDatasetCreated(dataset.id);
      } else {
        navigateToStep(currentStep + 1, dataset.id);
      }
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        setApiError(flattenApiError(err.data));
      } else {
        setApiError(restoreErrors.saveDataset);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateResourceMetadata(key: string, meta: PendingResourceMeta, newUrl?: string) {
    if (newUrl !== undefined && key.startsWith("url-")) {
      const oldUrl = key.slice(4);
      if (oldUrl !== newUrl) {
        setResourceUrls((previousUrls) =>
          previousUrls.map((url) => (url === oldUrl ? newUrl : url))
        );
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

    if (!hasFiles && !hasUrls && !createdDataset?.resources?.length) {
      setShowFileError(true);
      return;
    }

    setShowFileError(false);
    setApiError(null);
    setIsSubmitting(true);

    let dataset = createdDataset;
    if (!dataset) {
      if (!datasetId) {
        setApiError(restoreErrors.missingDataset);
        setIsSubmitting(false);
        return;
      }
      try {
        dataset = await fetchDataset(datasetId);
        setCreatedDataset(dataset);
      } catch {
        setApiError(restoreErrors.loadDataset);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await savePendingResources(dataset);

      onNextStep();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error uploading resources:", error.message, error.stack);
        setApiError(
          restoreErrors.saveResource.replace("{{message}}", translateUploadError(error.message))
        );
      } else {
        const err = error as { status?: number; data?: Record<string, unknown> };
        console.error("Error uploading resources:", err.status, err.data);
        if (err.data && typeof err.data === "object" && Object.keys(err.data).length > 0) {
          const message = (err.data.message as string) || flattenApiError(err.data);
          setApiError(
            restoreErrors.saveResource.replace("{{message}}", translateUploadError(message))
          );
        } else {
          const statusHint = err.status ? ` (${err.status})` : "";
          setApiError(restoreErrors.saveResourceRetry.replace("{{statusHint}}", statusHint));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!createdDataset) return;
    const issues = getDatasetPublicationIssues(createdDataset);
    if (issues.length) {
      setApiError(
        t("publication.incomplete", {
          fields: issues.map((field) => t(`publication.fields.${field}`)).join(", "),
        })
      );
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
      setApiError(restoreErrors.publish);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    await handleStep2Next(undefined, true);
  }

  return {
    updateResourceMetadata,
    handlePublish,
    handleSaveDraft,
    handleStep2Next,
    handleStep3Next,
  };
}
