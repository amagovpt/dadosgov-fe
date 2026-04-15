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
  CardGeneral,
  CardLinks,
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
  suggestTags,
} from "@/services/api";
import type { Reuse, ReuseType, ReuseTopic, Dataset, TagSuggestion } from "@/types/api";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import AuxiliarList from "@/components/admin/AuxiliarList";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
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
  const { user } = useAuth();
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

  // Step 2 state
  const [datasetLinks, setDatasetLinks] = useState([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
  const [apiLinks, setApiLinks] = useState([{ url: "" }]);
  const [apiLinkErrors, setApiLinkErrors] = useState<Record<number, string>>({});
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    fetchReuseTypes().then(setReuseTypes);
    fetchReuseTopics().then(setReuseTopics);
    fetchMyDatasets(1, 5).then((res) => setMyDatasets(res.data || []));
    suggestTags("", 50).then(setTags);
  }, []);

  useEffect(() => {
    setDatasetLinkErrors({});
    setApiLinkErrors({});
  }, [currentStep]);

  const keywordsChildren = useMemo(() => {
    const trimmed = keywordSearch.trim().toLowerCase();
    const showCreate = trimmed.length > 0 && !tags.some((t) => t.text.toLowerCase() === trimmed);
    const options = [
      ...tags.map((tag) => (
        <DropdownOption key={tag.text} value={tag.text}>
          {tag.text}
        </DropdownOption>
      )),
      ...(showCreate
        ? [
            <DropdownOption key={`__create__${trimmed}`} value={keywordSearch.trim()}>
              Criar &quot;{keywordSearch.trim()}&quot;
            </DropdownOption>,
          ]
        : []),
    ];
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tags, keywordSearch]);

  const handleKeywordChange = useCallback((value: string) => {
    setSelectedKeywordsValue(value);
    const selected = value.split(",").filter(Boolean);
    selected.forEach((v) => {
      if (!tags.some((t) => t.text === v)) {
        setTags((prev) => [...prev, { text: v }]);
      }
    });
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

      const reuse = await createReuse({
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
      });

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

  const producerOptions = useMemo(() => (
    <DropdownSection name="identity">
      <DropdownOption value="user">
        {user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
      </DropdownOption>
      <>
        {(user?.organizations || []).map((org) => (
          <DropdownOption key={org.id} value={org.id}>
            {org.name}
          </DropdownOption>
        ))}
      </>
    </DropdownSection>
  ), [user]);

  const typeOptions = useMemo(() => (
    <DropdownSection name="types">
      {reuseTypes.map((t) => (
        <DropdownOption key={t.id} value={t.id}>
          {t.label}
        </DropdownOption>
      ))}
    </DropdownSection>
  ), [reuseTypes]);

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
                >
                  {producerOptions}
                </IsolatedSelect>

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
                    maxLength={1000}
                    showCharCounter={true}
                    value={reuseDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setReuseDescription(e.target.value);
                      if (e.target.value.trim()) clearError("reuseDescription");
                    }}
                    hasError={!!formErrors.reuseDescription}
                    hasFeedback={!!formErrors.reuseDescription || reuseDescription.length < 1000}
                    feedbackState={formErrors.reuseDescription ? "danger" : "warning"}
                    feedbackText="Recomenda-se que a descrição tenha pelo menos 1000 caracteres."
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

                  <div>
                    <span className="text-primary-900 text-base font-medium leading-7">
                      Imagem de capa
                    </span>
                    <div className="mt-2">
                      <DragAndDropUploader
                        key={reuseCoverImageFile?.name}
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
              {apiError && (
                <div className="mt-[32px] mb-[16px]">
                  <StatusCard type="danger" description={apiError} />
                </div>
              )}

              <form className="admin-page__form">
                {/* Conjuntos de dados */}
                {selectedDataset && (
                  <div className="agora-card-links-datasets-px0 mt-[16px]">
                    <CardLinks
                      onClick={() => {}}
                      className="cursor-pointer text-neutral-900"
                      variant="transparent"
                      image={{
                        src: selectedDataset.organization?.logo || "/images/placeholders/organization.png",
                        alt: selectedDataset.organization?.name || "Organização sem logo",
                      }}
                      category={selectedDataset.organization?.name}
                      title={selectedDataset.title}
                      description={
                        <div className="flex flex-col gap-12">
                          <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px]">
                            {selectedDataset.description}
                          </p>
                          <div className="flex flex-wrap gap-8 items-center mt-[8px]">
                            <span className="text-sm font-medium text-neutral-900">
                              Metadados: {selectedDataset.quality?.score != null ? Math.round(selectedDataset.quality.score * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex items-center flex-wrap gap-[32px] text-xs mt-[32px] text-[#034AD8] mb-[32px]">
                            <div className="flex items-center gap-8" title="Visualizações">
                              <Icon name="agora-line-eye" aria-hidden="true" />
                              <span>{selectedDataset.metrics?.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Downloads">
                              <Icon name="agora-line-download" aria-hidden="true" />
                              <span>{selectedDataset.metrics?.resources_downloads || 0}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Reutilizações">
                              <img src="/Icons/bar_chart_primary.svg" alt="" aria-hidden="true" />
                              <span>{selectedDataset.metrics?.reuses || 0}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Favoritos">
                              <img src="/Icons/favorite.svg" alt="" aria-hidden="true" />
                              <span>{selectedDataset.metrics?.followers || 0}</span>
                            </div>
                          </div>
                        </div>
                      }
                      date={
                        <span className="font-[300]">
                          {`Atualizado há ${formatDistanceToNow(new Date(selectedDataset.last_modified), { locale: pt }).replace("aproximadamente ", "").replace("quase ", "").replace("menos de ", "").replace("cerca de ", "")}`}
                        </span>
                      }
                      mainLink={
                        <Link href={`/pages/datasets/${selectedDataset.slug}`}>
                          <span className="underline">{selectedDataset.title}</span>
                        </Link>
                      }
                      blockedLink={true}
                    />
                  </div>
                )}

                <InputSelect
                  label="Ficheiro com um conjunto de dados"
                  placeholder="Selecione um conjunto de dados..."
                  id="reuse-dataset-search"
                  searchable
                  searchInputPlaceholder="Escreva para pesquisar..."
                  searchNoResultsText="Nenhum resultado encontrado"
                  onChange={(options) => {
                    if (options.length > 0) {
                      const found = myDatasets.find((d) => d.id === options[0].value);
                      setSelectedDataset(found || null);
                    } else {
                      setSelectedDataset(null);
                    }
                  }}
                >
                  <DropdownSection name="datasets">
                    {myDatasets.map((d) => (
                      <DropdownOption key={d.id} value={d.id}>
                        {d.title}
                      </DropdownOption>
                    ))}
                  </DropdownSection>
                </InputSelect>

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

                      const hasDropdownDataset = !!selectedDataset;
                      const hasUrlDatasets = datasetLinks.some((l) => l.url.trim());
                      if (!hasDropdownDataset && !hasUrlDatasets) {
                        setApiError("Associe pelo menos um conjunto de dados antes de avançar.");
                        return;
                      }

                      setIsSubmitting(true);
                      setApiError(null);
                      try {
                        if (selectedDataset) {
                          const updated = await linkDatasetToReuse(createdReuse.id, selectedDataset.id);
                          setCreatedReuse(updated);
                        }
                        for (const link of datasetLinks) {
                          const trimmed = link.url.trim();
                          if (!trimmed) continue;
                          const idMatch = trimmed.match(/datasets\/([a-f0-9]{24})\/?/);
                          const slugMatch = trimmed.match(/datasets\/([^/]+)\/?$/);
                          const datasetRef = idMatch ? idMatch[1] : slugMatch ? slugMatch[1] : trimmed;
                          const updated = await linkDatasetToReuse(createdReuse.id, datasetRef);
                          setCreatedReuse(updated);
                        }
                        for (const link of apiLinks) {
                          if (link.url.trim()) {
                            await linkDataserviceToReuse(createdReuse.id, link.url.trim());
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
                      Agora pode publicar ou guardar como rascunho.
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

              <Button
                appearance="link"
                variant="primary"
                hasIcon
                trailingIcon="agora-line-external-link"
                trailingIconHover="agora-solid-external-link"
              >
                Dê-nos o seu feedback sobre o processo de publicação.
              </Button>

              {apiError && (
                <div className="mt-[32px] mb-[16px]">
                  <StatusCard type="danger" description={apiError} />
                </div>
              )}

              <div className="admin-page__actions flex justify-end gap-[18px]">
                <Button
                  appearance="outline"
                  variant="neutral"
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (!createdReuse) return;
                    setIsSubmitting(true);
                    try {
                      await updateReuse(createdReuse.id, { private: true });
                      window.location.href = "/pages/admin/me/reuses";
                    } catch {
                      setApiError("Erro ao salvar rascunho. Tente novamente.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? "A guardar..." : "Guardar o rascunho"}
                </Button>
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
