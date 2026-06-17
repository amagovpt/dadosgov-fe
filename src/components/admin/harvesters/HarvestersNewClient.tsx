"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  Icon,
  StatusCard,
  Switch,
} from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { createHarvester, previewHarvestSource } from "@/service/api/harvesters";
import type { HarvestPreviewJob, HarvestSourceCreatePayload } from "@/service/types/harvester";
import HarvesterProducerSection from "@/components/admin/harvesters/HarvesterProducerSection";
import HarvesterDescriptionSection from "@/components/admin/harvesters/HarvesterDescriptionSection";
import HarvesterPreviewSection from "@/components/admin/harvesters/HarvesterPreviewSection";
import { getHarvesterAuxiliaryItems } from "@/components/admin/harvesters/harvesterAuxiliaryContent";
import { AdminStepper } from "../AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function HarvestersNewClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

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
    [],
  );

  const filterModeOptions = useMemo(
    () => (
      <DropdownSection name="mode">
        <DropdownOption value="include">Incluir</DropdownOption>
        <DropdownOption value="exclude">Excluir</DropdownOption>
      </DropdownSection>
    ),
    [],
  );

  const filterTypeSelectOptions = useMemo(
    () => (
      <DropdownSection name="type">
        <DropdownOption value="organization">Organização</DropdownOption>
        <DropdownOption value="tag">Marcação</DropdownOption>
      </DropdownSection>
    ),
    [],
  );

  function addFilter() {
    setFilters((previousFilters) => [
      ...previousFilters,
      { mode: "include", type: "organization", value: "" },
    ]);
  }

  function removeFilter(index: number) {
    setFilters((previousFilters) => previousFilters.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateFilter(index: number, field: string, value: string) {
    setFilters((previousFilters) =>
      previousFilters.map((filter, itemIndex) =>
        itemIndex === index ? { ...filter, [field]: value } : filter,
      ),
    );
  }

  function clearError(field: string) {
    if (formErrors[field]) {
      setFormErrors((previousErrors) => {
        const nextErrors = { ...previousErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  }

  function buildPayload(): HarvestSourceCreatePayload {
    const producer = selectedProducerRef.current;
    const backend = selectedTypeRef.current || "dcat";

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
          .filter((filter) => filter.value.trim())
          .map((filter) => ({
            key: filter.type,
            value: filter.value,
            type: filter.mode,
          })),
      }),
    };
  }

  async function handleCreate() {
    if (isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await createHarvester(buildPayload());
      sessionStorage.setItem("createdHarvesterId", created.id);
      router.push(`/pages/admin/harvesters/new?step=3&id=${created.id}`);
    } catch (error: unknown) {
      const normalizedError = error as { data?: { message?: string }; message?: string };
      setCreateError(
        normalizedError?.data?.message ||
          normalizedError?.message ||
          "Erro ao criar o harvester.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStep1Next(event?: React.MouseEvent) {
    event?.preventDefault();

    const errors: Record<string, boolean> = {};
    if (!selectedProducerRef.current || selectedProducerRef.current === "user") {
      errors.harvesterProducer = true;
    }
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
      const job = await previewHarvestSource(buildPayload());
      setPreviewJob(job);
    } catch (error: unknown) {
      const normalizedError = error as { data?: { message?: string }; message?: string };
      setPreviewError(
        normalizedError?.data?.message ||
          normalizedError?.message ||
          "Erro ao pré-visualizar o harvester.",
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  const stepTitles: Record<number, string> = {
    1: "Descreva o seu harvester",
    2: "Visualize o seu harvester",
    3: "Finalize a publicação do seu harvester",
  };

  const auxiliaryItems = getHarvesterAuxiliaryItems({
    hasHarvesterNameError: !!formErrors.harvesterName,
    hasHarvesterUrlError: !!formErrors.harvesterUrl,
  });

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Harvesters", url: "/pages/admin/system/harvesters" },
        {
          label: "Formulário de publicação de um harvester",
          url: "/pages/admin/harvesters/new",
        },
      ]}
      title="Formulário de publicação de um harvester"
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord="Passo"
        labelFormat="slash"
        stepTitle={stepTitles[currentStep] || ""}
      />

      <div className="admin-page__body">
        <div className="admin-page__form-area">
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

                <HarvesterProducerSection
                  organizations={(user?.organizations || []).map((organization) => ({
                    id: organization.id,
                    name: organization.name,
                  }))}
                  selectedProducerRef={selectedProducerRef}
                  hasProducerError={!!formErrors.harvesterProducer}
                  onProducerChange={() => clearError("harvesterProducer")}
                />

                <HarvesterDescriptionSection
                  harvesterName={harvesterName}
                  harvesterDescription={harvesterDescription}
                  harvesterUrl={harvesterUrl}
                  hasHarvesterNameError={!!formErrors.harvesterName}
                  hasHarvesterUrlError={!!formErrors.harvesterUrl}
                  onHarvesterNameChange={(event) => {
                    setHarvesterName(event.target.value);
                    if (event.target.value.trim()) clearError("harvesterName");
                  }}
                  onHarvesterDescriptionChange={(event) =>
                    setHarvesterDescription(event.target.value)
                  }
                  onHarvesterUrlChange={(event) => {
                    setHarvesterUrl(event.target.value);
                    if (event.target.value.trim()) clearError("harvesterUrl");
                  }}
                />

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
                              onChangeCallback={(value) => updateFilter(index, "mode", value)}
                            >
                              {filterModeOptions}
                            </IsolatedSelect>
                            <IsolatedSelect
                              label=""
                              hideLabel
                              placeholder="Organização"
                              id={`filter-type-${index}`}
                              onChangeCallback={(value) => updateFilter(index, "type", value)}
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
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  updateFilter(index, "value", event.target.value)
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

                  {selectedType === "csw-dcat" && (
                    <>
                      <Switch
                        label="GeoDCAT-AP"
                        checked={isGeoDcat}
                        onChange={() => setIsGeoDcat((value) => !value)}
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
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setRemoteUrlPrefix(event.target.value)
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
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setRemoteUrlPrefix(event.target.value)
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

                  {selectedType && (
                    <div className="flex gap-48">
                      <Switch
                        label="Ativado"
                        checked={isEnabled}
                        onChange={() => setIsEnabled((value) => !value)}
                      />
                      <Switch
                        label="Arquivo automático"
                        checked={isAutoArchive}
                        onChange={() => setIsAutoArchive((value) => !value)}
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

          {currentStep === 2 && (
            <HarvesterPreviewSection
              isPreviewing={isPreviewing}
              previewJob={previewJob}
              previewError={previewError}
              isCreating={isCreating}
              onPrevious={() => router.push("/pages/admin/harvesters/new?step=1")}
              onCreate={() => {
                void handleCreate();
              }}
            />
          )}

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
                        : "/pages/admin/system/harvesters",
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

        {currentStep === 1 && <AdminAuxiliarySidebar items={auxiliaryItems} />}
      </div>
    </AdminLayout>
  );
}
