"use client";

import React, { useState, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  Button,
  DropdownSection,
  DropdownOption,
  InputText,
  InputTextArea,
  Icon,
  StatusCard,
  Switch,
  Pill,
} from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";
import AuxiliarList from "@/components/admin/AuxiliarList";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { createHarvester, previewHarvestSource } from "@/services/api";
import { HarvestSourceCreatePayload, HarvestPreviewJob } from "@/types/api";
import TextLink from "@/components/Primitives/TextLink";

export default function HarvestersNewClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const totalSegments = 12;
  const filledSegments = Math.round((currentStep / totalSteps) * totalSegments);

  const [harvesterName, setHarvesterName] = useState("");
  const [harvesterDescription, setHarvesterDescription] = useState("");
  const [harvesterUrl, setHarvesterUrl] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAutoArchive, setIsAutoArchive] = useState(true);
  const [filters, setFilters] = useState<{ mode: string; type: string; value: string }[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [isGeoDcat, setIsGeoDcat] = useState(false);
  const [showRemoteUrlPrefix, setShowRemoteUrlPrefix] = useState(false);
  const [remoteUrlPrefix, setRemoteUrlPrefix] = useState("");

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewJob, setPreviewJob] = useState<HarvestPreviewJob | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createdHarvesterId =
    searchParams.get("id") ||
    (typeof window !== "undefined" ? sessionStorage.getItem("createdHarvesterId") : null);

  const selectedProducerRef = useRef("");
  const selectedTypeRef = useRef("");
  const filterModeRefs = useRef<Record<number, React.MutableRefObject<string>>>({});
  const filterTypeRefs = useRef<Record<number, React.MutableRefObject<string>>>({});

  const getFilterModeRef = (index: number) => {
    if (!filterModeRefs.current[index]) {
      filterModeRefs.current[index] = { current: "include" };
    }
    return filterModeRefs.current[index];
  };

  const getFilterTypeRef = (index: number) => {
    if (!filterTypeRefs.current[index]) {
      filterTypeRefs.current[index] = { current: "organization" };
    }
    return filterTypeRefs.current[index];
  };

  const producerOptions = useMemo(() => {
    const options = (user?.organizations || []).map((org) => (
      <DropdownOption key={org.id} value={org.id}>
        {org.name}
      </DropdownOption>
    ));
    return <DropdownSection name="identity">{options}</DropdownSection>;
  }, [user]);

  const typeOptions = useMemo(
    () => (
      <DropdownSection name="types">
        <DropdownOption value="dcat">DCAT</DropdownOption>
        <DropdownOption value="csw-dcat">CSW-DCAT</DropdownOption>
        <DropdownOption value="csw-iso-19139">CSW-ISO-19139</DropdownOption>
        <DropdownOption value="ckan">CKAN</DropdownOption>
        <DropdownOption value="ckanpt">CKAN PT</DropdownOption>
        <DropdownOption value="dkan">DKAN</DropdownOption>
        <DropdownOption value="cswudata">CSW</DropdownOption>
        <DropdownOption value="odspt">OpenDataSoft PT</DropdownOption>
        <DropdownOption value="maaf">MAAF</DropdownOption>
        <DropdownOption value="ogc">OGC</DropdownOption>
      </DropdownSection>
    ),
    []
  );

  const filterModeOptions = useMemo(
    () => (
      <DropdownSection name="mode">
        <DropdownOption value="include">Incluir</DropdownOption>
        <DropdownOption value="exclude">Excluir</DropdownOption>
      </DropdownSection>
    ),
    []
  );

  const filterTypeSelectOptions = useMemo(
    () => (
      <DropdownSection name="type">
        <DropdownOption value="organization">Organização</DropdownOption>
        <DropdownOption value="tag">Marcação</DropdownOption>
      </DropdownSection>
    ),
    []
  );

  const addFilter = () => {
    setFilters((prev) => [...prev, { mode: "include", type: "organization", value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
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

  const buildPayload = (): HarvestSourceCreatePayload => {
    const producer = selectedProducerRef.current;
    const backend = selectedTypeRef.current || "dcat";
    /*console.log("[harvester] buildPayload:", {
      name: harvesterName,
      url: harvesterUrl,
      backend,
      producer,
      typeRef: selectedTypeRef.current,
    });*/
    return {
      name: harvesterName,
      url: harvesterUrl,
      backend,
      active: isEnabled,
      autoarchive: isAutoArchive,
      ...(harvesterDescription.trim() && {
        description: harvesterDescription,
      }),
      ...(producer && producer !== "user" && { organization: producer }),
      ...(filters.length > 0 && {
        filters: filters
          .filter((f) => f.value.trim())
          .map((f) => ({
            key: f.type,
            value: f.value,
            type: f.mode,
          })),
      }),
    };
  };

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createHarvester(buildPayload());
      sessionStorage.setItem("createdHarvesterId", created.id);
      router.push(`/pages/admin/harvesters/new?step=3&id=${created.id}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      setCreateError(error?.data?.message || error?.message || "Erro ao criar o harvester.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStep1Next = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    const errors: Record<string, boolean> = {};
    if (!selectedProducerRef.current || selectedProducerRef.current === "user")
      errors.harvesterProducer = true;
    if (!harvesterName.trim()) errors.harvesterName = true;
    if (!harvesterUrl.trim()) errors.harvesterUrl = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewJob(null);
    router.push("/pages/admin/harvesters/new?step=2");

    try {
      const payload = buildPayload();
      const job = await previewHarvestSource(payload);
      setPreviewJob(job);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      setPreviewError(
        error?.data?.message || error?.message || "Erro ao pré-visualizar o harvester."
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const stepTitles: Record<number, string> = {
    1: "Descreva o seu harvester",
    2: "Visualize o seu harvester",
    3: "Finalize a publicação do seu harvester",
  };

  const auxiliarItems = [
    {
      title: "Escolher a organização",
      content: (
        <>
          <p className="auxiliar-list__content !p-0">
            A criação de um harvester de dados deve ser feita em nome de uma organização e requer
            permissões de administrador.
          </p>
          <p className="auxiliar-list__content mt-8 !p-0">
            Selecione uma organização da qual seja administrador. Se a sua organização ainda não
            existir, terá de a criar primeiro através deste{" "}
            <TextLink href="/pages/admin/organizations/new" className="auxiliar-list__content !p-0">
              link ↗
            </TextLink>
            .
          </p>
        </>
      ),
    },
    {
      title: "Dar um nome",
      content:
        "Dê um nome ao seu harvester. Esta é uma referência interna que o ajudará a identificá-lo caso crie vários harvesters. O nome do seu harvester não será público.",
      hasError: !!formErrors.harvesterName,
    },
    {
      title: "Descrever o seu harvester",
      content:
        "Adicione informações no campo de descrição para uso interno. Este campo é opcional.",
    },
    {
      title: "Adicionar o URL",
      content:
        "Insira o URL do portal que pretende ligar. Normalmente corresponde ao URL da página inicial do seu portal de dados abertos. Este URL permite ao harvester percorrer o portal e recolher todos os seus conjuntos de dados.",
      hasError: !!formErrors.harvesterUrl,
    },
    {
      title: "Identificar o tipo de implementação",
      content:
        "Escolha o formato dos metadados (ex.:, DCAT, CKAN, etc.). Esse formato permite que o harvester saiba como ler e interpretar os metadados, para que possam ser transcritos corretamente em dados.gov.pt",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Harvesters", url: "/pages/admin/system/harvesters" },
            {
              label: "Formulário de publicação de um harvester",
              url: "/pages/admin/harvesters/new",
            },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Formulário de publicação de um harvester</h1>
        <PublishDropdown />
      </div>

      {/* Step indicator */}
      <div className="admin-page__step-header">
        <p className="admin-page__step-text">
          <span className="font-bold text-primary-600">Passo {currentStep} - </span>
          <span className="font-bold text-primary-900">{stepTitles[currentStep]}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="admin-page__stepper">
        <div className="admin-page__stepper-bar">
          <div className="admin-page__stepper-mark admin-page__stepper-mark--start" />
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={`admin-page__stepper-segment ${
                i < filledSegments ? "admin-page__stepper-segment--filled" : ""
              }`}
            />
          ))}
          <div className="admin-page__stepper-mark admin-page__stepper-mark--end" />
        </div>
        <span className="admin-page__stepper-label">
          Passo {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Main content area */}
      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {/* Step 1: Descreva o seu harvester */}
          {currentStep === 1 && (
            <>
              <StatusCard
                variant="informative"
                showIcon
                description={
                  <>
                    <strong>O que é um harvester?</strong>
                    <br />
                    Um harvester é um mecanismo para recolher metadados a partir de um catálogo e
                    armazená-los noutra plataforma, garantindo o acesso aos dados.
                  </>
                }
              />

              <form className="admin-page__form">
                <p className="pt-32 text-base leading-7 text-neutral-900">
                  Os campos marcados com um asterisco ( * ) são obrigatórios.
                </p>

                <h2 className="admin-page__section-title">Produtor</h2>

                <div className="admin-page__fields-group">
                  <IsolatedSelect
                    key={`producer-${user?.organizations?.length ?? 0}`}
                    label="Confirme a identidade que pretende utilizar na publicação. *"
                    placeholder="Selecione o produtor..."
                    id="harvester-producer"
                    onChangeRef={selectedProducerRef}
                    onChangeCallback={() => clearError("harvesterProducer")}
                    hasError={!!formErrors.harvesterProducer}
                    errorFeedbackText="Selecione uma organização"
                    required
                  >
                    {producerOptions}
                  </IsolatedSelect>
                </div>

                <h2 className="admin-page__section-title">Descrição</h2>

                <div className="admin-page__fields-group">
                  <InputText
                    label="Nome *"
                    placeholder="Insira o nome aqui"
                    id="harvester-name"
                    value={harvesterName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setHarvesterName(e.target.value);
                      if (e.target.value.trim()) clearError("harvesterName");
                    }}
                    hasError={!!formErrors.harvesterName}
                    hasFeedback={!!formErrors.harvesterName}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                    required
                  />

                  <InputTextArea
                    label="Descrição"
                    placeholder="Insira a descrição aqui"
                    id="harvester-description"
                    rows={6}
                    value={harvesterDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setHarvesterDescription(e.target.value)
                    }
                  />

                  <InputText
                    label="URL *"
                    placeholder="Insira o url aqui"
                    id="harvester-url"
                    value={harvesterUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setHarvesterUrl(e.target.value);
                      if (e.target.value.trim()) clearError("harvesterUrl");
                    }}
                    hasError={!!formErrors.harvesterUrl}
                    hasFeedback={!!formErrors.harvesterUrl}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                    required
                  />
                </div>

                <h2 className="admin-page__section-title">Implementação</h2>

                <div className="admin-page__fields-group">
                  <IsolatedSelect
                    label="Tipo"
                    placeholder="Selecione um tipo..."
                    id="harvester-type"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChangeRef={selectedTypeRef}
                    onChangeCallback={(value) => {
                      setSelectedType(value);
                      setShowRemoteUrlPrefix(false);
                      setRemoteUrlPrefix("");
                      setIsGeoDcat(false);
                      setFilters([]);
                    }}
                  >
                    {typeOptions}
                  </IsolatedSelect>

                  {/* CKAN / CKANPT: Filtros */}
                  {(selectedType === "ckan" || selectedType === "ckanpt") && (
                    <div>
                      <p className="text-base font-medium leading-7 text-primary-900">Filtros</p>

                      {filters.map((filter, index) => (
                        <div
                          key={index}
                          className={`mb-8 mt-8 pb-16 ${index < filters.length - 1 ? "border-b border-neutral-200" : ""}`}
                        >
                          <div className="flex items-center gap-8">
                            <IsolatedSelect
                              label=""
                              hideLabel
                              placeholder="Incluir"
                              id={`filter-mode-${index}`}
                              onChangeRef={getFilterModeRef(index)}
                            >
                              {filterModeOptions}
                            </IsolatedSelect>
                            <IsolatedSelect
                              label=""
                              hideLabel
                              placeholder="Organização"
                              id={`filter-type-${index}`}
                              onChangeRef={getFilterTypeRef(index)}
                            >
                              {filterTypeSelectOptions}
                            </IsolatedSelect>
                          </div>
                          <div className="mt-8 flex items-center gap-8">
                            <div className="flex-1">
                              <InputText
                                label=""
                                hideLabel
                                placeholder=""
                                id={`filter-value-${index}`}
                                value={filter.value}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateFilter(index, "value", e.target.value)
                                }
                              />
                            </div>
                            <Button
                              variant="danger"
                              hasIcon
                              iconOnly
                              leadingIcon="agora-line-trash"
                              leadingIconHover="agora-solid-trash"
                              onClick={() => removeFilter(index)}
                              aria-label="Excluir filtro"
                            >
                              {" "}
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        appearance="link"
                        variant="primary"
                        hasIcon
                        leadingIcon="agora-line-plus-circle"
                        leadingIconHover="agora-solid-plus-circle"
                        onClick={addFilter}
                      >
                        Adicionar um filtro
                      </Button>
                    </div>
                  )}

                  {/* CSW-DCAT: GeoDCAT-AP switch + remote URL prefix toggle */}
                  {selectedType === "csw-dcat" && (
                    <>
                      <Switch
                        label="GeoDCAT-AP"
                        checked={isGeoDcat}
                        onChange={() => setIsGeoDcat((v) => !v)}
                      />

                      {!showRemoteUrlPrefix ? (
                        <div className="flex justify-start">
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            leadingIcon="agora-line-plus-circle"
                            leadingIconHover="agora-solid-plus-circle"
                            onClick={() => setShowRemoteUrlPrefix(true)}
                          >
                            Configurar prefixo de URL remoto
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-medium leading-7 text-primary-900">
                            Prefixo de URL remoto
                          </p>
                          <div className="mt-8 flex items-center gap-8">
                            <div className="flex-1">
                              <InputText
                                label=""
                                hideLabel
                                placeholder=""
                                id="remote-url-prefix"
                                value={remoteUrlPrefix}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setRemoteUrlPrefix(e.target.value)
                                }
                              />
                            </div>
                            <Button
                              appearance="outline"
                              variant="neutral"
                              hasIcon
                              leadingIcon="agora-line-trash"
                              leadingIconHover="agora-solid-trash"
                              onClick={() => {
                                setShowRemoteUrlPrefix(false);
                                setRemoteUrlPrefix("");
                              }}
                            >
                              EXCLUIR
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* CSW-ISO-19139: remote URL prefix toggle */}
                  {selectedType === "csw-iso-19139" && (
                    <>
                      {!showRemoteUrlPrefix ? (
                        <div className="flex justify-start">
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            leadingIcon="agora-line-plus-circle"
                            leadingIconHover="agora-solid-plus-circle"
                            onClick={() => setShowRemoteUrlPrefix(true)}
                          >
                            Configurar prefixo de URL remoto
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-medium leading-7 text-primary-900">
                            Prefixo de URL remoto
                          </p>
                          <div className="mt-8 flex items-center gap-8">
                            <div className="flex-1">
                              <InputText
                                label=""
                                hideLabel
                                placeholder=""
                                id="remote-url-prefix"
                                value={remoteUrlPrefix}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setRemoteUrlPrefix(e.target.value)
                                }
                              />
                            </div>
                            <Button
                              appearance="outline"
                              variant="neutral"
                              hasIcon
                              leadingIcon="agora-line-trash"
                              leadingIconHover="agora-solid-trash"
                              onClick={() => {
                                setShowRemoteUrlPrefix(false);
                                setRemoteUrlPrefix("");
                              }}
                            >
                              EXCLUIR
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Switches: only when a type is selected */}
                  {selectedType && (
                    <div className="flex gap-48">
                      <Switch
                        label="Ativado"
                        checked={isEnabled}
                        onChange={() => setIsEnabled((v) => !v)}
                      />
                      <Switch
                        label="Arquivo automático"
                        checked={isAutoArchive}
                        onChange={() => setIsAutoArchive((v) => !v)}
                      />
                    </div>
                  )}
                </div>

                <div className="admin-page__actions">
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep1Next}
                  >
                    Seguinte
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 2: Visualize */}
          {currentStep === 2 && (
            <div className="admin-page__form">
              {isPreviewing && (
                <StatusCard
                  variant="informative"
                  showIcon
                  description={
                    <>
                      <strong>A pré-visualizar o harvester...</strong>
                      <br />
                      Por favor aguarde enquanto o harvester é testado.
                    </>
                  }
                />
              )}

              <div className="mb-24 flex flex-col gap-8">
                <p className="text-sm flex items-center gap-6 text-neutral-900">
                  <Icon name="agora-line-calendar" className="h-16 w-16" />
                  Iniciado em:{" "}
                  {previewJob?.started
                    ? new Date(previewJob.started).toLocaleString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : isPreviewing
                      ? "..."
                      : "—"}
                </p>
                <p className="text-sm flex items-center gap-6 text-neutral-900">
                  <Icon name="agora-line-calendar" className="h-16 w-16" />
                  Terminado em:{" "}
                  {previewJob?.ended
                    ? new Date(previewJob.ended).toLocaleString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : isPreviewing
                      ? "..."
                      : "—"}
                </p>
                <p className="text-sm flex items-center gap-6 text-neutral-900">
                  Estado:{" "}
                  <Pill
                    variant={
                      previewJob
                        ? previewJob.status === "done"
                          ? "success"
                          : previewJob.status === "failed" || previewJob.status === "done-errors"
                            ? "danger"
                            : "neutral"
                        : "neutral"
                    }
                  >
                    {previewJob
                      ? previewJob.status === "done"
                        ? "Concluído"
                        : previewJob.status === "failed"
                          ? "Erro"
                          : previewJob.status === "done-errors"
                            ? "Concluído com erros"
                            : previewJob.status === "processing"
                              ? "Em processamento"
                              : "Pendente"
                      : isPreviewing
                        ? "Em processamento"
                        : "Pendente"}
                  </Pill>
                </p>
                <p className="text-sm flex items-center gap-12 text-neutral-900">
                  Elementos:
                  <span className="flex items-center gap-4">
                    <Icon name="agora-line-check" className="h-16 w-16" />{" "}
                    {previewJob?.items.filter((i) => i.status === "done").length ?? 0}
                  </span>
                  <span className="flex items-center gap-4">
                    <Icon name="agora-line-alert-triangle" className="h-16 w-16" />{" "}
                    {previewJob?.items.filter((i) => i.status === "failed").length ?? 0}
                  </span>
                  <span className="flex items-center gap-4">
                    <Icon name="agora-line-info-mark" className="h-16 w-16" />{" "}
                    {previewJob?.items.filter((i) => i.status === "skipped").length ?? 0}
                  </span>
                  <span className="flex items-center gap-4">
                    <Icon name="agora-line-x" className="h-16 w-16" />{" "}
                    {previewJob?.items.filter(
                      (i) => i.status === "pending" || i.status === "started"
                    ).length ?? 0}
                  </span>
                  ({previewJob?.items.length ?? 0} no total)
                </p>
              </div>

              <h2 className="admin-page__section-title">Erros</h2>

              {previewJob && previewJob.errors.length > 0 ? (
                previewJob.errors.map((error, index) => (
                  <StatusCard
                    key={index}
                    variant="danger"
                    showIcon
                    description={
                      <>
                        <strong>ERRO</strong> {error.message}
                      </>
                    }
                  />
                ))
              ) : previewError ? (
                <StatusCard
                  variant="danger"
                  showIcon
                  description={
                    <>
                      <strong>ERRO</strong> {previewError}
                    </>
                  }
                />
              ) : !isPreviewing ? (
                <p className="text-sm text-neutral-700">Nenhum erro encontrado.</p>
              ) : null}

              <p className="text-sm mt-24 font-semibold uppercase text-neutral-700">
                {previewJob?.items.length ?? 0} itens
              </p>

              <div className="admin-page__actions">
                <Button
                  appearance="outline"
                  variant="neutral"
                  hasIcon
                  leadingIcon="agora-line-arrow-left-circle"
                  leadingIconHover="agora-solid-arrow-left-circle"
                  onClick={() => router.push("/pages/admin/harvesters/new?step=1")}
                >
                  Anterior
                </Button>
                <Button
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? "A criar..." : "Seguinte"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Finalizar */}
          {currentStep === 3 && (
            <div className="admin-page__form">
              {createError && (
                <StatusCard
                  variant="danger"
                  showIcon
                  description={
                    <>
                      <strong>Erro ao criar o harvester</strong>
                      <br />
                      {createError}
                    </>
                  }
                />
              )}

              {!createError && (
                <StatusCard
                  variant="warning"
                  showIcon
                  description={
                    <>
                      <strong>
                        O seu harvester foi criado e está a aguardar validação pela equipa de
                        administração.
                      </strong>
                      <br />
                      Informe-nos através do formulário de contacto abaixo se deseja que validemos o
                      seu harvester. Será notificado da aprovação (ou rejeição).
                    </>
                  }
                />
              )}

              <div className="mt-16 flex justify-start">
                <PublicationFeedbackButton />
              </div>

              <div className="admin-page__actions">
                <Button
                  appearance="outline"
                  variant="neutral"
                  onClick={() =>
                    router.push(
                      createdHarvesterId
                        ? `/pages/admin/harvesters/${createdHarvesterId}`
                        : "/pages/admin/system/harvesters"
                    )
                  }
                >
                  Ver na administração
                </Button>
                <Button
                  appearance="outline"
                  variant="neutral"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/pages/support")}
                >
                  Solicitar validação do harvester
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Auxiliar sidebar (only for step 1) */}
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
    </div>
  );
}
