"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import type { Dataset, ContactPoint } from "@/service/types/dataset";
import type { SpatialZone } from "@/service/types/catalog";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";
import { hasMissingDraftFrequency } from "@/utils/datasetPublication";
import { validateDatasetDetails, type DatasetFormField } from "../datasetFormModel";
import type { DatasetWizardDraftContact } from "../datasetWizardTypes";
import type { DatasetWizardLocalState } from "../datasetWizardStorage";

interface UseDatasetWizardFormParams {
  redesigned: boolean;
  initialProducerId?: string;
}

export function useDatasetWizardForm({
  redesigned,
  initialProducerId,
}: UseDatasetWizardFormParams) {
  const { t } = useTranslation("admin-datasets");
  // Form state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFileError, setShowFileError] = useState(false);
  const [datasetTitle, setDatasetTitle] = useState("");
  const [datasetAcronym, setDatasetAcronym] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [datasetShortDescription] = useState("");
  const selectedProducerRef = useRef(initialProducerId ?? "");
  const selectedLicenseRef = useRef("");
  const selectedFrequencyRef = useRef("");
  const selectedKeywordsRef = useRef("");
  const spatialCoverageRef = useRef("");
  const spatialGranularityRef = useRef("");
  const [selectedLicenseValue, setSelectedLicenseValue] = useState<string | null>(null);
  const [selectedFrequencyValue, setSelectedFrequencyValue] = useState<string | null>(null);
  const [selectedGranularityValue, setSelectedGranularityValue] = useState<string | null>(null);
  const [temporalStart, setTemporalStart] = useState("");
  const [temporalEnd, setTemporalEnd] = useState("");
  const {
    errors: formErrors,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
  } = useFormErrors<DatasetFormField>();
  const [selectedProducer, setSelectedProducer] = useState(initialProducerId ?? "");
  const [orgContactPoints, setOrgContactPoints] = useState<ContactPoint[]>([]);
  const [selectedContactPointIds, setSelectedContactPointIds] = useState<string[]>([]);

  const draftIdRef = useRef(0);
  const [draftContacts, setDraftContacts] = useState<DatasetWizardDraftContact[]>(
    redesigned ? [] : [{ id: 0, name: "", email: "", link: "", saved: false, errors: {} }]
  );

  // Step 3 state
  const [resourceUrls, setResourceUrls] = useState<string[]>([]);
  const [resourceMetadata, setResourceMetadata] = useState<Record<string, PendingResourceMeta>>({});

  // API state
  const [createdDataset, setCreatedDataset] = useState<Dataset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [spatialZones, setSpatialZones] = useState<SpatialZone[]>([]);
  const [selectedSpatialZonesValue, setSelectedSpatialZonesValue] = useState<string | null>(null);
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState<string | null>(null);
  const frequencyDefaultValue = selectedFrequencyValue ?? createdDataset?.frequency ?? "";
  const keywordsDefaultValue = selectedKeywordsValue ?? createdDataset?.tags?.join(",") ?? "";
  const selectedKeywords = keywordsDefaultValue
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const spatialCoverageDefaultValue =
    selectedSpatialZonesValue ?? createdDataset?.spatial?.zones?.join(",") ?? "";
  const spatialGranularityDefaultValue =
    selectedGranularityValue ?? createdDataset?.spatial?.granularity ?? "";

  const clearTemporalCoverageErrors = () => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.temporalCoverage;
      delete next.temporalCoverageInvalidFormat;
      return next;
    });
  };

  const handleProducerFieldChange = useCallback(
    (value: string) => {
      if (value === selectedProducer) return;
      setOrgContactPoints([]);
      setSelectedContactPointIds([]);
      setDraftContacts(
        redesigned ? [] : [{ id: 0, name: "", email: "", link: "", saved: false, errors: {} }]
      );
      setSelectedProducer(value);
      if (value) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.datasetProducer;
          return next;
        });
      }
    },
    [setErrors, redesigned, selectedProducer]
  );

  const restoreForm = useCallback(
    ({
      dataset,
      local,
      files,
      zones,
    }: {
      dataset: Dataset | null;
      local: DatasetWizardLocalState | null;
      files: File[];
      zones: SpatialZone[];
    }) => {
      if (dataset) setCreatedDataset(dataset);
      setDatasetTitle(local?.title ?? dataset?.title ?? "");
      setDatasetAcronym(local?.acronym ?? dataset?.acronym ?? "");
      setDatasetDescription(local?.description ?? dataset?.description ?? "");
      const producer =
        local?.producer ??
        dataset?.organization?.id ??
        (dataset ? "user" : (initialProducerId ?? ""));
      setSelectedProducer(producer);
      selectedProducerRef.current = producer;
      const license = local?.license ?? dataset?.license ?? null;
      setSelectedLicenseValue(license);
      selectedLicenseRef.current = license ?? "";
      const frequency =
        local?.frequency ??
        (dataset && !hasMissingDraftFrequency(dataset) ? dataset.frequency : "") ??
        "";
      setSelectedFrequencyValue(frequency);
      selectedFrequencyRef.current = frequency;
      const keywords = local?.keywords ?? dataset?.tags?.join(",") ?? "";
      setSelectedKeywordsValue(keywords);
      selectedKeywordsRef.current = keywords;
      setTemporalStart(
        local?.temporalStart ?? dataset?.temporal_coverage?.start?.slice(0, 10) ?? ""
      );
      setTemporalEnd(local?.temporalEnd ?? dataset?.temporal_coverage?.end?.slice(0, 10) ?? "");
      setSelectedContactPointIds(
        local?.contactPointIds ?? dataset?.contact_points?.map((contact) => contact.id) ?? []
      );
      const coverage = local?.spatialCoverage ?? dataset?.spatial?.zones?.join(",") ?? "";
      setSelectedSpatialZonesValue(coverage);
      spatialCoverageRef.current = coverage;
      const granularity = local?.spatialGranularity ?? dataset?.spatial?.granularity ?? "";
      setSelectedGranularityValue(granularity);
      spatialGranularityRef.current = granularity;
      setSpatialZones(zones);
      setResourceUrls(local?.resourceUrls ?? []);
      setResourceMetadata(local?.resourceMetadata ?? {});
      setUploadedFiles(files);
    },
    [initialProducerId]
  );
  const localState = useMemo<DatasetWizardLocalState>(
    () => ({
      datasetId: createdDataset?.id ?? null,
      title: datasetTitle,
      acronym: datasetAcronym,
      description: datasetDescription,
      producer: selectedProducer,
      keywords: keywordsDefaultValue,
      license: selectedLicenseValue ?? createdDataset?.license ?? "",
      frequency: frequencyDefaultValue,
      temporalStart,
      temporalEnd,
      spatialCoverage: spatialCoverageDefaultValue,
      spatialGranularity: spatialGranularityDefaultValue,
      contactPointIds: selectedContactPointIds,
      spatialZones,
      resourceUrls,
      resourceMetadata,
      fileNames: uploadedFiles.map((file) => file.name),
    }),
    [
      createdDataset?.id,
      datasetTitle,
      datasetAcronym,
      datasetDescription,
      selectedProducer,
      keywordsDefaultValue,
      selectedLicenseValue,
      createdDataset?.license,
      frequencyDefaultValue,
      temporalStart,
      temporalEnd,
      spatialCoverageDefaultValue,
      spatialGranularityDefaultValue,
      selectedContactPointIds,
      spatialZones,
      resourceUrls,
      resourceMetadata,
      uploadedFiles,
    ]
  );

  const handleIdentityNext = (onNextStep: () => void) => {
    const { errors } = validateDatasetDetails(
      {
        producer: selectedProducerRef.current,
        title: datasetTitle,
        description: datasetDescription,
        frequency: "unknown",
        temporalStart: "",
        temporalEnd: "",
        selectedProducer: "user",
        selectedContactPointIds: [],
        draftContacts: [],
      },
      {
        producerRequired: t("admin-datasets:form.fieldRequired"),
        titleRequired: t("admin-datasets:form.fieldRequired"),
        titleTooLong: t("admin-datasets:form.titleTooLong"),
        descriptionRequired: t("admin-datasets:form.fieldRequired"),
        frequencyRequired: "",
        invalidDate: "",
        invalidRange: "",
        contactDraftRequired: "",
      }
    );
    if (Object.keys(errors).length) {
      setErrors(errors);
      focusFirstError();
      return;
    }
    resetErrors();
    setApiError(null);
    onNextStep();
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    showFileError,
    setShowFileError,
    datasetTitle,
    setDatasetTitle,
    datasetAcronym,
    setDatasetAcronym,
    datasetDescription,
    setDatasetDescription,
    datasetShortDescription,
    selectedProducerRef,
    selectedLicenseRef,
    selectedFrequencyRef,
    selectedKeywordsRef,
    spatialCoverageRef,
    spatialGranularityRef,
    selectedLicenseValue,
    setSelectedLicenseValue,
    selectedFrequencyValue,
    setSelectedFrequencyValue,
    selectedGranularityValue,
    setSelectedGranularityValue,
    temporalStart,
    setTemporalStart,
    temporalEnd,
    setTemporalEnd,
    selectedProducer,
    setSelectedProducer,
    orgContactPoints,
    setOrgContactPoints,
    selectedContactPointIds,
    setSelectedContactPointIds,
    draftIdRef,
    draftContacts,
    setDraftContacts,
    resourceUrls,
    setResourceUrls,
    resourceMetadata,
    setResourceMetadata,
    createdDataset,
    setCreatedDataset,
    isSubmitting,
    setIsSubmitting,
    apiError,
    setApiError,
    spatialZones,
    setSpatialZones,
    selectedSpatialZonesValue,
    setSelectedSpatialZonesValue,
    selectedKeywordsValue,
    setSelectedKeywordsValue,
    formErrors,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
    frequencyDefaultValue,
    keywordsDefaultValue,
    selectedKeywords,
    spatialCoverageDefaultValue,
    spatialGranularityDefaultValue,
    clearTemporalCoverageErrors,
    handleProducerFieldChange,
    handleIdentityNext,
    restoreForm,
    localState,
  };
}

export type DatasetWizardForm = ReturnType<typeof useDatasetWizardForm>;
