"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Button,
  InputText,
  InputTextArea,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Icon,
  StatusCard,
  CardLinks,
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
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import AuxiliarList from "@/components/admin/AuxiliarList";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";
import { formatMetricValue } from "@/utils/formatNumber";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useAsyncSubmit } from "@/hooks/forms/useAsyncSubmit";
import { normalizeApiError } from "@/service/utils/normalizeApiError";

interface CommunityResourceFormClientProps {
  datasetId: string;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onPublicPageReady?: (url: string) => void;
}

type CommunityResourceCreateField = "title" | "resourceUrl" | "type" | "dataset";

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
    if (selectedDatasetId) {
      fetchDataset(selectedDatasetId)
        .then(setDataset)
        .catch(() => console.error("Error loading dataset"));
    } else {
      setDataset(null);
    }

    fetchResourceTypes()
      .then(setResourceTypes)
      .catch(() => console.error("Error loading resource types"));

    if (!datasetId) {
      fetchMyDatasets(1, 50)
        .then((response) => setMyDatasets(response.data || []))
        .catch(() => console.error("Error loading datasets"));
    }
  }, [datasetId, selectedDatasetId]);

  const handleStep1Next = async () => {
    const errors: Partial<Record<CommunityResourceCreateField, boolean>> = {};

    if (!title.trim()) errors.title = true;
    if (!file && !resourceUrl.trim()) errors.resourceUrl = true;
    if (!selectedTypeRef.current) errors.type = true;
    if (!selectedDatasetId) errors.dataset = true;

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      if (errors.dataset) {
        setApiError("Selecione um conjunto de dados antes de continuar.");
      }
      return;
    }

    resetErrors();

    const finalUrl = file
      ? "https://example.com/placeholder"
      : resourceUrl.trim().match(/^https?:\/\//)
        ? resourceUrl.trim()
        : `https://${resourceUrl.trim()}`;

    await run(async () => {
      const resource = await createCommunityResource({
        title: title.trim(),
        url: finalUrl,
        filetype: "remote",
        type: selectedTypeRef.current || undefined,
        description: description.trim() || undefined,
        dataset: selectedDatasetId,
        ...(selectedProducerRef.current && selectedProducerRef.current !== "user"
          ? { organization: selectedProducerRef.current }
          : {}),
      });

      if (file) {
        await uploadCommunityResourceFile(resource.id, file);
      }

      setCreatedResource(resource);
      const publicUrl = dataset ? `/pages/datasets/${dataset.slug}` : "/pages/admin/me/community-resources";
      onPublicPageReady?.(publicUrl);
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
    () => (
      <DropdownSection name="identity">
        <DropdownOption value="user">
          {user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
        </DropdownOption>
        <>
          {(user?.organizations || []).map((organization) => (
            <DropdownOption key={organization.id} value={organization.id}>
              {organization.name}
            </DropdownOption>
          ))}
        </>
      </DropdownSection>
    ),
    [user],
  );

  const typeOptions = useMemo(
    () => (
      <DropdownSection name="types">
        {resourceTypes.map((type) => (
          <DropdownOption key={type.id} value={type.id}>
            {type.label}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [resourceTypes],
  );

  const schemaOptions = useMemo(
    () => (
      <DropdownSection name="schemas">
        <DropdownOption value="">Nenhum</DropdownOption>
      </DropdownSection>
    ),
    [],
  );

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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const files = event.target.files;
                        const selected = files && files.length > 0 ? files[0] : null;
                        if (selected && selected.size > 440401920) {
                          setFileError("O ficheiro excede o tamanho máximo de 420 MB.");
                          setFile(null);
                          return;
                        }
                        setFileError(null);
                        setFile(selected);
                        if (selected) clearError("resourceUrl");
                      }}
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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setResourceUrl(event.target.value);
                      if (event.target.value.trim()) clearError("resourceUrl");
                    }}
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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setTitle(event.target.value);
                      if (event.target.value.trim()) clearError("title");
                    }}
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
                    onValueChange={() => clearError("type")}
                  >
                    {typeOptions}
                  </AdminSelectAdapter>

                  <InputTextArea
                    label="Descrição"
                    placeholder="Insira a descrição aqui"
                    id="resource-description"
                    rows={6}
                    value={description}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDescription(event.target.value)
                    }
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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setSchemaUrl(event.target.value)
                    }
                  />
                </div>

                <h2 className="admin-page__section-title">
                  Associe um conjunto de dados {!datasetId && "*"}
                </h2>

                {dataset && (
                  <div className="agora-card-links-datasets-px0 mt-16">
                    <CardLinks
                      onClick={() => {}}
                      className="cursor-pointer text-neutral-900"
                      variant="transparent"
                      image={{
                        src: dataset.organization?.logo || "/images/placeholders/organization.png",
                        alt: dataset.organization?.name || "Organização sem logo",
                      }}
                      category={dataset.organization?.name}
                      title={dataset.title}
                      description={
                        <div className="flex flex-col gap-12">
                          <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                            {dataset.description}
                          </p>
                          <div className="mt-8 flex flex-wrap items-center gap-8">
                            <span className="text-sm font-medium text-neutral-900">
                              Metadados:{" "}
                              {dataset.quality?.score != null
                                ? Math.round(dataset.quality.score * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="text-xs mb-32 mt-32 flex flex-wrap items-center gap-32 text-[#034AD8]">
                            <div className="flex items-center gap-8" title="Visualizações">
                              <Icon name="agora-line-eye" className="" aria-hidden="true" />
                              <span>{formatMetricValue(dataset.metrics?.views)}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Downloads">
                              <Icon name="agora-line-download" className="" aria-hidden="true" />
                              <span>
                                {formatMetricValue(dataset.metrics?.resources_downloads, 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-8" title="Reutilizações">
                              <img src="/Icons/bar_chart.svg" className="" alt="" aria-hidden="true" />
                              <span>{dataset.metrics?.reuses || 0}</span>
                            </div>
                            <div className="flex items-center gap-8" title="Favoritos">
                              <img src="/Icons/favorite.svg" className="" alt="" aria-hidden="true" />
                              <span>{formatMetricValue(dataset.metrics?.followers, 0)}</span>
                            </div>
                          </div>
                        </div>
                      }
                      date={
                        <span className="font-[300]">
                          {`Atualizado há ${formatDistanceToNow(new Date(dataset.last_modified), {
                            locale: pt,
                          })
                            .replace("aproximadamente ", "")
                            .replace("quase ", "")
                            .replace("menos de ", "")
                            .replace("cerca de ", "")}`}
                        </span>
                      }
                      mainLink={
                        <Link href={`/pages/datasets/${dataset.slug}`}>
                          <span className="underline">{dataset.title}</span>
                        </Link>
                      }
                      blockedLink={true}
                    />
                    {!datasetId && (
                      <div className="mt-8 flex justify-end">
                        <Button
                          appearance="solid"
                          variant="danger"
                          hasIcon
                          leadingIcon="agora-line-trash"
                          leadingIconHover="agora-solid-trash"
                          onClick={() => {
                            setSelectedDatasetId("");
                            setDataset(null);
                            clearError("dataset");
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!datasetId && !dataset && (
                  <InputSelect
                    label="Pesquisar um conjunto de dados *"
                    placeholder="Procurando um conjunto de dados..."
                    id="community-resource-dataset-search"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    hasError={hasError("dataset")}
                    onChange={(options) => {
                      if (options.length > 0) {
                        setSelectedDatasetId(options[0].value);
                        clearError("dataset");
                        return;
                      }
                      setSelectedDatasetId("");
                      setError("dataset");
                    }}
                  >
                    <DropdownSection name="datasets">
                      {myDatasets.map((item) => (
                        <DropdownOption key={item.id} value={item.id}>
                          {item.title}
                        </DropdownOption>
                      ))}
                    </DropdownSection>
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

              {createdResource && (
                <>
                  <CardLinks
                    onClick={() => {}}
                    className="cursor-pointer text-neutral-900"
                    variant="transparent"
                    category={createdResource.format ? createdResource.format.toUpperCase() : "Recurso"}
                    title={<div className="text-xl-bold underline">{createdResource.title}</div>}
                    description={
                      <div className="mt-8 flex flex-col gap-4 pb-32">
                        <p className="text-sm text-neutral-900">
                          Atualizado hoje
                          {createdResource.format
                            ? ` –  ${createdResource.format.toUpperCase()}`
                            : ""}
                          {createdResource.filesize
                            ? ` (${
                                createdResource.filesize >= 1048576
                                  ? (createdResource.filesize / 1048576)
                                      .toFixed(1)
                                      .replace(".", ",") + " MB"
                                  : createdResource.filesize >= 1024
                                    ? (createdResource.filesize / 1024)
                                        .toFixed(1)
                                        .replace(".", ",") + " KB"
                                    : createdResource.filesize + " B"
                              })`
                            : ""}
                        </p>
                        {createdResource.url && (
                          <p className="text-sm mt-8 flex items-center gap-8 text-neutral-900">
                            <Icon name="agora-line-map-pin" className="h-16 w-16" />
                            Localização:{" "}
                            {(() => {
                              try {
                                return new URL(createdResource.url).hostname;
                              } catch {
                                return createdResource.url;
                              }
                            })()}
                          </p>
                        )}
                        {createdResource.checksum && (
                          <p className="text-sm mt-8 flex items-center gap-8 text-neutral-900">
                            <Icon name="agora-line-code" className="h-16 w-16" />
                            Soma de verificação: {createdResource.checksum.value}
                          </p>
                        )}
                      </div>
                    }
                    date={<span className="font-[300]">Atualizado hoje</span>}
                    blockedLink={true}
                  />
                  <div className="admin-page__actions mt-8 flex justify-end gap-[18px]">
                    {createdResource.dataset?.page && (
                      <Button
                        appearance="link"
                        variant="primary"
                        hasIcon
                        trailingIcon="agora-line-external-link"
                        trailingIconHover="agora-solid-external-link"
                        onClick={() => window.open(createdResource.dataset!.page, "_blank")}
                      >
                        Ver na página pública
                      </Button>
                    )}
                  </div>
                </>
              )}

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
