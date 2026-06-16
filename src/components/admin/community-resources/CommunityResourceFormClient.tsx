"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Icon,
  InputSelect,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import {
  createCommunityResource,
  uploadCommunityResourceFile,
} from "@/service/api/community-resources";
import { fetchDataset, fetchMyDatasets, fetchResourceTypes } from "@/service/api/datasets";
import type { ResourceType } from "@/service/types/catalog";
import type { CommunityResource } from "@/service/types/community-resource";
import type { Dataset } from "@/service/types/dataset";
import { useAuth } from "@/context/AuthContext";
import AuxiliarList from "@/components/admin/AuxiliarList";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useAsyncSubmit } from "@/hooks/forms/useAsyncSubmit";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import {
  buildSchemaItems,
  renderDropdownSection,
} from "@/components/admin/community-resources/dropdownOptions";
import SelectedDatasetCard from "@/components/admin/community-resources/SelectedDatasetCard";
import CreatedResourceCard from "@/components/admin/community-resources/CreatedResourceCard";

interface CommunityResourceFormClientProps {
  datasetId: string;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onPublicPageReady?: (url: string) => void;
}

type CommunityResourceCreateField = "title" | "resourceUrl" | "type" | "dataset";

function normalizeCommunityResourceUrl(resourceUrl: string, file: File | null) {
  if (file) {
    return "https://example.com/placeholder";
  }

  const trimmedUrl = resourceUrl.trim();
  return trimmedUrl.match(/^https?:\/\//) ? trimmedUrl : `https://${trimmedUrl}`;
}

export default function CommunityResourceFormClient({
  datasetId,
  currentStep,
  onNextStep,
  onPreviousStep,
  onPublicPageReady,
}: CommunityResourceFormClientProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const selectedTypeRef = useRef("");
  const selectedProducerRef = useRef("");
  const selectedSchemaRef = useRef("");
  const [schemaUrl, setSchemaUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdResource, setCreatedResource] = useState<CommunityResource | null>(null);

  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasetId);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const activeDataset = selectedDatasetId ? dataset : null;

  const {
    hasError,
    setErrors,
    clearError,
    setError,
    resetErrors,
  } = useFormErrors<CommunityResourceCreateField>();

  const { isSubmitting, run } = useAsyncSubmit({
    clearError: () => setApiError(null),
    onError: (error) => {
      const normalized = normalizeApiError(error, "Erro ao criar recurso comunitário.");
      if (normalized.status === 401) {
        setApiError("Sessão expirada. Faça login novamente.");
        return;
      }
      setApiError(normalized.message || "Erro ao criar recurso comunitário.");
    },
  });

  useEffect(() => {
    if (!selectedDatasetId) {
      return;
    }

    fetchDataset(selectedDatasetId)
      .then(setDataset)
      .catch(() => console.error("Error loading dataset"));
  }, [selectedDatasetId]);

  useEffect(() => {
    fetchResourceTypes()
      .then(setResourceTypes)
      .catch(() => console.error("Error loading resource types"));
  }, []);

  useEffect(() => {
    if (datasetId) {
      return;
    }

    fetchMyDatasets(1, 50)
      .then((response) => setMyDatasets(response.data || []))
      .catch(() => console.error("Error loading datasets"));
  }, [datasetId]);

  function getValidationErrors() {
    const errors: Partial<Record<CommunityResourceCreateField, boolean>> = {};

    if (!title.trim()) errors.title = true;
    if (!file && !resourceUrl.trim()) errors.resourceUrl = true;
    if (!selectedTypeRef.current) errors.type = true;
    if (!selectedDatasetId) errors.dataset = true;

    return errors;
  }

  function getPublicPageUrl() {
    return activeDataset
      ? `/pages/datasets/${activeDataset.slug}`
      : "/pages/admin/me/community-resources";
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    const selected = files && files.length > 0 ? files[0] : null;

    if (selected && selected.size > 440401920) {
      setFileError("O ficheiro excede o tamanho máximo de 420 MB.");
      setFile(null);
      return;
    }

    setFileError(null);
    setFile(selected);

    if (selected) {
      clearError("resourceUrl");
    }
  }

  function handleDatasetChange(options: { value: string }[]) {
    if (options.length > 0) {
      setSelectedDatasetId(options[0].value);
      clearError("dataset");
      return;
    }

    setSelectedDatasetId("");
    setError("dataset");
  }

  function handleResourceUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setResourceUrl(nextValue);
    if (nextValue.trim()) {
      clearError("resourceUrl");
    }
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setTitle(nextValue);
    if (nextValue.trim()) {
      clearError("title");
    }
  }

  function handleSchemaUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSchemaUrl(event.target.value);
  }

  function handleDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value);
  }

  function handleTypeChange() {
    clearError("type");
  }

  function handleRemoveSelectedDataset() {
    setSelectedDatasetId("");
    setDataset(null);
    clearError("dataset");
  }

  const handleStep1Next = async () => {
    const errors = getValidationErrors();

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      if (errors.dataset) {
        setApiError("Selecione um conjunto de dados antes de continuar.");
      }
      return;
    }

    resetErrors();

    await run(async () => {
      const resource = await createCommunityResource(buildCreatePayload());

      if (file) {
        await uploadCommunityResourceFile(resource.id, file);
      }

      setCreatedResource(resource);
      onPublicPageReady?.(getPublicPageUrl());
      onNextStep();
    });
  };

  const auxiliarItems = [
    {
      title: "Escolher o link correto",
      content:
        "É recomendável criar um link para o próprio arquivo em vez de uma página da web para permitir que o site o analise.",
      hasError: hasError("resourceUrl"),
    },
    {
      title: "Dê um nome ao arquivo",
      content: (
        <>
          Recomenda-se escolher um título que informe claramente qualquer usuário sobre o conteúdo
          do arquivo. Algumas práticas a serem evitadas:
          <ul className="mt-8 list-disc pl-16">
            <li>atribuir um título muito genérico (por exemplo, &quot;list.csv&quot;);</li>
            <li>Dar um título muito longo dificultaria a manipulação do arquivo;</li>
            <li>
              fornecer um título que contenha acentos ou caracteres especiais (problemas de
              interoperabilidade de ficheiros);
            </li>
            <li>
              Dar um título que seja demasiado técnico e derivado de nomenclaturas da indústria.
            </li>
          </ul>
        </>
      ),
      hasError: hasError("title"),
    },
    {
      title: "Publique os tipos de ficheiros corretos.",
      content: (
        <>
          Você pode escolher entre os seguintes tipos:
          <ul className="mt-8 list-disc pl-16">
            <li>Ficheiros principais</li>
            <li>Documentação</li>
            <li>Atualizar</li>
            <li>API</li>
            <li>Código-fonte</li>
            <li>Outro</li>
          </ul>
        </>
      ),
      hasError: hasError("type"),
    },
    {
      title: "Adicionar documentação",
      content: (
        <>
          A descrição de um arquivo facilita a reutilização de dados. Ela inclui, entre outras
          coisas:
          <ul className="mt-8 list-disc pl-16">
            <li>uma descrição geral do conjunto de dados;</li>
            <li>uma descrição do método de produção de dados;</li>
            <li>uma descrição do modelo de dados;</li>
            <li>uma descrição do esquema de dados;</li>
            <li>uma descrição dos metadados;</li>
            <li>Uma descrição das principais mudanças.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Selecione um esquema",
      content:
        "É possível identificar um esquema de dados existente visitando o site schema.data.gouv.fr, que contém uma lista de esquemas de dados existentes.esquema.dados.gouv.fr",
    },
  ];

  const producerOptions = useMemo(
    () =>
      renderDropdownSection("identity", [
        {
          value: "user",
          label: user ? `${user.first_name} ${user.last_name}` : "Eu próprio",
        },
        ...(user?.organizations || []).map((organization) => ({
          value: organization.id,
          label: organization.name,
        })),
      ]),
    [user],
  );

  const typeOptions = useMemo(
    () =>
      renderDropdownSection(
        "types",
        resourceTypes.map((type) => ({ value: type.id, label: type.label })),
      ),
    [resourceTypes],
  );

  const schemaOptions = useMemo(
    () => renderDropdownSection("schemas", buildSchemaItems([])),
    [],
  );

  const datasetOptions = useMemo(
    () =>
      renderDropdownSection(
        "datasets",
        myDatasets.map((item) => ({ value: item.id, label: item.title })),
      ),
    [myDatasets],
  );

  function buildCreatePayload() {
    return {
      title: title.trim(),
      url: normalizeCommunityResourceUrl(resourceUrl, file),
      filetype: "remote" as const,
      type: selectedTypeRef.current || undefined,
      description: description.trim() || undefined,
      dataset: selectedDatasetId,
      ...(selectedProducerRef.current && selectedProducerRef.current !== "user"
        ? { organization: selectedProducerRef.current }
        : {}),
    };
  }

  return (
    <>
      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {currentStep === 1 && (
            <>
              <StatusCard
                variant="informative"
                showIcon
                description={
                  <>
                    <strong>O que é um recurso comunitário?</strong>
                    <br />
                    Um recurso comunitário é um conteúdo adicionado por um usuário, como dados de
                    referência cruzada, para enriquecer ou complementar um recurso comunitário
                    público.
                  </>
                }
              />

              {apiError && (
                <div className="mb-16 mt-32">
                  <StatusCard variant="danger" showIcon description={apiError} />
                </div>
              )}

              <form
                className="admin-page__form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleStep1Next();
                }}
              >
                <p className="pt-32 text-base leading-7 text-neutral-900">
                  Os campos marcados com um asterisco ( * ) são obrigatórios.
                </p>

                <h2 className="admin-page__section-title">Produtor</h2>

                <AdminSelectAdapter
                  label="Verifique a identidade que deseja usar na publicação."
                  placeholder="Para pesquisar..."
                  id="producer-identity"
                  valueRef={selectedProducerRef}
                >
                  {producerOptions}
                </AdminSelectAdapter>

                <div className="admin-page__org-card">
                  <p className="admin-page__org-card-title">Não pertence a nenhuma organização.</p>
                  <p className="admin-page__org-card-description">
                    Quando o conjunto de dados for produzido no contexto de atividade profissional,
                    é recomendável que seja publicado em nome da organização responsável.
                  </p>
                  <a href="/pages/admin/organizations/new" className="admin-page__org-card-link">
                    Crie ou integre uma organização em dados.gov.pt
                    <Icon name="agora-line-arrow-right-circle" className="h-24 w-24" />
                  </a>
                </div>

                <h2 className="admin-page__section-title">Ficheiro ou link</h2>

                <div className="admin-page__fields-group">
                  <div className="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
                    <DragAndDropUploader
                      label="Ficheiros"
                      dragAndDropLabel="Arraste e largue o ficheiro aqui"
                      inputLabel="Selecione ou arraste o ficheiro"
                      selectedFilesLabel="ficheiro selecionado"
                      removeFileButtonLabel="Remover ficheiro"
                      replaceFileButtonLabel="Substituir ficheiro"
                      extensionsInstructions="Tamanho máximo: 420 MB."
                      maxSize={440401920}
                      maxCount={1}
                      maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 420 MB."
                      forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                      hasError={!!fileError}
                      hasFeedback={!!fileError}
                      feedbackState="danger"
                      feedbackText={fileError ?? undefined}
                      onChange={handleFileChange}
                      onSecurityError={() => setFileError(POISONED_FILE_WARNING)}
                    />
                  </div>

                  <div className="admin-page__divider-or">
                    <span className="admin-page__divider-or-text">ou</span>
                  </div>

                  <InputText
                    label={file ? "Link exato para o ficheiro" : "Link exato para o ficheiro *"}
                    placeholder="https://..."
                    id="resource-url"
                    value={resourceUrl}
                    onChange={handleResourceUrlChange}
                    hasError={hasError("resourceUrl")}
                    hasFeedback={hasError("resourceUrl")}
                    feedbackState="danger"
                    errorFeedbackText="Forneça um ficheiro ou um link."
                  />
                </div>

                <h2 className="admin-page__section-title">Descrição</h2>

                <div className="admin-page__fields-group">
                  <InputText
                    label="Título *"
                    placeholder="Insira o título aqui"
                    id="resource-title"
                    value={title}
                    onChange={handleTitleChange}
                    hasError={hasError("title")}
                    hasFeedback={hasError("title")}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />

                  <AdminSelectAdapter
                    label="Tipo *"
                    placeholder="Ficheiros principais"
                    id="resource-type"
                    valueRef={selectedTypeRef}
                    hasError={hasError("type")}
                    errorMessage="Campo obrigatório"
                    onValueChange={handleTypeChange}
                  >
                    {typeOptions}
                  </AdminSelectAdapter>

                  <InputTextArea
                    label="Descrição"
                    placeholder="Insira a descrição aqui"
                    id="resource-description"
                    rows={6}
                    value={description}
                    onChange={handleDescriptionChange}
                  />
                </div>

                <h2 className="admin-page__section-title">Esquema de dados</h2>

                <div className="admin-page__fields-group">
                  <AdminSelectAdapter
                    label="Plano"
                    placeholder="Procure um esquema referenciado em schema.data.gouv.fr..."
                    id="resource-schema"
                    valueRef={selectedSchemaRef}
                  >
                    {schemaOptions}
                  </AdminSelectAdapter>

                  <div className="admin-page__divider-or">
                    <span className="admin-page__divider-or-text">ou</span>
                  </div>

                  <InputText
                    label="Adicione um link para o diagrama"
                    placeholder="https://..."
                    id="resource-schema-url"
                    value={schemaUrl}
                    onChange={handleSchemaUrlChange}
                  />
                </div>

                <h2 className="admin-page__section-title">
                  Associe um conjunto de dados {!datasetId && "*"}
                </h2>

                {activeDataset && (
                  <SelectedDatasetCard
                    dataset={activeDataset}
                    canRemove={!datasetId}
                    onRemove={handleRemoveSelectedDataset}
                  />
                )}

                {!datasetId && !activeDataset && (
                  <InputSelect
                    label="Pesquisar um conjunto de dados *"
                    placeholder="Procurando um conjunto de dados..."
                    id="community-resource-dataset-search"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    hasError={hasError("dataset")}
                    onChange={handleDatasetChange}
                  >
                    {datasetOptions}
                  </InputSelect>
                )}

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
                    type="submit"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "A criar..." : "Seguinte"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {currentStep === 2 && (
            <>
              <StatusCard
                variant="success"
                showIcon
                description={
                  <>
                    <strong>O seu recurso comunitário foi criado!</strong>
                    <br />
                    Veja na página pública.
                  </>
                }
              />

              {createdResource && <CreatedResourceCard resource={createdResource} />}

              {apiError && (
                <div className="mb-16 mt-32">
                  <StatusCard variant="danger" showIcon description={apiError} />
                </div>
              )}
            </>
          )}
        </div>

        {currentStep === 1 && (
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
