"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Button,
  InputText,
  InputTextArea,
  Icon,
  StatusCard,
  Accordion,
  AccordionGroup,
  InputSelect,
  DropdownSection,
  DropdownOption,
  CardLinks,
  Tag,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import {
  createReuse,
  updateReuse,
  uploadReuseImage,
  linkDatasetToReuse,
  linkDataserviceToReuse,
  fetchReuseTypes,
  fetchReuseTopics,
  fetchMyDatasets,
  fetchOrgDatasets,
  searchDatasets,
  suggestTags,
} from "@/services/api";
import type { Reuse, ReuseType, ReuseTopic, Dataset, TagSuggestion } from "@/types/api";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import AuxiliarList from "@/components/admin/AuxiliarList";
import { getReuseAuxiliarItems } from "@/components/admin/reuses/reusesAuxiliarItems";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { useAuth } from "@/context/AuthContext";
import { localizeReuseType, localizeReuseTopic } from "@/lib/reuse-labels";
import {
  POISONED_FILE_WARNING,
  translateUploadError,
} from "@/lib/security/translateUploadError";
import AppIcon from "@/components/Primitives/AppIcon";

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
  const selectedProducerRef = useRef("");
  const selectedReuseTypeRef = useRef("");
  const selectedReuseTopicRef = useRef("");
  const selectedKeywordsRef = useRef("");
  const [reuseName, setReuseName] = useState("");
  const [reuseLink, setReuseLink] = useState("");
  const [reuseLinkInvalid, setReuseLinkInvalid] = useState(false);
  const [reuseDescription, setReuseDescription] = useState("");
  const [reuseCoverImageFile, setReuseCoverImageFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReuse, setCreatedReuse] = useState<Reuse | null>(null);

  // Dynamic options from backend
  const [reuseTypes, setReuseTypes] = useState<ReuseType[]>([]);
  const [reuseTopics, setReuseTopics] = useState<ReuseTopic[]>([]);
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
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
    suggestTags("", 50).then(setTags);
  }, []);

  useEffect(() => {
    const q = keywordSearch.trim();
    if (q.length < 2) {
      return;
    }
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

  useEffect(() => {
    const dedupe = (items: Dataset[]) =>
      Array.from(new Map(items.map((d) => [d.id, d])).values());
    // When publishing as the user, preload the pool with the user's own
    // datasets AND every dataset from each organization the user belongs
    // to. When publishing as a specific organization, show that org's
    // datasets only. In both cases the search bar still queries the whole
    // portal via searchDatasets().
    if (producerId === "user" || producerId === "") {
      const personal = fetchMyDatasets(1, 100);
      const orgs = (user?.organizations || []).map((org) =>
        fetchOrgDatasets(org.id, 1, 100)
      );
      Promise.all([personal, ...orgs]).then((results) => {
        const all = results.flatMap((r) => r.data || []);
        setMyDatasets(dedupe(all));
      });
    } else {
      fetchOrgDatasets(producerId, 1, 100).then((res) =>
        setMyDatasets(dedupe(res.data || []))
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

  // Search datasets across the whole portal when the user types in the
  // dataset search dropdown. Debounced lightly via the setTimeout below.
  useEffect(() => {
    const q = datasetSearch.trim();
    if (q.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchDatasets(q, 1, 20);
        setDatasetSearchResults(res.data || []);
      } catch {
        setDatasetSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [datasetSearch]);

  const keywordsChildren = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    const visibleTagSearch = trimmed.length >= 2 ? tagSearch : [];
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedSet = new Set(
      selectedKeywordsValue
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
    );
    const seen = new Set<string>();
    const uniqueTags = [...tags, ...visibleTagSearch].filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const showCreate =
      trimmed.length > 0 &&
      ![...tags, ...visibleTagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
      !selectedSet.has(trimmedLower);
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
      ...uniqueTags.map((tag) => (
        <DropdownOption
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tags, tagSearch, keywordSearch, selectedKeywordsValue]);

  const handleKeywordChange = useCallback((value: string) => {
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
    // Clear the search input after creating a new tag so the "Criar X" option
    // disappears and the new tag shows as checked in the list.
    if (addedNew) {
      setKeywordSearch("");
    }
  }, [tags, tagSearch]);

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
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
    setIsSubmitting(true);

    const url = reuseLink.trim().match(/^https?:\/\//) ? reuseLink.trim() : `https://${reuseLink.trim()}`;

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
      const err = error as { status?: number; data?: { errors?: Record<string, string>; message?: string } };

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
        setApiError("Erro interno do servidor. Verifique se todos os campos estão preenchidos corretamente e tente novamente.");
      } else if (err.data?.errors && typeof err.data.errors === "object") {
        const messages = Object.entries(err.data.errors)
          .map(([field, msg]) => {
            const label = fieldLabels[field] || field;
            const translated = errorMessages[String(msg)] || String(msg);
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
      setDatasetLinkErrors((prev) => {
        const next = { ...prev };
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
      setDatasetLinkErrors((prev) => ({ ...prev, [lastIndex]: "Campo obrigatório" }));
      return;
    }
    setDatasetLinks((prev) => [...prev, { url: "" }]);
  };

  const removeDatasetLink = (index: number) => {
    setDatasetLinks((prev) => prev.filter((_, i) => i !== index));
    setDatasetLinkErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const k = Number(key);
        if (k < index) next[k] = value;
        else if (k > index) next[k - 1] = value;
      });
      return next;
    });
  };

  const handleApiUrlChange = (index: number, value: string) => {
    const updated = [...apiLinks];
    updated[index] = { url: value };
    setApiLinks(updated);
    if (value.trim() && apiLinkErrors[index]) {
      setApiLinkErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const addApiLink = () => {
    const lastIndex = apiLinks.length - 1;
    if (!apiLinks[lastIndex].url.trim()) {
      setApiLinkErrors((prev) => ({ ...prev, [lastIndex]: "Campo obrigatório" }));
      return;
    }
    setApiLinks((prev) => [...prev, { url: "" }]);
  };

  const removeApiLink = (index: number) => {
    setApiLinks((prev) => prev.filter((_, i) => i !== index));
    setApiLinkErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const k = Number(key);
        if (k < index) next[k] = value;
        else if (k > index) next[k - 1] = value;
      });
      return next;
    });
  };

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
  const auxiliarItems = getReuseAuxiliarItems({
    title: !!formErrors.reuseName,
    link: !!formErrors.reuseLink,
    type: !!formErrors.reuseType,
    topic: !!formErrors.reuseTopic,
    description: !!formErrors.reuseDescription || !!formErrors.reuseDescriptionLength,
  });

  const producerOptions = useMemo(() => {
    const options = [
      <DropdownOption key="user" value="user">
        {user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
      </DropdownOption>,
      ...(user?.organizations || []).map((org) => (
        <DropdownOption key={org.id} value={org.id}>
          {org.name}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="identity">{options}</DropdownSection>;
  }, [user]);

  const typeOptions = useMemo(() => (
    <DropdownSection name="types">
      {reuseTypes.map((t) => (
        <DropdownOption key={t.id} value={t.id}>
          {localizeReuseType(t)}
        </DropdownOption>
      ))}
    </DropdownSection>
  ), [reuseTypes]);

  const datasetOptions = useMemo(() => {
    const selectedIds = new Set(selectedDatasets.map((d) => d.id));
    const visibleDatasetSearchResults =
      datasetSearch.trim().length >= 2 ? datasetSearchResults : [];
    // Show first the selected (keeps them visible even when not in results),
    // then the search results (if any), then the producer's own datasets.
    const combined: Dataset[] = [
      ...selectedDatasets,
      ...visibleDatasetSearchResults,
      ...myDatasets,
    ];
    // Deduplicate while preserving order
    const unique = Array.from(new Map(combined.map((d) => [d.id, d])).values());
    const options = unique.map((d) => (
      <DropdownOption key={d.id} value={d.id} selected={selectedIds.has(d.id)}>
        {d.title}
      </DropdownOption>
    ));
    return <DropdownSection name="datasets">{options}</DropdownSection>;
  }, [myDatasets, datasetSearch, datasetSearchResults, selectedDatasets]);

  const topicOptions = useMemo(() => (
    <DropdownSection name="themes">
      {reuseTopics.map((t) => (
        <DropdownOption key={t.id} value={t.id}>
          {localizeReuseTopic(t)}
        </DropdownOption>
      ))}
    </DropdownSection>
  ), [reuseTopics]);

  return (
    <>
      {/* Main content area: form + auxiliar sidebar */}
      <div className="admin-page__body">
        {/* Left: Form */}
        <div className="admin-page__form-area">
          {/* Step 1: Descreva sua reutilização */}
          {currentStep === 1 && (
            <>
              <StatusCard
                variant="informative"
                showIcon
                description={
                  <>
                    <strong>O que é reutilização?</strong>
                    <br />
                    Uma reutilização mostra de que forma os dados públicos podem ser utilizados. Ao
                    publicar a sua reutilização, aumenta a visibilidade do seu trabalho e pode
                    estabelecer contacto direto com a entidade que produz o conjunto de dados.
                  </>
                }
              />

              {apiError && (
                <div className="mt-32 mb-16">
                  <StatusCard variant="danger" showIcon description={apiError} />
                </div>
              )}

              <form
                className="admin-page__form"
                onSubmit={(e) => e.preventDefault()}
              >
                <p className="text-neutral-900 text-base leading-7 pt-32">
                  Os campos marcados com um asterisco ( * ) são obrigatórios.
                </p>
                <h2 className="admin-page__section-title">Produtor</h2>

                <IsolatedSelect
                  label="Confirme a identidade que pretende utilizar na publicação."
                  placeholder="Selecione o produtor..."
                  id="producer-identity"
                  onChangeRef={selectedProducerRef}
                  defaultValue={selectedProducerValue}
                  onChangeCallback={(value) => {
                    const v = value || "user";
                    setSelectedProducerValue(v);
                    setProducerId(v);
                    setSelectedDatasets([]);
                    setDatasetSearch("");
                    setDatasetSearchResults([]);
                  }}
                >
                  {producerOptions}
                </IsolatedSelect>

                {!hasOrganization && (
                  <div className="admin-page__org-card">
                    <p className="admin-page__org-card-title">
                      Não pertence a uma organização.
                    </p>
                    <p className="admin-page__org-card-description">
                      Quando a reutilização for produzida no contexto de atividade profissional, é
                      recomendável que seja publicada em nome da organização responsável.
                    </p>
                    <a
                      href="/pages/admin/organizations/new"
                      className="admin-page__org-card-link"
                    >
                      Crie ou integre uma organização em dados.gov.pt
                      <AppIcon
                        name="agora-line-arrow-right-circle"
                        className="w-24 h-24"
                      />
                    </a>
                  </div>
                )}

                <h2 className="admin-page__section-title">Descrição</h2>

                <div className="admin-page__fields-group">
                  <InputText
                    label="Nome da reutilização *"
                    placeholder="Insira o nome aqui"
                    id="reuse-title"
                    value={reuseName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setReuseName(e.target.value);
                      if (e.target.value.trim()) clearError("reuseName");
                    }}
                    hasError={!!formErrors.reuseName}
                    hasFeedback={!!formErrors.reuseName}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />
                  <InputText
                    label="Reutilização *"
                    placeholder="Insira o URL aqui (ex: https://...)"
                    id="reuse-link"
                    value={reuseLink}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      setReuseLink(val);
                      if (val.trim()) {
                        clearError("reuseLink");
                        setReuseLinkInvalid(!isValidUrl(val));
                      } else {
                        setReuseLinkInvalid(false);
                      }
                    }}
                    hasError={!!formErrors.reuseLink || reuseLinkInvalid}
                    hasFeedback={!!formErrors.reuseLink || reuseLinkInvalid}
                    feedbackState="danger"
                    errorFeedbackText={reuseLinkInvalid ? "URL inválido" : "Campo obrigatório"}
                  />
                  {reuseLinkInvalid && (
                    <div className="mt-8">
                      <StatusCard
                        variant="danger"
                        showIcon
                        description="O URL inserido é inválido. Por favor, insira um endereço válido (ex: https://exemplo.pt)."
                      />
                    </div>
                  )}
                  <IsolatedSelect
                    label="Tipo *"
                    placeholder="Selecione um tipo..."
                    id="reuse-type"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChangeRef={selectedReuseTypeRef}
                    defaultValue={selectedReuseTypeValue}
                    onChangeCallback={(v) => setSelectedReuseTypeValue(v || "")}
                    hasError={!!formErrors.reuseType}
                    errorFeedbackText="Campo obrigatório"
                  >
                    {typeOptions}
                  </IsolatedSelect>
                  <IsolatedSelect
                    label="Tema *"
                    placeholder="Selecione um tema..."
                    id="reuse-theme"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChangeRef={selectedReuseTopicRef}
                    defaultValue={selectedReuseTopicValue}
                    onChangeCallback={(v) => setSelectedReuseTopicValue(v || "")}
                    hasError={!!formErrors.reuseTopic}
                    errorFeedbackText="Campo obrigatório"
                  >
                    {topicOptions}
                  </IsolatedSelect>
                  <InputTextArea
                    label="Descrição *"
                    placeholder="Insira a descrição aqui"
                    id="reuse-description"
                    rows={4}
                    maxLength={3000}
                    showCharCounter={true}
                    value={reuseDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setReuseDescription(e.target.value);
                      if (e.target.value.trim()) clearError("reuseDescription");
                    }}
                    hasError={!!formErrors.reuseDescription}
                    hasFeedback={!!formErrors.reuseDescription}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />
                  <IsolatedSelect
                    label="Palavras-chave"
                    placeholder="Pesquise ou insira palavras-chave..."
                    id="reuse-keywords"
                    type="checkbox"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar ou criar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChangeRef={selectedKeywordsRef}
                    defaultValue={selectedKeywordsValue}
                    onSearchCallback={setKeywordSearch}
                    onChangeCallback={handleKeywordChange}
                  >
                    {keywordsChildren}
                  </IsolatedSelect>

                  {selectedKeywordsValue.trim() && (
                    <div className="flex flex-wrap gap-8 -mt-8">
                      {selectedKeywordsValue
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean)
                        .sort((a, b) => a.localeCompare(b))
                        .map((keyword) => (
                          <Tag
                            key={keyword}
                            aria-label={`Remover ${keyword}`}
                            onClick={() => {
                              const next = selectedKeywordsValue
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean)
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

                  <div>
                    <span className="text-primary-900 text-base font-medium leading-7">
                      Imagem de capa
                    </span>
                    <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
                      <DragAndDropUploader
                        dragAndDropLabel="Arraste e largue a imagem aqui"
                        inputLabel="Selecionar ficheiro"
                        selectedFilesLabel="ficheiro selecionado"
                        separatorLabel="ou"
                        removeFileButtonLabel="Remover ficheiro"
                        replaceFileButtonLabel="Substituir ficheiro"
                        extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
                        accept=".jpg,.jpeg,.png"
                        maxSize={4194304}
                        maxCount={1}
                        maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
                        forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                        files={reuseCoverImageFile ? [reuseCoverImageFile] : undefined}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const files = e.target.files;
                          setReuseCoverImageFile(files && files.length > 0 ? files[0] : null);
                          clearError("reuseCoverImage");
                        }}
                        onSecurityError={() => setApiError(POISONED_FILE_WARNING)}
                        hasError={false}
                        hasFeedback={false}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-page__actions flex justify-between gap-[18px]">
                  <Button
                    variant="primary"
                    appearance="outline"
                    hasIcon
                    leadingIcon="agora-line-arrow-left-circle"
                    leadingIconHover="agora-solid-arrow-left-circle"
                    onClick={goToPreviousStep}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep1Next}
                    disabled={isSubmitting || reuseLinkInvalid}
                  >
                    {isSubmitting ? "A criar..." : "Seguinte"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 2: Vinculando conjuntos de dados e APIs */}
          {currentStep === 2 && (
            <>
              <div className="mb-24">
                <StatusCard
                  variant="informative"
                  showIcon
                  description="É importante associar todos os conjuntos de dados, pois ajuda a compreender as referências cruzadas e a melhorar a visibilidade da sua reutilização. Escolha uma das formas de associar os conjuntos de dados: ou publicados neste portal; ou em alternativa indicar links para conjuntos de dados publicados noutros portais."
                />
              </div>
              <div className="mb-24">
                <StatusCard
                  variant="warning"
                  showIcon
                  description="Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
                />
              </div>
              {apiError && (
                <div className="mt-32 mb-16">
                  <StatusCard variant="danger" showIcon description={apiError} />
                </div>
              )}

              <form
                className="admin-page__form"
                onSubmit={(e) => e.preventDefault()}
              >
                <InputSelect
                  key={`dataset-select-${producerId}`}
                  label="Pesquisar um conjunto de dados"
                  placeholder="Selecione conjuntos de dados..."
                  id="reuse-dataset-search"
                  type="checkbox"
                  searchable
                  searchInputPlaceholder="Escreva para pesquisar em todos os conjuntos de dados..."
                  searchNoResultsText="Nenhum resultado encontrado"
                  onSearchInputChange={setDatasetSearch}
                  onChange={(options) => {
                    const selectedIds = new Set(options.map((o) => o.value as string));
                    const pool: Dataset[] = [
                      ...selectedDatasets,
                      ...datasetSearchResults,
                      ...myDatasets,
                    ];
                    const seen = new Set<string>();
                    const next: Dataset[] = [];
                    for (const d of pool) {
                      if (selectedIds.has(d.id) && !seen.has(d.id)) {
                        seen.add(d.id);
                        next.push(d);
                      }
                    }
                    setSelectedDatasets(next);
                  }}
                >
                  {datasetOptions}
                </InputSelect>

                {selectedDatasets.length > 0 && (
                  <div className="flex flex-wrap gap-8 mt-16">
                    {selectedDatasets.map((d) => (
                      <Tag
                        key={d.id}
                        aria-label={`Remover ${d.title}`}
                        onClick={() => {
                          setSelectedDatasets((prev) => prev.filter((x) => x.id !== d.id));
                        }}
                      >
                        {d.title}
                      </Tag>
                    ))}
                  </div>
                )}

                <div className="admin-page__divider-or">
                  <span className="admin-page__divider-or-text">ou</span>
                </div>

                {datasetLinks.map((link, index) => (
                  <div key={`dataset-${index}`} className="mt-16 flex flex-col gap-16">
                    <InputText
                      label="Link para o conjunto de dados"
                      placeholder="Insira o URL aqui"
                      id={`reuse-dataset-url-${index}`}
                      value={link.url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleDatasetUrlChange(index, e.target.value)
                      }
                      hasError={!!datasetLinkErrors[index]}
                      hasFeedback={!!datasetLinkErrors[index]}
                      feedbackState="danger"
                      errorFeedbackText={datasetLinkErrors[index]}
                    />
                    <InputText
                      label="Título (opcional)"
                      placeholder="Nome do conjunto de dados externo"
                      id={`reuse-dataset-title-${index}`}
                      value={link.title ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleDatasetTitleChange(index, e.target.value)
                      }
                    />
                    <InputTextArea
                      label="Descrição (opcional)"
                      placeholder="Pequena descrição do conjunto de dados"
                      id={`reuse-dataset-description-${index}`}
                      value={link.description ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleDatasetDescriptionChange(index, e.target.value)
                      }
                    />
                    {link.url.trim() && (
                      <div className="flex justify-end mt-8">
                        <Button
                          appearance="solid"
                          variant="danger"
                          hasIcon
                          leadingIcon="agora-line-trash"
                          leadingIconHover="agora-solid-trash"
                          onClick={() => removeDatasetLink(index)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button
                    appearance="outline"
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-plus-circle"
                    leadingIconHover="agora-solid-plus-circle"
                    onClick={addDatasetLink}
                  >
                    Adicionar
                  </Button>
                </div>

                {/* APIs - oculto temporariamente */}
                {false && (<>
                <div className="mt-32">
                  <InputSelect
                    label="Pesquisar uma API"
                    placeholder="Pesquise uma API..."
                    id="reuse-api-search"
                  >
                    <DropdownSection name="apis">
                      <DropdownOption value="api1">API 1</DropdownOption>
                    </DropdownSection>
                  </InputSelect>
                </div>

                {apiLinks.map((link, index) => (
                  <div key={`api-${index}`} className="mt-16">
                    <InputText
                      label="Link para a API"
                      placeholder="Insira o URL aqui"
                      id={`reuse-api-url-${index}`}
                      value={link.url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleApiUrlChange(index, e.target.value)
                      }
                      hasError={!!apiLinkErrors[index]}
                      hasFeedback={!!apiLinkErrors[index]}
                      feedbackState="danger"
                      errorFeedbackText={apiLinkErrors[index]}
                    />
                    {link.url.trim() && (
                      <div className="flex justify-end mt-8">
                        <Button
                          appearance="link"
                          variant="danger"
                          hasIcon
                          leadingIcon="agora-line-trash"
                          leadingIconHover="agora-solid-trash"
                          onClick={() => removeApiLink(index)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button
                    appearance="outline"
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-plus-circle"
                    leadingIconHover="agora-solid-plus-circle"
                    onClick={addApiLink}
                  >
                    Adicionar
                  </Button>
                </div>
                </>)}

                <div className="admin-page__actions flex justify-between gap-[18px]">
                  <Button
                    variant="primary"
                    appearance="outline"
                    hasIcon
                    leadingIcon="agora-line-arrow-left-circle"
                    leadingIconHover="agora-solid-arrow-left-circle"
                    onClick={goToPreviousStep}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    disabled={isSubmitting}
                    onClick={async () => {
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
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(", ");
                          setApiError(messages);
                        } else {
                          setApiError("Erro ao associar dados. Verifique os links inseridos e tente novamente.");
                        }
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    {isSubmitting ? "A associar..." : "Seguinte"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Finalizar a publicação */}
          {currentStep === 3 && (
            <>
              <div className="mb-24">
                <StatusCard
                  variant="success"
                  showIcon
                  description={
                    <>
                      <strong>A sua reutilização foi criada!</strong>
                      <br />
                      Foi guardada automaticamente como rascunho. Pode publicá-la agora ou mais tarde, a partir da lista de reutilizações.
                    </>
                  }
                />
              </div>

              <div className="agora-card-links-datasets-px0">
                <CardLinks
                  onClick={() => {}}
                  className="cursor-pointer text-neutral-900"
                  variant="transparent"
                  image={{
                    src: createdReuse?.image_thumbnail || createdReuse?.image || "/laptop.png",
                    alt: reuseName || "Sem título",
                  }}
                  category={createdReuse?.organization?.name || (createdReuse?.owner ? `${createdReuse.owner.first_name} ${createdReuse.owner.last_name}`.trim() : "Reutilização")}
                  title={<div className="underline text-xl-bold">{reuseName || "Sem título"}</div>}
                  description={
                    <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                      {reuseDescription || ""}
                    </p>
                  }
                  date={
                    <span className="font-[300]">
                      {`Atualizado ${format(new Date(), "dd MM yyyy", { locale: pt })}`}
                    </span>
                  }
                  links={[
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-eye",
                      leadingIconHover: "agora-solid-eye",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: "0",
                      title: "Visualizações",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-layers-menu",
                      leadingIconHover: "agora-solid-layers-menu",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: `${createdReuse?.datasets?.length || 0} datasets`,
                      title: "Datasets",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: false,
                      children: (
                        <span className="flex items-center gap-8">
                          <img src="/Icons/bar_chart_primary.svg" alt="" aria-hidden="true" />
                          <span>0</span>
                        </span>
                      ),
                      title: "Métricas",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-star",
                      leadingIconHover: "agora-solid-star",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: 0,
                      title: "Favoritos",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                  ]}
                  mainLink={
                    createdReuse ? (
                      <Link href={`/pages/reuses/${createdReuse.slug}`}>
                        <span className="underline">{reuseName}</span>
                      </Link>
                    ) : (
                      <span className="underline">{reuseName || "Sem título"}</span>
                    )
                  }
                  blockedLink={true}
                />
              </div>

              <PublicationFeedbackButton />

              {apiError && (
                <div className="mt-32 mb-16">
                  <StatusCard variant="danger" showIcon description={apiError} />
                </div>
              )}

              <div className="admin-page__actions flex justify-end gap-[18px]">
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={async () => {
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
                >
                  {isSubmitting ? "A publicar..." : "Publicar a reutilização"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right: Auxiliar sidebar (only for step 1) */}
        {currentStep === 1 && (
          <aside className="admin-page__auxiliar">
            <div className="admin-page__auxiliar-inner">
              <div className="admin-page__auxiliar-header">
                <AppIcon
                  name="agora-line-question-mark"
                  className="w-24 h-24"
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
