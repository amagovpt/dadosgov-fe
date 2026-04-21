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
  DragAndDropUploader,
  CardLinks,
  Tag,
} from "@ama-pt/agora-design-system";
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
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import AuxiliarList from "@/components/admin/AuxiliarList";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { useAuth } from "@/context/AuthContext";

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
  const [keywordSearch, setKeywordSearch] = useState("");
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");
  // Persist selected values across step navigation (uncontrolled IsolatedSelect
  // remounts when the step 1 JSX unmounts/remounts; state survives because the
  // parent component does not remount).
  const [selectedProducerValue, setSelectedProducerValue] = useState("user");
  const [selectedReuseTypeValue, setSelectedReuseTypeValue] = useState("");
  const [selectedReuseTopicValue, setSelectedReuseTopicValue] = useState("");

  // Step 2 state
  const [datasetLinks, setDatasetLinks] = useState([{ url: "" }]);
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
    setSelectedDatasets([]);
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

  useEffect(() => {
    setDatasetLinkErrors({});
    setApiLinkErrors({});
  }, [currentStep]);

  // Search datasets across the whole portal when the user types in the
  // dataset search dropdown. Debounced lightly via the setTimeout below.
  useEffect(() => {
    const q = datasetSearch.trim();
    if (q.length < 2) {
      setDatasetSearchResults([]);
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
    // Deduplicate tags by lowercased text (keeps the first occurrence).
    const seen = new Set<string>();
    const uniqueTags = tags.filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const selectedSet = new Set(
      selectedKeywordsValue
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
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
  }, [tags, keywordSearch, selectedKeywordsValue]);

  const handleKeywordChange = useCallback((value: string) => {
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
    // Clear the search input after creating a new tag so the "Criar X" option
    // disappears and the new tag shows as checked in the list.
    if (addedNew) {
      setKeywordSearch("");
    }
  }, [tags]);

  const handleStep1Next = async () => {
    const errors: Record<string, boolean> = {};
    if (!reuseName.trim()) errors.reuseName = true;
    if (!reuseLink.trim()) errors.reuseLink = true;
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
      onNextStep();
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
        setApiError(translated);
      } else {
        setApiError("Erro ao criar a reutilização. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatasetUrlChange = (index: number, value: string) => {
    const updated = [...datasetLinks];
    updated[index] = { url: value };
    setDatasetLinks(updated);
    if (value.trim() && datasetLinkErrors[index]) {
      setDatasetLinkErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
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
  const auxiliarItemsStep1 = [
    {
      title: "Dar um título",
      content: (
        <p>
          Prefira um título que explique claramente como a reutilização utiliza os dados, em vez
          de usar apenas o nome do site ou da aplicação. Por exemplo: “Sistema de Pesquisa de
          Acordos Comerciais” em vez de “acordoscomerciais.pt”.
        </p>
      ),
      hasError: !!formErrors.reuseName,
    },
    {
      title: "Adicionar um link",
      content: (
        <p>
          Insira o link da página onde a reutilização pode ser consultada. Prefira o link direto
          para o conteúdo e certifique-se de que o endereço permanece estável.
        </p>
      ),
      hasError: !!formErrors.reuseLink,
    },
    {
      title: "Escolher um tipo",
      content: (
        <p>
          Indique o tipo em que deve ser classificada a reutilização (API, aplicação, artigo de
          imprensa, visualização, etc.).
        </p>
      ),
      hasError: !!formErrors.reuseType,
    },
    {
      title: "Escolher um tema",
      content: <p>Escolha o tema associado à sua reutilização.</p>,
      hasError: !!formErrors.reuseTopic,
    },
    {
      title: "Descrever a reutilização",
      content: (
        <p>
          Pode indicar, de forma objetiva, como a reutilização foi desenvolvida, o que permite
          realizar ou demonstrar e, se relevante, acrescentar informação sobre o contexto em que a
          reutilização foi criada. Recomenda-se manter um tom neutro; conteúdos com caráter
          excessivamente promocional poderão não ser aceites.
        </p>
      ),
      hasError: !!formErrors.reuseDescription || !!formErrors.reuseDescriptionLength,
    },
    {
      title: "Adicionar palavras-chave",
      content: (
        <p>
          As palavras-chave são apresentadas na página da reutilização e melhoram a sua
          visibilidade nos motores de pesquisa. Ao selecionar uma palavra-chave, pode consultar
          outras reutilizações às quais essa mesma palavra foi associada. Com base no conteúdo da
          reutilização, podem ser sugeridas palavras-chave automaticamente. Pode aceitá-las,
          modificá-las ou excluí-las.
        </p>
      ),
    },
    {
      title: "Escolher uma imagem",
      content: (
        <p>
          Se a sua reutilização tiver uma componente visual, pode apresentar uma pré-visualização
          através de uma imagem ou de uma captura de ecrã (preferíveis a logótipos ou a simples
          ilustrações). Esta imagem será exibida na secção “Reutilizações” na listagem das mesmas.
        </p>
      ),
    },
  ];

  const auxiliarItems = auxiliarItemsStep1;

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
          {t.label}
        </DropdownOption>
      ))}
    </DropdownSection>
  ), [reuseTypes]);

  const datasetOptions = useMemo(() => {
    const seen = new Set<string>();
    const selectedIds = new Set(selectedDatasets.map((d) => d.id));
    // Show first the selected (keeps them visible even when not in results),
    // then the search results (if any), then the producer's own datasets.
    const combined: Dataset[] = [
      ...selectedDatasets,
      ...datasetSearchResults,
      ...myDatasets,
    ];
    const options = combined.reduce<React.ReactElement[]>((acc, d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        acc.push(
          <DropdownOption
            key={d.id}
            value={d.id}
            selected={selectedIds.has(d.id)}
          >
            {d.title}
          </DropdownOption>
        );
      }
      return acc;
    }, []);
    return <DropdownSection name="datasets">{options}</DropdownSection>;
  }, [myDatasets, datasetSearchResults, selectedDatasets]);

  const topicOptions = useMemo(() => (
    <DropdownSection name="themes">
      {reuseTopics.map((t) => (
        <DropdownOption key={t.id} value={t.id}>
          {t.label}
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
                type="info"
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
                <div className="mt-[32px] mb-[16px]">
                  <StatusCard type="danger" description={apiError} />
                </div>
              )}

              <form className="admin-page__form">
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
                      <Icon
                        name="agora-line-arrow-right-circle"
                        className="w-[24px] h-[24px]"
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
                      setReuseLink(e.target.value);
                      if (e.target.value.trim()) {
                        clearError("reuseLink");
                        clearError("reuseLinkInvalid");
                      }
                    }}
                    hasError={!!formErrors.reuseLink}
                    hasFeedback={!!formErrors.reuseLink}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />
                  <IsolatedSelect
                    label="Tipo *"
                    placeholder="Selecione um tipo..."
                    id="reuse-type"
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
                    <div className="mt-2">
                      <DragAndDropUploader
                        dragAndDropLabel="Arraste e largue a imagem aqui"
                        inputLabel="Selecionar ficheiro"
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
                    onClick={onPreviousStep}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep1Next}
                    disabled={isSubmitting}
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
              <div className="mb-[24px]">
                <StatusCard
                  type="info"
                  description="É importante associar todos os conjuntos de dados, pois ajuda a compreender as referências cruzadas e a melhorar a visibilidade da sua reutilização."
                />
              </div>
              <div className="mb-[24px]">
                <StatusCard
                  type="warning"
                  description="Pode associar conjuntos de dados deste portal OU indicar links para conjuntos de dados remotos (de outros portais), mas não ambos na mesma reutilização."
                />
              </div>
              {apiError && (
                <div className="mt-[32px] mb-[16px]">
                  <StatusCard type="danger" description={apiError} />
                </div>
              )}

              <form className="admin-page__form">
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
                  <div className="flex flex-wrap gap-8 mt-[16px]">
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
                  <div key={`dataset-${index}`} className="mt-[16px]">
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
                    {link.url.trim() && (
                      <div className="flex justify-end mt-[24px]">
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
                <div className="mt-[32px]">
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
                  <div key={`api-${index}`} className="mt-[16px]">
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
                      <div className="flex justify-end mt-[8px]">
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
                    onClick={onPreviousStep}
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

                      const remoteUrls = datasetLinks
                        .map((l) => l.url.trim())
                        .filter(Boolean);
                      const hasLocal = selectedDatasets.length > 0;
                      const hasRemote = remoteUrls.length > 0;

                      // Mutual exclusion: local datasets OR remote URLs, not both.
                      if (hasLocal && hasRemote) {
                        setApiError(
                          "Só pode associar conjuntos de dados deste portal OU indicar links para conjuntos de dados remotos, não os dois em simultâneo.",
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
                        // Remote datasets -> stored as URLs on the reuse's extras
                        // field. The backend model only accepts local Dataset
                        // references on `datasets`, so remote URLs live on
                        // extras.remote_datasets.
                        if (hasRemote) {
                          const updated = await updateReuse(createdReuse.id, {
                            extras: {
                              ...(createdReuse.extras || {}),
                              remote_datasets: remoteUrls,
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
                        onNextStep();
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
              <div className="mb-[24px]">
                <StatusCard
                  type="success"
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
                    <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
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
                <div className="mt-[32px] mb-[16px]">
                  <StatusCard type="danger" description={apiError} />
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
