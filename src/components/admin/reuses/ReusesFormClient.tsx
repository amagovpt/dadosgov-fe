"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropdownOption, DropdownSection } from "@ama-pt/agora-design-system";
import { fetchMyDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import {
  createReuse,
  fetchReuseTopics,
  fetchReuseTypes,
  linkDatasetToReuse,
  linkDataserviceToReuse,
  updateReuse,
  uploadReuseImage,
} from "@/service/api/reuses";
import { searchDatasets } from "@/service/api/search";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse, ReuseTopic, ReuseType } from "@/service/types/reuse";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import { useAuth } from "@/context/AuthContext";
import { localizeReuseTopic, localizeReuseType } from "@/lib/reuse-labels";
import {
  POISONED_FILE_WARNING,
  translateUploadError,
} from "@/lib/security/translateUploadError";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import { getReuseAuxiliarItems } from "@/components/admin/reuses/reusesAuxiliarItems";
import ReusesFormDetailsStep from "@/components/admin/reuses/ReusesFormDetailsStep";
import ReusesFormDatasetsStep from "@/components/admin/reuses/ReusesFormDatasetsStep";
import ReusesFormPublishStep from "@/components/admin/reuses/ReusesFormPublishStep";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";

interface ReusesFormClientProps {
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

export default function ReusesFormClient({
  currentStep,
  onNextStep,
  onPreviousStep,
}: ReusesFormClientProps) {
  const { user, hasOrganization } = useAuth();
  const selectedProducerRef = useRef("user");
  const selectedReuseTypeRef = useRef("");
  const selectedReuseTopicRef = useRef("");
  const selectedKeywordsRef = useRef("");

  const [reuseName, setReuseName] = useState("");
  const [reuseLink, setReuseLink] = useState("");
  const [reuseLinkInvalid, setReuseLinkInvalid] = useState(false);
  const [reuseDescription, setReuseDescription] = useState("");
  const [reuseCoverImageFile, setReuseCoverImageFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReuse, setCreatedReuse] = useState<Reuse | null>(null);
  const {
    errors: formErrors,
    hasError,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
  } = useFormErrors();

  // Dynamic options from backend
  const [reuseTypes, setReuseTypes] = useState<ReuseType[]>([]);
  const [reuseTopics, setReuseTopics] = useState<ReuseTopic[]>([]);
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");
  // Persist selected values across step navigation (uncontrolled IsolatedSelect
  // remounts when the step 1 JSX unmounts/remounts; state survives because the
  // parent component does not remount).
  const [selectedProducerValue, setSelectedProducerValue] = useState("user");
  const [selectedReuseTypeValue, setSelectedReuseTypeValue] = useState("");
  const [selectedReuseTopicValue, setSelectedReuseTopicValue] = useState("");

  // Step 2 state
  const [datasetLinks, setDatasetLinks] = useState<RemoteDatasetEntry[]>([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
  const [apiLinks, setApiLinks] = useState([{ url: "" }]);
  const [apiLinkErrors, setApiLinkErrors] = useState<Record<number, string>>({});
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  const [producerId, setProducerId] = useState<string>("user");

  useEffect(() => {
    fetchReuseTypes().then(setReuseTypes);
    fetchReuseTopics().then(setReuseTopics);
  }, []);

  useEffect(() => {
    const dedupe = (items: Dataset[]) =>
      Array.from(new Map(items.map((dataset) => [dataset.id, dataset])).values());

    // When publishing as the user, preload the pool with the user's own
    // datasets AND every dataset from each organization the user belongs
    // to. When publishing as a specific organization, show that org's
    // datasets only. In both cases the search bar still queries the whole
    // portal via searchDatasets().
    if (producerId === "user" || producerId === "") {
      const personal = fetchMyDatasets(1, 100);
      const organizations = (user?.organizations || []).map((organization) =>
        fetchOrgDatasets(organization.id, 1, 100),
      );

      Promise.all([personal, ...organizations]).then((results) => {
        const all = results.flatMap((result) => result.data || []);
        setMyDatasets(dedupe(all));
      });
    } else {
      fetchOrgDatasets(producerId, 1, 100).then((result) =>
        setMyDatasets(dedupe(result.data || [])),
      );
    }
  }, [producerId, user?.organizations]);

  const clearStep2Errors = useCallback(() => {
    setDatasetLinkErrors({});
    setApiLinkErrors({});
  }, []);

  const goToNextStep = useCallback(() => {
    clearStep2Errors();
    onNextStep();
  }, [clearStep2Errors, onNextStep]);

  const goToPreviousStep = useCallback(() => {
    clearStep2Errors();
    onPreviousStep();
  }, [clearStep2Errors, onPreviousStep]);

  useEffect(() => {
    const query = datasetSearch.trim();
    if (query.length < 2) {
      return;
    }

    // Search datasets across the whole portal when the user types in the
    // dataset search dropdown. Debounced lightly via the setTimeout below.
    const timer = setTimeout(async () => {
      try {
        const response = await searchDatasets(query, 1, 20);
        setDatasetSearchResults(response.data || []);
      } catch {
        setDatasetSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [datasetSearch]);

  const selectedKeywords = useMemo(
    () =>
      selectedKeywordsValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [selectedKeywordsValue],
  );
  const {
    keywordOptions: keywordsChildren,
    setKeywordSearch,
    registerSelectedKeywordValue,
  } = useKeywordSelect({
    selectedKeywords,
    includeSelectedOutsideSuggestions: false,
  });

  const handleKeywordChange = useCallback(
    (value: string) => {
      setSelectedKeywordsValue(value);
      registerSelectedKeywordValue(value);
    },
    [registerSelectedKeywordValue],
  );

  const isValidUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const normalized = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  const handleStep1Next = async () => {
    const errors: Record<string, boolean> = {};
    if (!reuseName.trim()) errors.reuseName = true;
    if (!reuseLink.trim()) errors.reuseLink = true;
    if (reuseLink.trim() && !isValidUrl(reuseLink)) {
      setReuseLinkInvalid(true);
      return;
    }
    if (!selectedReuseTypeRef.current) errors.reuseType = true;
    if (!selectedReuseTopicRef.current) errors.reuseTopic = true;
    if (!reuseDescription.trim()) errors.reuseDescription = true;

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setApiError(null);
    setIsSubmitting(true);

    const url = reuseLink.trim().match(/^https?:\/\//)
      ? reuseLink.trim()
      : `https://${reuseLink.trim()}`;

    try {
      const selectedTags = selectedKeywordsValue
        ? selectedKeywordsValue.split(",").filter(Boolean)
        : [];

      const payload = {
        title: reuseName.trim(),
        description: reuseDescription.trim(),
        url,
        type: selectedReuseTypeRef.current,
        topic: selectedReuseTopicRef.current || undefined,
        private: true,
        ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
        ...(selectedProducerRef.current && selectedProducerRef.current !== "user"
          ? { organization: selectedProducerRef.current }
          : {}),
      };

      const reuse = createdReuse
        ? await updateReuse(createdReuse.id, payload)
        : await createReuse(payload);

      if (reuseCoverImageFile) {
        await uploadReuseImage(reuse.id, reuseCoverImageFile);
      }

      setCreatedReuse(reuse);
      goToNextStep();
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { errors?: Record<string, string>; message?: string };
      };

      const fieldLabels: Record<string, string> = {
        url: "URL da reutilização",
        title: "Nome da reutilização",
        description: "Descrição",
        type: "Tipo",
        topic: "Tema",
        organization: "Organização",
      };
      const errorMessages: Record<string, string> = {
        "This URL is already registered": "Este URL já está registado. Utilize um URL diferente.",
      };

      if (err.status === 500) {
        setApiError(
          "Erro interno do servidor. Verifique se todos os campos estão preenchidos corretamente e tente novamente.",
        );
      } else if (err.data?.errors && typeof err.data.errors === "object") {
        const messages = Object.entries(err.data.errors)
          .map(([field, message]) => {
            const label = fieldLabels[field] || field;
            const translated = errorMessages[String(message)] || String(message);
            return `${label}: ${translated}`;
          })
          .join("\n");
        setApiError(messages);
      } else if (err.data?.message) {
        const translated = errorMessages[err.data.message] || err.data.message;
        setApiError(translateUploadError(translated));
      } else {
        setApiError("Erro ao criar a reutilização. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatasetUrlChange = (index: number, value: string) => {
    const updated = [...datasetLinks];
    updated[index] = { ...updated[index], url: value };
    setDatasetLinks(updated);
    if (value.trim() && datasetLinkErrors[index]) {
      setDatasetLinkErrors((previous) => {
        const next = { ...previous };
        delete next[index];
        return next;
      });
    }
  };

  const handleDatasetTitleChange = (index: number, value: string) => {
    const updated = [...datasetLinks];
    updated[index] = { ...updated[index], title: value };
    setDatasetLinks(updated);
  };

  const handleDatasetDescriptionChange = (index: number, value: string) => {
    const updated = [...datasetLinks];
    updated[index] = { ...updated[index], description: value };
    setDatasetLinks(updated);
  };

  const addDatasetLink = () => {
    const lastIndex = datasetLinks.length - 1;
    if (!datasetLinks[lastIndex].url.trim()) {
      setDatasetLinkErrors((previous) => ({ ...previous, [lastIndex]: "Campo obrigatório" }));
      return;
    }
    setDatasetLinks((previous) => [...previous, { url: "" }]);
  };

  const removeDatasetLink = (index: number) => {
    setDatasetLinks((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setDatasetLinkErrors((previous) => {
      const next: Record<number, string> = {};
      Object.entries(previous).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) next[numericKey] = value;
        else if (numericKey > index) next[numericKey - 1] = value;
      });
      return next;
    });
  };

  const auxiliarItems = getReuseAuxiliarItems({
    title: hasError("reuseName"),
    link: hasError("reuseLink"),
    type: hasError("reuseType"),
    topic: hasError("reuseTopic"),
    description: hasError("reuseDescription") || hasError("reuseDescriptionLength"),
  });

  const producerOptions = useMemo(() => {
    const options = [
      <DropdownOption key="user" value="user">
        {user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
      </DropdownOption>,
      ...(user?.organizations || []).map((organization) => (
        <DropdownOption key={organization.id} value={organization.id}>
          {organization.name}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="identity">{options}</DropdownSection>;
  }, [user]);

  const typeOptions = useMemo(
    () => (
      <DropdownSection name="types">
        {reuseTypes.map((type) => (
          <DropdownOption key={type.id} value={type.id}>
            {localizeReuseType(type)}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [reuseTypes],
  );

  const datasetOptions = useMemo(() => {
    const selectedIds = new Set(selectedDatasets.map((dataset) => dataset.id));
    const visibleDatasetSearchResults =
      datasetSearch.trim().length >= 2 ? datasetSearchResults : [];
    // Show first the selected (keeps them visible even when not in results),
    // then the search results (if any), then the producer's own datasets.
    const combined: Dataset[] = [...selectedDatasets, ...visibleDatasetSearchResults, ...myDatasets];
    // Deduplicate while preserving order
    const unique = Array.from(new Map(combined.map((dataset) => [dataset.id, dataset])).values());
    const options = unique.map((dataset) => (
      <DropdownOption
        key={dataset.id}
        value={dataset.id}
        selected={selectedIds.has(dataset.id)}
      >
        {dataset.title}
      </DropdownOption>
    ));
    return <DropdownSection name="datasets">{options}</DropdownSection>;
  }, [datasetSearch, datasetSearchResults, myDatasets, selectedDatasets]);

  const topicOptions = useMemo(
    () => (
      <DropdownSection name="themes">
        {reuseTopics.map((topic) => (
          <DropdownOption key={topic.id} value={topic.id}>
            {localizeReuseTopic(topic)}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [reuseTopics],
  );

  return (
    <div className="admin-page__body">
      {/* Left: Form */}
      <div className="admin-page__form-area">
        {/* Step 1: Descreva sua reutilização */}
        {currentStep === 1 && (
          <ReusesFormDetailsStep
            apiError={apiError}
            hasOrganization={hasOrganization}
            selectedProducerRef={selectedProducerRef}
            selectedProducerValue={selectedProducerValue}
            producerOptions={producerOptions}
            onProducerChange={(value) => {
              const nextValue = value || "user";
              selectedProducerRef.current = nextValue;
              setSelectedProducerValue(nextValue);
              setProducerId(nextValue);
              setSelectedDatasets([]);
              setDatasetSearch("");
              setDatasetSearchResults([]);
            }}
            reuseName={reuseName}
            reuseLink={reuseLink}
            reuseLinkInvalid={reuseLinkInvalid}
            reuseDescription={reuseDescription}
            formErrors={formErrors}
            onReuseNameChange={(event) => {
              setReuseName(event.target.value);
              if (event.target.value.trim()) clearError("reuseName");
            }}
            onReuseLinkChange={(event) => {
              const value = event.target.value;
              setReuseLink(value);
              if (value.trim()) {
                clearError("reuseLink");
                setReuseLinkInvalid(!isValidUrl(value));
              } else {
                setReuseLinkInvalid(false);
              }
            }}
            selectedReuseTypeRef={selectedReuseTypeRef}
            typeOptions={typeOptions}
            selectedReuseTypeValue={selectedReuseTypeValue}
            onReuseTypeChange={(value) => {
              const nextValue = value || "";
              selectedReuseTypeRef.current = nextValue;
              setSelectedReuseTypeValue(nextValue);
            }}
            selectedReuseTopicRef={selectedReuseTopicRef}
            topicOptions={topicOptions}
            selectedReuseTopicValue={selectedReuseTopicValue}
            onReuseTopicChange={(value) => {
              const nextValue = value || "";
              selectedReuseTopicRef.current = nextValue;
              setSelectedReuseTopicValue(nextValue);
            }}
            onReuseDescriptionChange={(event) => {
              setReuseDescription(event.target.value);
              if (event.target.value.trim()) clearError("reuseDescription");
            }}
            selectedKeywordsRef={selectedKeywordsRef}
            keywordsChildren={keywordsChildren}
            selectedKeywordsValue={selectedKeywordsValue}
            onKeywordSearch={setKeywordSearch}
            onKeywordChange={(value) => {
              selectedKeywordsRef.current = value;
              handleKeywordChange(value);
            }}
            onKeywordRemove={(keyword) => {
              const next = selectedKeywordsValue
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .filter((value) => value.toLowerCase() !== keyword.toLowerCase())
                .join(",");
              setSelectedKeywordsValue(next);
              selectedKeywordsRef.current = next;
            }}
            reuseCoverImageFile={reuseCoverImageFile}
            onReuseCoverImageChange={(event) => {
              const files = event.target.files;
              setReuseCoverImageFile(files && files.length > 0 ? files[0] : null);
              clearError("reuseCoverImage");
            }}
            onReuseCoverImageSecurityError={() => setApiError(POISONED_FILE_WARNING)}
            onPreviousStep={goToPreviousStep}
            onNextStep={handleStep1Next}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Step 2: Vinculando conjuntos de dados e APIs */}
        {currentStep === 2 && (
          <ReusesFormDatasetsStep
            apiError={apiError}
            producerId={producerId}
            datasetOptions={datasetOptions}
            selectedDatasets={selectedDatasets}
            datasetSearchResults={datasetSearchResults}
            myDatasets={myDatasets}
            onDatasetSearch={setDatasetSearch}
            onSelectedDatasetsChange={setSelectedDatasets}
            onSelectedDatasetRemove={(datasetId) => {
              setSelectedDatasets((previous) =>
                previous.filter((dataset) => dataset.id !== datasetId),
              );
            }}
            datasetLinks={datasetLinks}
            datasetLinkErrors={datasetLinkErrors}
            onDatasetUrlChange={handleDatasetUrlChange}
            onDatasetTitleChange={handleDatasetTitleChange}
            onDatasetDescriptionChange={handleDatasetDescriptionChange}
            onDatasetLinkRemove={removeDatasetLink}
            onDatasetLinkAdd={addDatasetLink}
            onPreviousStep={goToPreviousStep}
            onNextStep={async () => {
              if (!createdReuse) return;

              // LEDG-1748 PR 2: persist remote datasets as
              // { url, title?, description? } entries (deduped by URL,
              // first occurrence wins so user-typed metadata sticks).
              const seenUrls = new Set<string>();
              const remoteEntries: RemoteDatasetEntry[] = [];
              for (const link of datasetLinks) {
                const url = link.url.trim();
                if (!url || seenUrls.has(url)) continue;
                seenUrls.add(url);
                const title = link.title?.trim();
                const description = link.description?.trim();
                remoteEntries.push({
                  url,
                  title: title || undefined,
                  description: description || undefined,
                });
              }

              const hasLocal = selectedDatasets.length > 0;
              const hasRemote = remoteEntries.length > 0;

              // Mutual exclusion: local datasets OR remote URLs, not both.
              if (hasLocal && hasRemote) {
                setApiError(
                  "Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização.",
                );
                return;
              }

              setIsSubmitting(true);
              setApiError(null);
              try {
                // Local datasets -> link via the reuse/datasets endpoint.
                for (const dataset of selectedDatasets) {
                  const updated = await linkDatasetToReuse(createdReuse.id, dataset.id);
                  setCreatedReuse(updated);
                }

                // Remote datasets -> stored as objects on the reuse's
                // extras field. The backend model only accepts local
                // Dataset references on `datasets`, so remote entries
                // live on extras.remote_datasets.
                if (hasRemote) {
                  const updated = await updateReuse(createdReuse.id, {
                    extras: {
                      ...(createdReuse.extras || {}),
                      remote_datasets: remoteEntries,
                    },
                  });
                  setCreatedReuse(updated);
                }

                for (const link of apiLinks) {
                  if (link.url.trim()) {
                    try {
                      await linkDataserviceToReuse(createdReuse.id, link.url.trim());
                    } catch {
                      // Silent; API links UI is hidden for now.
                    }
                  }
                }

                goToNextStep();
              } catch (error: unknown) {
                const err = error as { data?: Record<string, unknown> };
                if (err.data && typeof err.data === "object") {
                  const messages = Object.entries(err.data)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ");
                  setApiError(messages);
                } else {
                  setApiError(
                    "Erro ao associar dados. Verifique os links inseridos e tente novamente.",
                  );
                }
              } finally {
                setIsSubmitting(false);
              }
            }}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Step 3: Finalizar a publicação */}
        {currentStep === 3 && (
          <ReusesFormPublishStep
            createdReuse={createdReuse}
            reuseName={reuseName}
            reuseDescription={reuseDescription}
            apiError={apiError}
            isSubmitting={isSubmitting}
            onPublish={async () => {
              if (!createdReuse) return;
              setIsSubmitting(true);
              setApiError(null);
              try {
                await updateReuse(createdReuse.id, { private: false });
                window.location.href = "/pages/admin/me/reuses";
              } catch {
                setApiError("Erro ao publicar. Tente novamente.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        )}
      </div>

      {/* Right: Auxiliar sidebar (only for step 1) */}
      {currentStep === 1 && <AdminAuxiliarySidebar items={auxiliarItems} />}
    </div>
  );
}
