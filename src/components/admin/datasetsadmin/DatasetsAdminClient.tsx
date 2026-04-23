"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Button,
  CardGeneral,
  InputText,
  InputTextArea,
  Icon,
  StatusCard,
  InputDate,
  DropdownSection,
  DropdownOption,
  ProgressBar,
  Checkbox,
  Tag,
} from "@ama-pt/agora-design-system";
import {
  createDataset,
  updateDataset,
  uploadResource,
  updateResource,
  createResource,
  fetchLicenses,
  fetchFrequencies,
  fetchGranularities,
  suggestSpatialZones,
  fetchDataset,
  fetchMyDatasets,
  suggestTags,
  fetchOrgContactPoints,
  createContactPoint,
  fetchResourceTypes,
} from "@/services/api";
import {
  License,
  Frequency,
  Granularity,
  SpatialZone,
  Dataset,
  TagSuggestion,
  ContactPoint,
  ResourceType,
} from "@/types/api";
import AuxiliarList from "@/components/admin/AuxiliarList";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import FileUploadModal, { PendingResourceMeta } from "@/components/admin/FileUploadModal";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { useAuth } from "@/context/AuthContext";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";

interface DatasetsAdminClientProps {
  currentStep: number;
  datasetId?: string | null;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onDatasetCreated?: (datasetId: string) => void;
  onComplete?: () => void;
}

export default function DatasetsAdminClient({
  currentStep,
  datasetId,
  onNextStep,
  onPreviousStep,
  onDatasetCreated,
  onComplete,
}: DatasetsAdminClientProps) {
  const isValidHttpsUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") return false;
      if (!parsed.hostname) return false;

      const hostname = parsed.hostname.toLowerCase();
      const isIpv4 =
        /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(
          hostname,
        );

      const labels = hostname.split(".");
      const hasValidDomainShape = labels.length >= 2;
      const hasValidLabels = labels.every(
        (label) =>
          label.length > 0 &&
          !label.startsWith("-") &&
          !label.endsWith("-") &&
          /^[a-z0-9-]+$/i.test(label),
      );
      const tld = labels[labels.length - 1] || "";
      const hasValidTld = /^([a-z]{2,}|xn--[a-z0-9-]{2,})$/i.test(tld);

      return isIpv4 || (hasValidDomainShape && hasValidLabels && hasValidTld);
    } catch {
      return false;
    }
  };

  const router = useRouter();
  const { user } = useAuth();

  // Form state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFileError, setShowFileError] = useState(false);
  const [showInvalidUrlError, setShowInvalidUrlError] = useState(false);
  const [datasetTitle, setDatasetTitle] = useState("");
  const [datasetAcronym, setDatasetAcronym] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [datasetShortDescription, setDatasetShortDescription] = useState("");
  const selectedProducerRef = useRef("");
  const selectedLicenseRef = useRef("");
  const selectedFrequencyRef = useRef("");
  const selectedKeywordsRef = useRef("");
  const spatialCoverageRef = useRef("");
  const spatialGranularityRef = useRef("");
  const [temporalStart, setTemporalStart] = useState("");
  const [temporalEnd, setTemporalEnd] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [selectedProducer, setSelectedProducer] = useState("");
  const [orgContactPoints, setOrgContactPoints] = useState<ContactPoint[]>([]);
  const [selectedContactPointIds, setSelectedContactPointIds] = useState<string[]>([]);

  interface DraftContact {
    id: number;
    name: string;
    email: string;
    link: string;
    saved: boolean;
    errors: Record<string, boolean>;
  }
  const draftIdRef = useRef(0);
  const [draftContacts, setDraftContacts] = useState<DraftContact[]>([
    { id: 0, name: "", email: "", link: "", saved: false, errors: {} },
  ]);

  // Step 3 state
  const [resourceUrls, setResourceUrls] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [resourceMetadata, setResourceMetadata] = useState<Record<string, PendingResourceMeta>>({});

  // API state
  const [createdDataset, setCreatedDataset] = useState<Dataset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Dropdown data
  const [licenses, setLicenses] = useState<License[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [granularities, setGranularities] = useState<Granularity[]>([]);
  const [spatialZones, setSpatialZones] = useState<SpatialZone[]>([]);
  const [spatialZoneSearch, setSpatialZoneSearch] = useState<SpatialZone[]>([]);
  const [selectedSpatialZonesValue, setSelectedSpatialZonesValue] = useState("");
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const producerDefaultValue =
    selectedProducer ||
    selectedProducerRef.current ||
    createdDataset?.organization?.id ||
    (createdDataset ? "user" : "");
  const licenseDefaultValue =
    selectedLicenseRef.current || createdDataset?.license || "";
  const frequencyDefaultValue =
    selectedFrequencyRef.current || createdDataset?.frequency || "";
  const keywordsDefaultValue =
    selectedKeywordsValue ||
    selectedKeywordsRef.current ||
    (createdDataset?.tags?.join(",") ?? "");
  const selectedKeywords = keywordsDefaultValue
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const spatialCoverageDefaultValue = spatialCoverageRef.current;
  const spatialGranularityDefaultValue = spatialGranularityRef.current;
  const selectedSpatialZoneIds = selectedSpatialZonesValue.split(",").filter(Boolean);
  const handleSpatialCoverageChange = useCallback((value: string) => {
    setSelectedSpatialZonesValue(value);
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
      <DropdownOption
        key={freq.id}
        value={freq.id}
        selected={frequencyDefaultValue === freq.id}
      >
        {getFrequencyLabel(freq.id, freq.label)}
      </DropdownOption>
    ));
    return <DropdownSection name="frequencies">{options}</DropdownSection>;
  }, [frequencies, frequencyDefaultValue]);

  const tagOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Deduplicate tags by lowercased text (keeps the first occurrence).
    const seen = new Set<string>();
    const uniqueTags = tags.filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const selectedLowerSet = new Set(
      selectedKeywords.map((k) => k.toLowerCase()),
    );
    const selectedNotInSuggestions = selectedKeywords.filter(
      (keyword) => !seen.has(keyword.toLowerCase()),
    );
    const showCreate = trimmed.length > 0 && !seen.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption
              key={`__create__${trimmedLower}`}
              value={trimmed}
              selected={false}
            >
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
  }, [tags, selectedKeywords, keywordSearch]);

  const allSpatialZones = useMemo(() => {
    const seen = new Set<string>();
    const merged: SpatialZone[] = [];
    for (const z of [...spatialZones, ...spatialZoneSearch]) {
      if (!seen.has(z.id)) {
        seen.add(z.id);
        merged.push(z);
      }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [spatialZones, spatialZoneSearch]);

  const spatialCoverageOptions = useMemo(() => {
    const options = allSpatialZones.map((z) => (
      <DropdownOption key={z.id} value={z.id} selected={false}>
        {z.code ? `${z.name} (${z.code})` : z.name}
      </DropdownOption>
    ));
    if (options.length === 0) {
      options.push(<DropdownOption key="empty" value="">—</DropdownOption>);
    }
    return <DropdownSection name="spatial-coverage">{options}</DropdownSection>;
  }, [allSpatialZones]);

  const [selectedZoneObjects, setSelectedZoneObjects] = useState<SpatialZone[]>([]);
  useEffect(() => {
    const ids = selectedSpatialZonesValue.split(",").filter(Boolean);
    if (ids.length === 0) {
      setSelectedZoneObjects([]);
      return;
    }
    setSelectedZoneObjects((prev) => {
      const map = new Map(prev.map((z) => [z.id, z]));
      allSpatialZones.forEach((z) => {
        if (!map.has(z.id)) map.set(z.id, z);
      });
      return ids.map((id) => map.get(id)).filter(Boolean) as SpatialZone[];
    });
  }, [selectedSpatialZonesValue, allSpatialZones]);

  const granularityOptions = useMemo(() => {
    const options = granularities.map((g) => (
      <DropdownOption
        key={g.id}
        value={g.id}
        selected={spatialGranularityDefaultValue === g.id}
      >
        {getGranularityLabel(g.id, g.name)}
      </DropdownOption>
    ));
    return <DropdownSection name="spatial-granularity">{options}</DropdownSection>;
  }, [granularities, spatialGranularityDefaultValue]);


  useEffect(() => {
    if (selectedKeywordsValue) return;
    const restored =
      selectedKeywordsRef.current || (createdDataset?.tags?.join(",") ?? "");
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
    } else {
      setOrgContactPoints([]);
      setSelectedContactPointIds([]);
      setDraftContacts([{ id: 0, name: "", email: "", link: "", saved: false, errors: {} }]);
    }
  }, [selectedProducer]);

  const toggleExistingContact = (id: string) => {
    setSelectedContactPointIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const updateDraft = (draftId: number, field: string, value: string) => {
    setDraftContacts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, [field]: value, errors: { ...d.errors, [field]: false } }
          : d,
      ),
    );
  };

  const handleSaveContactDraft = async (draftId: number) => {
    const draft = draftContacts.find((d) => d.id === draftId);
    if (!draft) return;

    const errors: Record<string, boolean> = {};
    if (!draft.name.trim()) errors.name = true;
    if (!draft.email.trim() && !draft.link.trim()) {
      errors.email = true;
      errors.link = true;
    }
    if (Object.keys(errors).length > 0) {
      setDraftContacts((prev) =>
        prev.map((d) => (d.id === draftId ? { ...d, errors } : d)),
      );
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const payload: Parameters<typeof createContactPoint>[0] = {
        name: draft.name.trim(),
        role: "contact",
        organization: selectedProducer,
      };
      if (draft.email.trim()) payload.email = draft.email.trim();
      if (draft.link.trim()) payload.contact_form = draft.link.trim();
      const newContact = await createContactPoint(payload);
      setOrgContactPoints((prev) => [...prev, newContact]);
      setSelectedContactPointIds((prev) => [...prev, newContact.id]);
      setDraftContacts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Error creating contact point:", error);
    }
  };

  const handleAddNewDraft = async (saveDraftId: number) => {
    const draft = draftContacts.find((d) => d.id === saveDraftId);
    if (!draft) return;

    // Validate before saving
    const errors: Record<string, boolean> = {};
    if (!draft.name.trim()) errors.name = true;
    if (!draft.email.trim() && !draft.link.trim()) {
      errors.email = true;
      errors.link = true;
    }
    if (Object.keys(errors).length > 0) {
      setDraftContacts((prev) =>
        prev.map((d) => (d.id === saveDraftId ? { ...d, errors } : d)),
      );
      return;
    }

    await handleSaveContactDraft(saveDraftId);
    draftIdRef.current += 1;
    setDraftContacts((prev) => [
      ...prev,
      {
        id: draftIdRef.current,
        name: "",
        email: "",
        link: "",
        saved: false,
        errors: {},
      },
    ]);
  };

  // Whether user has existing datasets
  const [hasDatasets, setHasDatasets] = useState(true);

  useEffect(() => {
    async function loadDropdownData() {
      try {
        const [licensesData, frequenciesData, granularitiesData, myDatasetsData, tagsData, resTypes] =
          await Promise.all([
            fetchLicenses(),
            fetchFrequencies(),
            fetchGranularities(),
            fetchMyDatasets(1, 1),
            suggestTags("", 50),
            fetchResourceTypes(),
          ]);
        setLicenses(licensesData);
        setFrequencies(frequenciesData);
        setGranularities(granularitiesData);
        setHasDatasets(myDatasetsData.data.length > 0);
        setTags(tagsData);
        setResourceTypes(resTypes);
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      }
    }
    loadDropdownData();
  }, []);

  // Restore dataset from API when datasetId is in the URL
  useEffect(() => {
    if (datasetId && !createdDataset) {
      async function restoreDataset() {
        try {
          const dataset = await fetchDataset(datasetId as string);
          setCreatedDataset(dataset);
        } catch (error) {
          console.error("Error restoring dataset:", error);
          setApiError("Não foi possível recuperar o conjunto de dados. Volte ao passo anterior.");
        }
      }
      restoreDataset();
    }
  }, [datasetId, createdDataset]);

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const clearTemporalCoverageErrors = () => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.temporalCoverage;
      delete next.temporalCoverageInvalidFormat;
      return next;
    });
  };

  const parseInputDateToTime = (value: string): number | null => {
    const raw = (value || "").trim();
    if (!raw) return null;

    // Supports "dd/mm/yyyy" and "dd-mm-yyyy"
    const ptMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (ptMatch) {
      const day = Number(ptMatch[1]);
      const month = Number(ptMatch[2]);
      const year = Number(ptMatch[3]);
      const d = new Date(year, month - 1, day);
      if (
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {
        return d.getTime();
      }
      return null;
    }

    // Supports ISO-like formats (e.g. yyyy-mm-dd)
    const iso = new Date(raw);
    const isoTime = iso.getTime();
    return Number.isNaN(isoTime) ? null : isoTime;
  };

  const handleStep2Next = async (
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const errors: Record<string, boolean> = {};
    if (!selectedProducerRef.current) errors.datasetProducer = true;
    if (!datasetTitle.trim()) errors.datasetTitle = true;
    if (!datasetDescription.trim()) errors.datasetDescription = true;
    if (!selectedFrequencyRef.current) errors.datasetFrequency = true;
    const startRaw = (temporalStart || "").trim();
    const endRaw = (temporalEnd || "").trim();
    const startTime = startRaw ? parseInputDateToTime(startRaw) : null;
    const endTime = endRaw ? parseInputDateToTime(endRaw) : null;

    if ((startRaw && startTime === null) || (endRaw && endTime === null)) {
      errors.temporalCoverageInvalidFormat = true;
    }
    if (
      !errors.temporalCoverageInvalidFormat &&
      startTime !== null &&
      endTime !== null &&
      startTime > endTime
    ) {
      errors.temporalCoverage = true;
    }

    // Validate contact point fields.
    // At least one valid contact (saved or draft with name + email/link) is required.
    const hasSavedContact = selectedContactPointIds.length > 0;
    const draftErrorsMap: Record<number, Record<string, boolean>> = {};
    let hasValidDraft = false;

    draftContacts.forEach((draft) => {
      const draftErrors: Record<string, boolean> = {};
      if (!draft.name.trim()) draftErrors.name = true;
      if (!draft.email.trim() && !draft.link.trim()) {
        draftErrors.email = true;
        draftErrors.link = true;
      }
      if (Object.keys(draftErrors).length === 0) {
        hasValidDraft = true;
      } else {
        draftErrorsMap[draft.id] = draftErrors;
      }
    });

    if (!hasSavedContact && !hasValidDraft) {
      setDraftContacts((prev) =>
        prev.map((d) =>
          draftErrorsMap[d.id] ? { ...d, errors: draftErrorsMap[d.id] } : d,
        ),
      );
      errors.contactDrafts = true;
    }

    if (
      (errors.temporalCoverage ||
        errors.temporalCoverageInvalidFormat) &&
      Object.keys(errors).length === 1
    ) {
      e?.preventDefault();
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload: Parameters<typeof createDataset>[0] = {
        title: datasetTitle.trim(),
        description: datasetDescription.trim(),
        frequency: selectedFrequencyRef.current,
        private: true,
      };
      if (datasetAcronym.trim()) payload.acronym = datasetAcronym.trim();
      if (datasetShortDescription.trim()) {
        payload.description_short = datasetShortDescription.trim();
      } else {
        const desc = datasetDescription.trim();
        payload.description_short =
          desc.length > 197 ? desc.slice(0, 197) + "..." : desc;
      }
      if (selectedProducerRef.current && selectedProducerRef.current !== "user") {
        payload.organization = selectedProducerRef.current;
      }
      if (selectedLicenseRef.current) payload.license = selectedLicenseRef.current;
      if (selectedKeywordsRef.current) {
        payload.tags = selectedKeywordsRef.current.split(",").filter(Boolean);
      }
      if (selectedContactPointIds.length > 0) {
        payload.contact_points = selectedContactPointIds;
      }
      if (startRaw || endRaw) {
        payload.temporal_coverage = {
          ...(startRaw ? { start: startRaw } : {}),
          ...(endRaw ? { end: endRaw } : {}),
        };
      }

      const dataset = await createDataset(payload);
      setCreatedDataset(dataset);
      if (onDatasetCreated) {
        onDatasetCreated(dataset.id);
      } else {
        router.push(
          `/pages/admin/datasets/new?step=${currentStep + 1}&datasetId=${dataset.id}`,
        );
      }
    } catch (error: unknown) {
      const err = error as { status?: number; data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const flattenValue = (val: unknown): string => {
          if (Array.isArray(val)) return val.map(flattenValue).join("; ");
          if (val && typeof val === "object") return Object.values(val as Record<string, unknown>).map(flattenValue).join("; ");
          return String(val);
        };
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${flattenValue(val)}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao criar o conjunto de dados. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMeta = (key: string, meta: PendingResourceMeta, newUrl?: string) => {
    if (newUrl !== undefined && key.startsWith("url-")) {
      const oldUrl = key.slice(4);
      if (oldUrl !== newUrl) {
        setResourceUrls((prev) => prev.map((u) => (u === oldUrl ? newUrl : u)));
        setResourceMetadata((prev) => {
          const updated = { ...prev, [`url-${newUrl}`]: meta };
          delete updated[key];
          return updated;
        });
        return;
      }
    }
    setResourceMetadata((prev) => ({ ...prev, [key]: meta }));
  };

  const handleStep3Next = async () => {
    const trimmedUrls = resourceUrls.map((u) => u.trim()).filter(Boolean);
    const hasFiles = uploadedFiles.length > 0;
    const hasUrls = trimmedUrls.length > 0;
    const invalidUrl = trimmedUrls.find((u) => !isValidHttpsUrl(u));

    if (!hasFiles && !hasUrls) {
      setShowFileError(true);
      setShowInvalidUrlError(false);
      return;
    }

    if (invalidUrl) {
      setShowInvalidUrlError(true);
      setShowFileError(false);
      return;
    }
    if (!createdDataset) {
      setApiError("Erro: o conjunto de dados não foi criado. Volte ao passo anterior e preencha o formulário.");
      return;
    }

    setApiError(null);
    setIsSubmitting(true);
    try {
      if (hasFiles) {
        for (const file of uploadedFiles) {
          const meta = resourceMetadata[`file-${file.name}`];
          const resource = await uploadResource(createdDataset.id, file);
          if (meta) {
            await updateResource(createdDataset.id, resource.id, {
              title: meta.title || file.name,
              type: meta.resourceType || "main",
              description: meta.description || undefined,
            });
          }
        }
      }
      for (const url of trimmedUrls) {
        const meta = resourceMetadata[`url-${url}`];
        await createResource(createdDataset.id, {
          title: meta?.title || url,
          type: meta?.resourceType || "main",
          description: meta?.description || undefined,
          url,
          filetype: "remote",
          format: "",
        });
      }
      onNextStep();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error uploading resources:", error.message, error.stack);
        setApiError(`Erro ao carregar ficheiro: ${error.message}`);
      } else {
        const err = error as { status?: number; data?: Record<string, unknown> };
        console.error("Error uploading resources:", err.status, err.data);
        if (err.data && typeof err.data === "object" && Object.keys(err.data).length > 0) {
          const msg =
            (err.data.message as string) ||
            Object.entries(err.data)
              .map(([key, val]) => `${key}: ${val}`)
              .join(", ");
          setApiError(`Erro ao carregar ficheiro: ${msg}`);
        } else {
          const statusHint = err.status ? ` (${err.status})` : "";
          setApiError(`Erro ao carregar ficheiro${statusHint}. Tente novamente.`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!createdDataset) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      await updateDataset(createdDataset.id, { private: false });
      if (onComplete) onComplete();
      else router.push("/pages/admin/me/datasets");
    } catch (error) {
      console.error("Error publishing dataset:", error);
      setApiError("Erro ao publicar o conjunto de dados. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (onComplete) onComplete();
    else router.push("/pages/admin/me/datasets");
  };

  const auxiliarItemsStep2 = [
    {
      title: "Dar um título",
      content: (
        <>
          <p>
            O título do seu conjunto de dados deve ser o mais preciso e específico possível.
          </p>
          <p>
            Deve também corresponder ao vocabulário utilizado pelos utilizadores que, na maioria
            das vezes, procuram dados através de um motor de pesquisa.
          </p>
        </>
      ),
      hasError: !!formErrors.datasetTitle,
    },
    {
      title: "Adicionar uma sigla",
      content: (
        <p>
          Tem a opção de adicionar uma sigla ao seu conjunto de dados. As letras que compõem a
          sigla não precisam de ser separadas por pontos.
        </p>
      ),
    },
    {
      title: "Descrever os dados",
      content: (
        <>
          <p>
            A descrição do seu conjunto de dados permite que os utilizadores obtenham informações sobre
            o conteúdo e a estrutura dos recursos publicados; pode, em particular, fornecer
            informações como:
          </p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
            <li>A lista de ficheiros disponibilizados;</li>
            <li>Descrição do formato do ficheiro;</li>
            <li>A frequência de atualização.</li>
          </ul>
          <ul className="list-disc pl-5 mt-4 flex flex-col gap-2">
            <li>As motivações para a criação do conjunto de dados;</li>
            <li>A composição do conjunto de dados;</li>
            <li>O processo de coleta de dados;</li>
            <li>Pré-processamento de dados;</li>
            <li>A distribuição do conjunto de dados;</li>
            <li>Manutenção de conjuntos de dados;</li>
            <li>Considerações legais e éticas.</li>
          </ul>
        </>
      ),
      hasError: !!formErrors.datasetDescription,
    },
    {
      title: "Incluir uma descrição breve",
      content: (
        <>
          <p>
            A descrição resumida apresenta o seu conjunto de dados numa ou duas frases. Facilita a
            compreensão imediata do conteúdo pelos utilizadores e aumenta a sua visibilidade nos
            resultados de pesquisa.
          </p>
          <p className="font-bold mt-3">Sugestões automáticas</p>
          <p className="mt-2">
            Uma primeira versão pode ser gerada automaticamente se já tiver preenchido o título
            e uma descrição de pelo menos 200 caracteres, sendo então adaptada de acordo com as suas
            necessidades.
          </p>
          <p className="mt-3">
            <a href="#" className="text-primary-600 underline">
              A IA baseia-se exclusivamente nas informações que forneceu e, por vezes, pode
              cometer erros: releia sempre a proposta antes de validar.
            </a>
          </p>
        </>
      ),
    },
    {
      title: "Adicionar palavras-chave",
      content: (
        <>
          <p>
            As palavras-chave ajudam a caracterizar o conjunto de dados, tornam-no mais fácil de
            encontrar e contribuem para um melhor posicionamento nos motores de busca.
          </p>
          <p className="font-bold mt-3">Sugestões automáticas</p>
          <p className="mt-2">
            Com base no conteúdo do seu conjunto de dados, podem ser sugeridas palavras-chave
            automaticamente. Pode aceitá-las, modificá-las ou excluí-las.
          </p>
          <p className="mt-3">
            <a href="#" className="text-primary-600 underline">
              A IA baseia-se exclusivamente nas informações que forneceu e, por vezes, pode
              cometer erros: releia sempre a proposta antes de validar.
            </a>
          </p>
        </>
      ),
    },
    {
      title: "Selecionar uma licença",
      content: (
        <p>
          As licenças definem as regras para a reutilização. Ao escolher uma licença de
          reutilização, garante que o conjunto de dados publicado será reutilizado de acordo com os
          termos de uso que definiu.
        </p>
      ),
    },
    {
      title: "Escolher a frequência de atualização",
      content: (
        <p>
          A frequência de atualização refere-se à frequência com que pretende atualizar os dados
          publicados.
        </p>
      ),
      hasError: !!formErrors.datasetFrequency,
    },
    {
      title: "Fornecer a cobertura temporal",
      content: (
        <>
          <p>A abrangência temporal indica o período de tempo dos dados publicados.</p>
          <p>Por exemplo: de 2012 a 2015.</p>
        </>
      ),
    },
    {
      title: "Indicar a granularidade espacial",
      content: (
        <>
          <p>
            A granularidade espacial representa o grau de detalhe geográfico presente nos seus
            dados, como, por exemplo, freguesia ou município.
          </p>
        </>
      ),
    },
  ];

  const auxiliarItemsStep3 = [
    {
      title: "Escolher o formato certo",
      content: (
        <>
          <p>O formato deve ser:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
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
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
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
  const hasTemporalCoverageError =
    !!formErrors.temporalCoverage ||
    !!formErrors.temporalCoverageInvalidFormat;
  const temporalCoverageErrorText = formErrors.temporalCoverageInvalidFormat
    ? "Formato de data inválido. Utilize o formato dd/mm/aaaa."
    : "A data de início não pode ser posterior à data de fim.";

  return (
    <>
      {/* Main content area: form + auxiliar sidebar */}
      <div className="admin-page__body">
        {/* Left: Form */}
        <div className="admin-page__form-area">
          {apiError && (
            <StatusCard type="danger" description={apiError} />
          )}

          {/* Step 2: Descreva o conjunto de dados */}
          {currentStep === 2 && (
            <>
              <StatusCard
                type="info"
                description={
                  <>
                    <strong>O que é um conjunto de dados?</strong>
                    <br />
                    Em dados.gov.pt, um conjunto de dados é um conjunto de ficheiros.
                  </>
                }
              />
              <p className="text-neutral-900 text-base leading-7 pt-32">
                Os campos marcados com um asterisco ( * ) são obrigatórios.
              </p>
              <h2 className="admin-page__section-title">Produtor</h2>

              <div className="admin-page__fields-group">
                <span className="text-primary-900 text-base font-medium leading-7">
                  Confirme a identidade que pretende utilizar na publicação.
                </span>
                <IsolatedSelect
                  label="Produtor*"
                  placeholder="Selecione o produtor..."
                  id="dataset-producer"
                  onChangeRef={selectedProducerRef}
                  onChangeCallback={(value) => {
                    setSelectedProducer(value);
                    if (value) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.datasetProducer;
                        return next;
                      });
                    }
                  }}
                  hasError={!!formErrors.datasetProducer}
                  errorFeedbackText="Campo obrigatório"
                >
                  {producerOptions}
                </IsolatedSelect>
              </div>

              {(!user?.organizations || user.organizations.length === 0) && (
                <div className="admin-page__org-card flex flex-col items-center gap-[16px] bg-neutral-50 rounded-lg p-8 text-center mt-[24px]">
                  <h3 className="text-primary-900 text-lg font-bold leading-7">
                    Não pertence a uma organização.
                  </h3>
                  <p className="text-neutral-700 text-base leading-7">
                    Quando o conjunto de dados for produzido no contexto de atividade profissional, é recomendável que seja publicado em nome da organização responsável.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => router.push("/pages/admin/organizations/new")}
                  >
                    Crie ou integre uma organização em dados.gov.pt
                  </Button>
                </div>
              )}




              <form
                className="admin-page__form"
                onSubmit={(e) => e.preventDefault()}
              >
                <h2 className="admin-page__section-title">Descrição</h2>

                <div className="admin-page__fields-group">
                  <InputText
                    label="Título*"
                    placeholder="Insira o título aqui"
                    id="api-name"
                    value={datasetTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setDatasetTitle(e.target.value);
                      if (e.target.value.trim()) clearError("datasetTitle");
                    }}
                    hasError={!!formErrors.datasetTitle}
                    hasFeedback={!!formErrors.datasetTitle}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />
                  <InputText
                    label="Sigla"
                    placeholder="Insira a sigla aqui"
                    id="api-acronym"
                    value={datasetAcronym}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setDatasetAcronym(e.target.value);
                    }}
                  />
                  <InputTextArea
                    label="Descrição *"
                    placeholder="Insira a descrição aqui"
                    id="dataset-description"
                    rows={4}
                    maxLength={10000}
                    showCharCounter={true}
                    value={datasetDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setDatasetDescription(e.target.value);
                      if (e.target.value.trim()) clearError("datasetDescription");
                    }}
                    hasError={!!formErrors.datasetDescription}
                    hasFeedback={!!formErrors.datasetDescription || datasetDescription.length < 1000}
                    feedbackState={formErrors.datasetDescription ? "danger" : "warning"}
                    feedbackText="Recomenda-se que a descrição tenha pelo menos 1000 caracteres."
                    errorFeedbackText="Campo obrigatório"
                  />
                  {/*<InputTextArea
                    label="Descrição resumida"
                    placeholder="Insira a descrição aqui"
                    id="dataset-short-description"
                    rows={3}
                    maxLength={200}
                    showCharCounter={true}
                    value={datasetShortDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setDatasetShortDescription(e.target.value);
                      if (e.target.value.trim()) clearError("datasetShortDescription");
                    }}
                    hasFeedback
                    feedbackState="info"
                    feedbackText="Se este campo for deixado em branco, serão utilizados os primeiros 197 caracteres da sua descrição, seguidos de '...' (máximo de 200 caracteres)."
                  />*/}
                  <IsolatedSelect
                    label="Palavras-chave"
                    placeholder="Pesquise ou insira palavras-chave..."
                    id="dataset-keywords"
                    type="checkbox"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar ou criar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    defaultValue={keywordsDefaultValue}
                    onChangeRef={selectedKeywordsRef}
                    onSearchCallback={setKeywordSearch}
                    onChangeCallback={(value) => {
                      setSelectedKeywordsValue(value);
                      const selected = value.split(",").filter(Boolean);
                      let addedNew = false;
                      selected.forEach((v) => {
                        if (!tags.some((t) => t.text.toLowerCase() === v.toLowerCase())) {
                          addedNew = true;
                          setTags((prev) => {
                            if (prev.some((t) => t.text.toLowerCase() === v.toLowerCase())) {
                              return prev;
                            }
                            return [...prev, { text: v }];
                          });
                        }
                      });
                      if (addedNew) {
                        setKeywordSearch("");
                      }
                    }}
                  >
                    {tagOptions}
                  </IsolatedSelect>

                  {selectedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-8 -mt-8">
                      {selectedKeywords.map((keyword) => (
                        <Tag
                          key={keyword}
                          aria-label={`Remover ${keyword}`}
                          onClick={() => {
                            const next = selectedKeywords
                              .filter((v) => v.toLowerCase() !== keyword.toLowerCase())
                              .join(",");
                            setSelectedKeywordsValue(next);
                            selectedKeywordsRef.current = next;
                          }}
                        >
                          {keyword}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>



                <h2 className="admin-page__section-title">Acesso</h2>

                <div className="admin-page__fields-group">
                  <IsolatedSelect
                    label="Licença"
                    placeholder="Selecione uma licença..."
                    id="dataset-license"
                    defaultValue={licenseDefaultValue}
                    onChangeRef={selectedLicenseRef}
                  >
                    {licenseOptions}
                  </IsolatedSelect>
                </div>

                {selectedProducer && selectedProducer !== "user" && (
                  <>
                    <h2 className="admin-page__section-title">
                      Pontos de contacto
                    </h2>

                    <div className="admin-page__fields-group">
                      {orgContactPoints.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {orgContactPoints.map((cp) => (
                            <Checkbox
                              key={cp.id}
                              label={cp.name}
                              value={cp.id}
                              name="contact-points"
                              checked={selectedContactPointIds.includes(cp.id)}
                              onChange={() => toggleExistingContact(cp.id)}
                            />
                          ))}
                        </div>
                      )}

                      {draftContacts.map((draft) => (
                          <div key={draft.id}>
                            <div
                              className="text-primary-900 text-base
                                font-medium leading-7"
                              style={{ paddingBottom: "16px" }}
                            >
                              Novo ponto de contacto
                            </div>
                            <div style={{ paddingBottom: "24px" }}>
                              <InputText
                                label="Nome *"
                                placeholder="Por exemplo, o nome do serviço."
                                id={`contact-name-${draft.id}`}
                                value={draft.name}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                  updateDraft(
                                    draft.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                hasError={!!draft.errors.name}
                                hasFeedback={!!draft.errors.name}
                                feedbackState="danger"
                                errorFeedbackText="Campo obrigatório"
                              />
                            </div>
                            <div
                              className="grid grid-cols-2 gap-[18px]"
                              style={{ paddingBottom: "24px" }}
                            >
                              <InputText
                                label="E-mail"
                                placeholder="contact@organisation.org"
                                id={`contact-email-${draft.id}`}
                                value={draft.email}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                  updateDraft(
                                    draft.id,
                                    "email",
                                    e.target.value,
                                  )
                                }
                                hasError={!!draft.errors.email}
                                hasFeedback={!!draft.errors.email}
                                feedbackState="danger"
                                errorFeedbackText="É necessário um endereço de e-mail caso não seja fornecido um link."
                              />
                              <InputText
                                label="Website"
                                placeholder="https://..."
                                id={`contact-link-${draft.id}`}
                                value={draft.link}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                  updateDraft(
                                    draft.id,
                                    "link",
                                    e.target.value,
                                  )
                                }
                                hasError={!!draft.errors.link}
                                hasFeedback={!!draft.errors.link}
                                feedbackState="danger"
                                errorFeedbackText="É necessário um link caso não seja fornecido um endereço de e‑mail."
                              />
                            </div>
                            <div style={{ paddingBottom: "24px" }}>
                              <Button
                                appearance="outline"
                                variant="primary"
                                hasIcon
                                leadingIcon="agora-line-check-circle"
                                leadingIconHover="agora-solid-check-circle"
                                onClick={() =>
                                  handleSaveContactDraft(draft.id)
                                }
                              >
                                Guardar contacto
                              </Button>
                            </div>
                          </div>
                        ),
                      )}

                      <div style={{ marginTop: "-16px" }}>
                        <Button
                          appearance="outline"
                          variant="primary"
                          hasIcon
                          leadingIcon="agora-line-plus-circle"
                          leadingIconHover="agora-solid-plus-circle"
                          onClick={() => {
                            draftIdRef.current += 1;
                            setDraftContacts((prev) => [
                              ...prev,
                              {
                                id: draftIdRef.current,
                                name: "",
                                email: "",
                                link: "",
                                saved: false,
                                errors: {},
                              },
                            ]);
                          }}
                        >
                          Novo contacto
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <h2 className="admin-page__section-title">Tempo</h2>

                <div className="admin-page__fields-group">
                  <IsolatedSelect
                    label="Frequência de atualização *"
                    placeholder="Selecione uma frequência..."
                    id="dataset-frequency"
                    defaultValue={frequencyDefaultValue}
                    onChangeRef={selectedFrequencyRef}
                    hasError={!!formErrors.datasetFrequency}
                    errorFeedbackText="Campo obrigatório"
                  >
                    {frequencyOptions}
                  </IsolatedSelect>

                  <div className="grid grid-cols-2 gap-[18px]">
                    <InputDate
                      label="Cobertura temporal (Data de início)"
                      id="dataset-date-start"
                      defaultValue={temporalStart}
                      dayInputPlaceholder="dd"
                      monthInputPlaceholder="mm"
                      yearInputPlaceholder="aaaa"
                      calendarIconAriaLabel="Abrir calendário"
                      previousYearAriaLabel="Ano anterior"
                      previousMonthAriaLabel="Mês anterior"
                      nextMonthAriaLabel="Próximo mês"
                      nextYearAriaLabel="Próximo ano"
                      selectedDayAriaLabel="Dia selecionado"
                      todayDayAriaLabel="Hoje"
                      todayLabel="Hoje"
                      cancelLabel="Cancelar"
                      okLabel="OK"
                      hasError={hasTemporalCoverageError}
                      hasFeedback={hasTemporalCoverageError}
                      feedbackState="danger"
                      errorFeedbackText={temporalCoverageErrorText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setTemporalStart(e.target.value);
                        clearTemporalCoverageErrors();
                      }}
                    />
                    <InputDate
                      label="Data de fim"
                      id="dataset-date-end"
                      defaultValue={temporalEnd}
                      dayInputPlaceholder="dd"
                      monthInputPlaceholder="mm"
                      yearInputPlaceholder="aaaa"
                      calendarIconAriaLabel="Abrir calendário"
                      previousYearAriaLabel="Ano anterior"
                      previousMonthAriaLabel="Mês anterior"
                      nextMonthAriaLabel="Próximo mês"
                      nextYearAriaLabel="Próximo ano"
                      selectedDayAriaLabel="Dia selecionado"
                      todayDayAriaLabel="Hoje"
                      todayLabel="Hoje"
                      cancelLabel="Cancelar"
                      okLabel="OK"
                      hasError={hasTemporalCoverageError}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setTemporalEnd(e.target.value);
                        clearTemporalCoverageErrors();
                      }}
                    />
                  </div>
                </div>

                <h2 className="admin-page__section-title">Espaço</h2>

                <div className="admin-page__fields-group">
                  <IsolatedSelect
                    label="Cobertura espacial"
                    placeholder="Selecione uma cobertura espacial..."
                    id="dataset-spatial-coverage"
                    defaultValue={spatialCoverageDefaultValue}
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChangeRef={spatialCoverageRef}
                    onChangeCallback={handleSpatialCoverageChange}
                    onSearchCallback={(q) => {
                      if (q.length < 2) return;
                      suggestSpatialZones(q, 50).then(setSpatialZoneSearch);
                    }}
                  >
                    {spatialCoverageOptions}
                  </IsolatedSelect>

                  {selectedZoneObjects.length > 0 && (
                    <div className="flex flex-wrap gap-8 -mt-8">
                      {selectedZoneObjects.map((zone) => (
                        <Tag
                          key={zone.id}
                          aria-label={`Remover ${zone.name}`}
                          onClick={() => {
                            const next = selectedSpatialZoneIds
                              .filter((id) => id !== zone.id)
                              .join(",");
                            setSelectedSpatialZonesValue(next);
                            spatialCoverageRef.current = next;
                          }}
                        >
                          {zone.code ? `${zone.name} (${zone.code})` : zone.name}
                        </Tag>
                      ))}
                    </div>
                  )}

                  <IsolatedSelect
                    label="Granularidade espacial"
                    placeholder="Selecione uma granularidade espacial..."
                    id="dataset-spatial-granularity"
                    defaultValue={spatialGranularityDefaultValue}
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChangeRef={spatialGranularityRef}
                  >
                    {granularityOptions}
                  </IsolatedSelect>
                </div>

                <div className="admin-page__actions flex justify-between gap-[18px]">
                  <Button
                    variant="primary"
                    appearance="outline"
                    hasIcon
                    leadingIcon="agora-line-arrow-left-circle"
                    leadingIconHover="agora-solid-arrow-left-circle"
                    onClick={onPreviousStep}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep2Next}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "A criar..." : "Seguinte"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Adicionar ficheiros */}
          {currentStep === 3 && (
            <>
              <StatusCard
                type="info"
                description={
                  <>
                    <strong>O que é um ficheiro?</strong>
                    <br />
                    Um conjunto de dados pode conter vários tipos de ficheiros
                    (atualizações, histórico, documentação, código-fonte, API, links, etc.).
                  </>
                }
              />

              <div className="admin-page__form">
                <FileUploadModal
                  uploadedFiles={uploadedFiles}
                  resourceUrls={resourceUrls}
                  hasError={showFileError}
                  onFilesChange={(files) => {
                    setUploadedFiles(files);
                    if (files.length > 0) {
                      setShowFileError(false);
                      setShowInvalidUrlError(false);
                    }
                  }}
                  onUrlAdd={(url) => {
                    setResourceUrls((prev) => {
                      if (prev.includes(url)) return prev;
                      return [...prev, url];
                    });
                    if (isValidHttpsUrl(url.trim())) {
                      setShowFileError(false);
                      setShowInvalidUrlError(false);
                    }
                  }}
                  onUrlRemove={(url) => {
                    setResourceUrls((prev) => prev.filter((u) => u !== url));
                  }}
                  onFileReplace={(index, file) => {
                    const updated = [...uploadedFiles];
                    updated[index] = file;
                    setUploadedFiles(updated);
                  }}
                  resourceTypes={resourceTypes}
                  resourceMetadata={resourceMetadata}
                  onEditMeta={handleEditMeta}
                />
                {showInvalidUrlError && (
                  <span className="text-danger-500 text-sm">
                    Formato de URL inválido. Insira um URL https:// com domínio válido.
                  </span>
                )}

                <div className="admin-page__actions">
                  <Button
                    appearance="outline"
                    variant="neutral"
                    hasIcon
                    leadingIcon="agora-line-arrow-left-circle"
                    leadingIconHover="agora-solid-arrow-left-circle"
                    onClick={onPreviousStep}
                    disabled={isSubmitting}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep3Next}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "A carregar..." : "Seguinte"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Finalizar a publicação */}
          {currentStep === 4 && (
            <>
              <StatusCard
                type="success"
                description={
                  <>
                    <strong>O seu conjunto de dados foi criado!</strong>
                    <br />
                    Agora pode publicar ou guardar como rascunho.
                  </>
                }
              />

              {(() => {
                const qualityScore = createdDataset?.quality?.score != null
                  ? Math.round(createdDataset.quality.score * 100)
                  : 0;
                const formatMetric = (value: number | undefined) => {
                  if (!value) return "0";
                  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
                  if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
                  return String(value);
                };
                const timeAgo = createdDataset?.last_modified
                  ? formatDistanceToNow(new Date(createdDataset.last_modified), { locale: pt })
                      .replace("aproximadamente ", "")
                      .replace("quase ", "")
                      .replace("menos de ", "")
                      .replace("cerca de ", "")
                  : "agora";
                const href = createdDataset
                  ? `/pages/datasets/${createdDataset.slug}`
                  : `/pages/datasets/preview?title=${encodeURIComponent(datasetTitle)}&description=${encodeURIComponent(datasetDescription)}`;
                return (
                  <Link
                    href={href}
                    className="card-general-listing rounded-[4px] overflow-hidden flex flex-col"
                  >
                    <CardGeneral
                      variant="neutral-100"
                      image={{
                        src: createdDataset?.organization?.logo || "/images/placeholders/organization.png",
                        alt: createdDataset?.organization?.name || "Organização",
                        height: "56px",
                        className: "bg-primary-100 !object-contain !h-[56px]",
                      }}
                      subtitleText={
                        (
                          <div className="flex flex-col">
                            <span style={{ fontSize: "16px" }} className="text-neutral-900">{timeAgo}</span>
                            <span style={{ fontSize: "16px", fontWeight: 300 }} className="text-neutral-900 mt-4">
                              {createdDataset?.organization?.name || "Sem Organização"}
                            </span>
                          </div>
                        ) as unknown as string
                      }
                      titleText={createdDataset?.title || datasetTitle || "Sem título"}
                      descriptionText={
                        (
                          <div className="flex flex-col grow">
                            <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">
                              {createdDataset?.description || datasetDescription || "Sem descrição"}
                            </p>
                            <div className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}>
                              <ProgressBar
                                value={qualityScore}
                                max={100}
                                hideLabel={true}
                                hidePercentageValue={true}
                              />
                              <span className="text-[14px] text-neutral-900 mt-4 block">
                                {qualityScore}% Qualidade dos metadados
                              </span>
                              <div className="flex items-center flex-wrap gap-8 text-xs mt-12 text-neutral-700">
                                <div className="flex items-center gap-8" title="Visualizações">
                                  <Icon
                                    name={createdDataset?.metrics?.views ? "agora-solid-eye" : "agora-line-eye"}
                                    dimensions="xs"
                                    className="fill-neutral-700"
                                    aria-hidden="true"
                                  />
                                  <span>{formatMetric(createdDataset?.metrics?.views)}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Downloads">
                                  <Icon
                                    name={createdDataset?.metrics?.resources_downloads ? "agora-solid-download" : "agora-line-download"}
                                    dimensions="xs"
                                    className="fill-neutral-700"
                                    aria-hidden="true"
                                  />
                                  <span>{formatMetric(createdDataset?.metrics?.resources_downloads)}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Reutilizações">
                                  <img src="/Icons/bar_chart.svg" className="w-16 h-16" alt="" aria-hidden="true" />
                                  <span>{createdDataset?.metrics?.reuses || 0}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Favoritos">
                                  <Icon
                                    name={createdDataset?.metrics?.followers ? "agora-solid-star" : "agora-line-star"}
                                    dimensions="xs"
                                    className="fill-neutral-700"
                                    aria-hidden="true"
                                  />
                                  <span>{formatMetric(createdDataset?.metrics?.followers)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-8 text-primary-600 mt-16">
                                <Icon
                                  name="agora-line-arrow-right-circle"
                                  className="w-32 h-32"
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                          </div>
                        ) as unknown as string
                      }
                      isBlockedLink={true}
                      anchor={{ href }}
                    />
                  </Link>
                );
              })()}

              <PublicationFeedbackButton />

              <div className="admin-page__actions flex justify-end gap-[18px]">
                <Button
                  appearance="outline"
                  variant="neutral"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Guardar o rascunho
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "A publicar..." : "Publicar o conjunto de dados"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right: Auxiliar sidebar */}
        {currentStep !== 4 && (
          <aside className="admin-page__auxiliar">
            <div className="admin-page__auxiliar-inner">
              <div className="admin-page__auxiliar-header">
                <Icon
                  name="agora-line-question-mark"
                  className="w-[24px] h-[24px]"
                />
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
