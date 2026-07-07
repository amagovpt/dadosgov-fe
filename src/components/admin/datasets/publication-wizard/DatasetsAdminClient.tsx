"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, StatusCard, DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";
import { fetchLicenses, fetchFrequencies, fetchGranularities, fetchDataset, fetchMyDatasets, fetchResourceTypes, fetchAllowedExtensions } from "@/service/api/datasets";
import { fetchOrgContactPoints } from "@/service/api/organizations";
import { suggestSpatialZones, suggestTags } from "@/service/api/search";
import { License, Frequency, Granularity, SpatialZone, TagSuggestion, ResourceType } from "@/service/types/catalog";
import { Dataset, ContactPoint } from "@/service/types/dataset";
import AuxiliarList from "@/components/admin/AuxiliarList";
import { getDatasetAuxiliarItems } from "@/components/admin/datasets/config/datasetsAuxiliarItems";
import { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";
import { useAuth } from "@/context/AuthContext";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";
import { getZoneName } from "@/utils/spatialLabels";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { DatasetWizardStep2 } from "./DatasetWizardStep2";
import { DatasetWizardStep3 } from "./DatasetWizardStep3";
import { DatasetWizardStep4 } from "./DatasetWizardStep4";
import type { DatasetWizardDraftContact } from "./datasetWizardTypes";
import { useDatasetWizardContactActions } from "./hooks/useDatasetWizardContactActions";
import { useDatasetWizardSubmissionActions } from "./hooks/useDatasetWizardSubmissionActions";
import { type DatasetFormField } from "./datasetFormModel";

interface DatasetsAdminClientProps {
  currentStep?: number;
  datasetId?: string | null;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
  onDatasetCreated?: (datasetId: string) => void;
  onComplete?: () => void;
}

export default function DatasetsAdminClient({
  currentStep: controlledCurrentStep,
  datasetId,
  onNextStep,
  onPreviousStep,
  onDatasetCreated,
  onComplete,
}: DatasetsAdminClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [internalCurrentStep, setInternalCurrentStep] = useState(0);
  const currentStep = controlledCurrentStep ?? internalCurrentStep;
  const handleNextStep = onNextStep ?? (() => setInternalCurrentStep((step) => step + 1));
  const handlePreviousStep =
    onPreviousStep ?? (() => setInternalCurrentStep((step) => Math.max(0, step - 1)));

  // Form state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFileError, setShowFileError] = useState(false);
  const [datasetTitle, setDatasetTitle] = useState("");
  const [datasetAcronym, setDatasetAcronym] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [datasetShortDescription] = useState("");
  const selectedProducerRef = useRef("");
  const selectedLicenseRef = useRef("");
  const selectedFrequencyRef = useRef("");
  const selectedKeywordsRef = useRef("");
  const spatialCoverageRef = useRef("");
  const spatialGranularityRef = useRef("");
  const [temporalStart, setTemporalStart] = useState("");
  const [temporalEnd, setTemporalEnd] = useState("");
  const { errors: formErrors, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors<DatasetFormField>();
  const [selectedProducer, setSelectedProducer] = useState("");
  const [orgContactPoints, setOrgContactPoints] = useState<ContactPoint[]>([]);
  const [selectedContactPointIds, setSelectedContactPointIds] = useState<string[]>([]);

  const draftIdRef = useRef(0);
  const [draftContacts, setDraftContacts] = useState<DatasetWizardDraftContact[]>([
    { id: 0, name: "", email: "", link: "", saved: false, errors: {} },
  ]);

  // Step 3 state
  const [resourceUrls, setResourceUrls] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [allowedExtensions, setAllowedExtensions] = useState<string[] | null>(null);
  const [resourceMetadata, setResourceMetadata] = useState<Record<string, PendingResourceMeta>>({});

  // API state
  const [createdDataset, setCreatedDataset] = useState<Dataset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [, setHasDatasets] = useState(true);

  // Dropdown data
  const [licenses, setLicenses] = useState<License[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [granularities, setGranularities] = useState<Granularity[]>([]);
  const [spatialZones, setSpatialZones] = useState<SpatialZone[]>([]);
  const [spatialZoneSearch, setSpatialZoneSearch] = useState<SpatialZone[]>([]);
  const spatialZoneSearchRef = useRef<SpatialZone[]>([]);
  const [selectedSpatialZonesValue, setSelectedSpatialZonesValue] = useState<string | null>(null);
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const producerDefaultValue =
    selectedProducer ||
    createdDataset?.organization?.id ||
    (createdDataset ? "user" : "");
  const licenseDefaultValue =
    createdDataset?.license || (licenses.length > 0 ? "notspecified" : "");
  const frequencyDefaultValue = createdDataset?.frequency || "";
  const keywordsDefaultValue =
    selectedKeywordsValue || (createdDataset?.tags?.join(",") ?? "");
  const selectedKeywords = keywordsDefaultValue
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const spatialCoverageDefaultValue =
    selectedSpatialZonesValue ?? (createdDataset?.spatial?.zones?.join(",") ?? "");
  const spatialGranularityDefaultValue = createdDataset?.spatial?.granularity ?? "";
  const handleSpatialCoverageChange = useCallback((value: string) => {
    const normalized = value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .join(",");
    setSelectedSpatialZonesValue(normalized);
    spatialCoverageRef.current = normalized;
    const ids = new Set(normalized.split(",").filter(Boolean));
    setSpatialZones((prev) => {
      // Pin newly selected zones; unpin deselected ones
      const seen = new Set(prev.map((z) => z.id));
      const additions = spatialZoneSearchRef.current.filter(
        (z) => ids.has(z.id) && !seen.has(z.id)
      );
      const kept = prev.filter((z) => ids.has(z.id));
      if (additions.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...additions];
    });
  }, []);

  const producerOptions = useMemo(() => {
    const options = [
      <DropdownOption key="user" value="user" selected={producerDefaultValue === "user"}>
        {user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
      </DropdownOption>,
      ...(user?.organizations || []).map((org) => (
        <DropdownOption key={org.id} value={org.id} selected={producerDefaultValue === org.id}>
          {org.name}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="identity">{options}</DropdownSection>;
  }, [user, producerDefaultValue]);

  const licenseOptions = useMemo(() => {
    const options = licenses.map((license) => (
      <DropdownOption
        key={license.id}
        value={license.id}
        selected={licenseDefaultValue === license.id}
      >
        {license.title}
      </DropdownOption>
    ));
    return <DropdownSection name="licenses">{options}</DropdownSection>;
  }, [licenses, licenseDefaultValue]);

  const frequencyOptions = useMemo(() => {
    const options = frequencies.map((freq) => (
      <DropdownOption key={freq.id} value={freq.id} selected={frequencyDefaultValue === freq.id}>
        {getFrequencyLabel(freq.id, freq.label)}
      </DropdownOption>
    ));
    return <DropdownSection name="frequencies">{options}</DropdownSection>;
  }, [frequencies, frequencyDefaultValue]);

  const tagOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedKeywords.map((k) => k.toLowerCase()));
    const seen = new Set<string>();
    const uniqueTags = [...tags, ...tagSearch].filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = selectedKeywords.filter(
      (keyword) => !seen.has(keyword.toLowerCase())
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tags, ...tagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption key={`__create__${trimmedLower}`} value={trimmed} selected={false}>
              Criar &quot;{trimmed}&quot;
            </DropdownOption>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <DropdownOption key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </DropdownOption>
      )),
      ...uniqueTags.map((tag) => (
        <DropdownOption
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tags, tagSearch, selectedKeywords, keywordSearch]);

  const allSpatialZones = useMemo(() => {
    const seen = new Set<string>();
    const merged: SpatialZone[] = [];
    for (const z of [...spatialZones, ...spatialZoneSearch]) {
      if (!seen.has(z.id)) {
        seen.add(z.id);
        merged.push(z);
      }
    }
    return merged.sort((a, b) => getZoneName(a).localeCompare(getZoneName(b), "pt"));
  }, [spatialZones, spatialZoneSearch]);

  const spatialCoverageOptions = useMemo(() => {
    const selectedIds = new Set(
      (selectedSpatialZonesValue ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    );
    const options = allSpatialZones.map((z) => (
      <DropdownOption key={z.id} value={z.id} selected={selectedIds.has(z.id)}>
        {z.code ? `${getZoneName(z)} (${z.code})` : getZoneName(z)}
      </DropdownOption>
    ));
    if (options.length === 0) {
      options.push(
        <DropdownOption key="empty" value="">
          —
        </DropdownOption>
      );
    }
    return <DropdownSection name="spatial-coverage">{options}</DropdownSection>;
  }, [allSpatialZones, selectedSpatialZonesValue]);

  const selectedZoneObjects = useMemo<SpatialZone[]>(() => {
    const ids = (selectedSpatialZonesValue ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return [];
    const zoneMap = new Map(allSpatialZones.map((z) => [z.id, z]));
    return ids.map((id) => zoneMap.get(id)).filter((z): z is SpatialZone => Boolean(z));
  }, [selectedSpatialZonesValue, allSpatialZones]);

  const granularityOptions = useMemo(() => {
    const options = granularities.map((g) => (
      <DropdownOption key={g.id} value={g.id} selected={spatialGranularityDefaultValue === g.id}>
        {getGranularityLabel(g.id, g.name)}
      </DropdownOption>
    ));
    return <DropdownSection name="spatial-granularity">{options}</DropdownSection>;
  }, [granularities, spatialGranularityDefaultValue]);

  useEffect(() => {
    if (selectedKeywordsValue) return;
    const restored = selectedKeywordsRef.current || (createdDataset?.tags?.join(",") ?? "");
    if (!restored) return;
    setSelectedKeywordsValue(restored);
    selectedKeywordsRef.current = restored;
  }, [createdDataset, selectedKeywordsValue]);

  // Fetch contact points when an organization is selected as producer
  useEffect(() => {
    if (selectedProducer && selectedProducer !== "user") {
      async function loadContactPoints() {
        try {
          const response = await fetchOrgContactPoints(selectedProducer);
          setOrgContactPoints(response.data);
          if (response.data.length > 0) {
            setDraftContacts([]);
          }
        } catch (error) {
          console.error("Error loading contact points:", error);
          setOrgContactPoints([]);
        }
      }
      loadContactPoints();
    }
  }, [selectedProducer]);

  const {
    handleAddDraftContactRow,
    handleSaveContactDraft,
    toggleExistingContact,
    updateDraftContactField,
  } = useDatasetWizardContactActions({
    selectedProducer,
    draftIdRef,
    draftContacts,
    setOrgContactPoints,
    setSelectedContactPointIds,
    setDraftContacts,
  });

  useEffect(() => {
    async function loadDropdownData() {
      try {
        const [
          licensesData,
          frequenciesData,
          granularitiesData,
          myDatasetsData,
          tagsData,
          zonesData,
          resTypes,
          extData,
        ] = await Promise.all([
          fetchLicenses(),
          fetchFrequencies(),
          fetchGranularities(),
          fetchMyDatasets(1, 1),
          suggestTags("", 50),
          suggestSpatialZones("", 20),
          fetchResourceTypes(),
          fetchAllowedExtensions(),
        ]);
        setLicenses(licensesData);
        setFrequencies(frequenciesData);
        setGranularities(granularitiesData);
        setHasDatasets(myDatasetsData.data.length > 0);
        setTags(tagsData);
        spatialZoneSearchRef.current = zonesData;
        setSpatialZoneSearch(zonesData);
        setResourceTypes(resTypes);
        setAllowedExtensions(extData);
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      }
    }
    loadDropdownData();
  }, []);

  useEffect(() => {
    const q = keywordSearch.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await suggestTags(q, 20);
        setTagSearch(res);
      } catch {
        setTagSearch([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordSearch]);

  // Restore dataset from API when datasetId is in the URL
  useEffect(() => {
    if (datasetId && !createdDataset) {
      async function restoreDataset() {
        try {
          const dataset = await fetchDataset(datasetId as string);
          setCreatedDataset(dataset);
          if (dataset.acronym) setDatasetAcronym(dataset.acronym);
        } catch (error) {
          console.error("Error restoring dataset:", error);
          setApiError("Não foi possível recuperar o conjunto de dados. Volte ao passo anterior.");
        }
      }
      restoreDataset();
    }
  }, [datasetId, createdDataset]);

  const clearTemporalCoverageErrors = () => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.temporalCoverage;
      delete next.temporalCoverageInvalidFormat;
      return next;
    });
  };

  const handleProducerFieldChange = useCallback((value: string) => {
    setOrgContactPoints([]);
    setSelectedContactPointIds([]);
    setDraftContacts([{ id: 0, name: "", email: "", link: "", saved: false, errors: {} }]);
    setSelectedProducer(value);
    if (value) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.datasetProducer;
        return next;
      });
    }
  }, [setErrors]);

  const handleSpatialZonesSearchQuery = useCallback((q: string) => {
    if (!q) return;
    suggestSpatialZones(q, 20)
      .then((results) => {
        spatialZoneSearchRef.current = results;
        setSpatialZoneSearch(results);
      })
      .catch(() => {
        spatialZoneSearchRef.current = [];
        setSpatialZoneSearch([]);
      });
  }, []);

  const handleRemoveSpatialZoneTag = useCallback((zoneId: string) => {
    const savedScroll = window.scrollY;
    setSelectedSpatialZonesValue((prev) => {
      const ids = (prev ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const nextIds = ids.filter((id) => id !== zoneId);
      const next = nextIds.join(",");
      spatialCoverageRef.current = next;
      return next || null;
    });
    setSpatialZones((prev) => prev.filter((z) => z.id !== zoneId));
    setTimeout(() => {
      document
        .getElementById("agora-input-select-dataset-spatial-coverage-control")
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: savedScroll, behavior: "instant" });
    }, 50);
  }, []);

  const handleKeywordsSearchInput = useCallback((q: string) => {
    setKeywordSearch(q);
    if (q.trim().length < 2) {
      setTagSearch([]);
    }
  }, []);

  const handleKeywordsSelectValueChange = useCallback(
    (value: string) => {
      setSelectedKeywordsValue(value);
      const selected = value.split(",").filter(Boolean);
      let addedNew = false;
      selected.forEach((v) => {
        const lower = v.toLowerCase();
        const existsInTags = tags.some((t) => t.text.toLowerCase() === lower);
        const existsInSearch = tagSearch.some((t) => t.text.toLowerCase() === lower);
        if (!existsInTags && !existsInSearch) {
          addedNew = true;
          setTags((prev) => {
            if (prev.some((t) => t.text.toLowerCase() === lower)) {
              return prev;
            }
            return [...prev, { text: v }];
          });
        }
      });
      if (addedNew) {
        setKeywordSearch("");
      }
    },
    [tags, tagSearch],
  );

  const handleKeywordTagRemove = useCallback(
    (keyword: string) => {
      const next = selectedKeywords
        .filter((v) => v.toLowerCase() !== keyword.toLowerCase())
        .join(",");
      setSelectedKeywordsValue(next);
      selectedKeywordsRef.current = next;
    },
    [selectedKeywords],
  );

  const {
    updateResourceMetadata,
    handlePublish,
    handleSaveDraft,
    handleStep2Next,
    handleStep3Next,
  } = useDatasetWizardSubmissionActions({
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
    onNextStep: handleNextStep,
    onComplete,
    navigateToStep: (nextStep, nextDatasetId) => {
      router.push(`/admin/datasets/new?step=${nextStep}&datasetId=${nextDatasetId}`);
    },
    finishWizard: () => {
      router.push("/admin/me/datasets");
    },
  });

  const auxiliarItemsStep2 = getDatasetAuxiliarItems({
    title: !!formErrors.datasetTitle || !!formErrors.datasetTitleTooLong,
    description: !!formErrors.datasetDescription,
    frequency: !!formErrors.datasetFrequency,
  });

  const auxiliarItemsStep3 = [
    {
      title: "Escolher o formato certo",
      content: (
        <>
          <p>O formato deve ser:</p>
          <ul className="pl-5 mt-2 flex list-disc flex-col gap-2">
            <li>
              <strong>Aberto:</strong> um formato aberto não adiciona especificações técnicas que
              restrinjam o uso dos dados (por exemplo, o uso de software pago);
            </li>
            <li>
              <strong>Facilmente reutilizável:</strong> um formato facilmente reutilizável implica
              que qualquer pessoa ou servidor pode reutilizar facilmente o conjunto de dados;
            </li>
            <li>
              <strong>Utilizável num sistema de processamento automatizado:</strong> permite
              operações automáticas de processamento de dados (por exemplo, um ficheiro CSV é
              facilmente utilizável por um sistema automatizado, ao contrário de um ficheiro PDF).
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Adicionar documentação",
      content: (
        <>
          <p>
            A descrição de um ficheiro facilita a reutilização de dados. Inclui, entre outras
            coisas:
          </p>
          <ul className="pl-5 mt-2 flex list-disc flex-col gap-2">
            <li>Uma descrição geral do conjunto de dados;</li>
            <li>Uma descrição do método de produção de dados;</li>
            <li>Uma descrição do modelo de dados;</li>
            <li>Uma descrição do esquema de dados;</li>
            <li>Uma descrição dos metadados;</li>
            <li>Uma descrição das principais mudanças.</li>
          </ul>
          <p className="text-red-500 mt-3 font-medium">
            Não adicionou nenhum ficheiro de documentação nem descreveu os seus ficheiros.
          </p>
        </>
      ),
    },
  ];

  const auxiliarItems =
    currentStep === 3 || currentStep === 4 ? auxiliarItemsStep3 : auxiliarItemsStep2;
  return (
    <>
      {/* Main content area: form + auxiliar sidebar */}
      <div className="admin-page__body">
        {/* Left: Form */}
        <div className="admin-page__form-area">
          {apiError && <StatusCard variant="danger" showIcon description={apiError} />}

          {currentStep === 2 && (
            <DatasetWizardStep2
              router={router}
              user={user}
              producerDefaultValue={producerDefaultValue}
              selectedProducerRef={selectedProducerRef}
              onProducerChange={handleProducerFieldChange}
              producerOptions={producerOptions}
              formErrors={formErrors}
              datasetTitle={datasetTitle}
              onDatasetTitleChange={(e) => {
                setDatasetTitle(e.target.value);
                if (e.target.value.trim()) clearError("datasetTitle");
                clearError("datasetTitleTooLong");
              }}
              datasetAcronym={datasetAcronym}
              onDatasetAcronymChange={(e) => setDatasetAcronym(e.target.value)}
              datasetDescription={datasetDescription}
              onDatasetDescriptionChange={(e) => {
                setDatasetDescription(e.target.value);
                if (e.target.value.trim()) clearError("datasetDescription");
              }}
              keywordsDefaultValue={keywordsDefaultValue}
              selectedKeywordsRef={selectedKeywordsRef}
              onKeywordsSearch={handleKeywordsSearchInput}
              onKeywordsValueChange={handleKeywordsSelectValueChange}
              tagOptions={tagOptions}
              selectedKeywords={selectedKeywords}
              onKeywordTagRemove={handleKeywordTagRemove}
              licenseDefaultValue={licenseDefaultValue}
              selectedLicenseRef={selectedLicenseRef}
              licenseOptions={licenseOptions}
              selectedProducer={selectedProducer}
              orgContactPoints={orgContactPoints}
              selectedContactPointIds={selectedContactPointIds}
              onToggleExistingContact={toggleExistingContact}
              draftContacts={draftContacts}
              onDraftFieldChange={updateDraftContactField}
              onSaveContactDraft={handleSaveContactDraft}
              onAddDraftContactRow={handleAddDraftContactRow}
              frequencyDefaultValue={frequencyDefaultValue}
              selectedFrequencyRef={selectedFrequencyRef}
              frequencyOptions={frequencyOptions}
              temporalStart={temporalStart}
              temporalEnd={temporalEnd}
              onTemporalStartChange={(e) => setTemporalStart(e.target.value)}
              onTemporalEndChange={(e) => setTemporalEnd(e.target.value)}
              clearTemporalCoverageErrors={clearTemporalCoverageErrors}
              spatialCoverageDefaultValue={spatialCoverageDefaultValue}
              spatialCoverageRef={spatialCoverageRef}
              onSpatialCoverageChange={handleSpatialCoverageChange}
              onSpatialZoneSearch={handleSpatialZonesSearchQuery}
              spatialCoverageOptions={spatialCoverageOptions}
              selectedZoneObjects={selectedZoneObjects}
              onRemoveSpatialZoneTag={handleRemoveSpatialZoneTag}
              spatialGranularityDefaultValue={spatialGranularityDefaultValue}
              spatialGranularityRef={spatialGranularityRef}
              granularityOptions={granularityOptions}
              onPreviousStep={handlePreviousStep}
              onStep2Next={handleStep2Next}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 3 && (
            <DatasetWizardStep3
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              resourceUrls={resourceUrls}
              setResourceUrls={setResourceUrls}
              showFileError={showFileError}
              setShowFileError={setShowFileError}
              allowedExtensions={allowedExtensions}
              resourceTypes={resourceTypes}
              resourceMetadata={resourceMetadata}
              onEditMeta={updateResourceMetadata}
              onPreviousStep={handlePreviousStep}
              onStep3Next={handleStep3Next}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 4 && (
            <DatasetWizardStep4
              createdDataset={createdDataset}
              datasetTitle={datasetTitle}
              datasetDescription={datasetDescription}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          )}

        </div>

        {/* Right: Auxiliar sidebar */}
        {currentStep !== 4 && (
          <aside className="admin-page__auxiliar">
            <div className="admin-page__auxiliar-inner">
              <div className="admin-page__auxiliar-header">
                <Icon name="agora-line-question-mark" className="h-24 w-24" />
                <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
              </div>
              <AuxiliarList items={auxiliarItems} />
            </div>
          </aside>
        )}
      </div>

    </>
  );
}
