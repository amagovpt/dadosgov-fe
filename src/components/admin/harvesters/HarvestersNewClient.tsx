"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusCard } from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import { createHarvester, previewHarvestSource } from "@/service/api/harvesters";
import type { HarvestPreviewJob, HarvestSourceCreatePayload } from "@/service/types/harvester";
import HarvesterProducerSection from "@/components/admin/harvesters/HarvesterProducerSection";
import HarvesterDescriptionSection from "@/components/admin/harvesters/HarvesterDescriptionSection";
import HarvesterImplementationSection from "@/components/admin/harvesters/HarvesterImplementationSection";
import HarvesterPreviewSection from "@/components/admin/harvesters/HarvesterPreviewSection";
import HarvesterPublishStep from "@/components/admin/harvesters/HarvesterPublishStep";
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
  const { hasError, setErrors, clearError, resetErrors, focusFirstError } = useFormErrors();

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
      setCreateError(normalizeApiError(error, "Erro ao criar o harvester.").message);
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
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewJob(null);
    router.push("/pages/admin/harvesters/new?step=2");

    try {
      const job = await previewHarvestSource(buildPayload());
      setPreviewJob(job);
    } catch (error: unknown) {
      setPreviewError(normalizeApiError(error, "Erro ao pré-visualizar o harvester.").message);
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
    hasHarvesterNameError: hasError("harvesterName"),
    hasHarvesterUrlError: hasError("harvesterUrl"),
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

                <HarvesterProducerSection
                  organizations={(user?.organizations || []).map((organization) => ({
                    id: organization.id,
                    name: organization.name,
                  }))}
                  selectedProducerRef={selectedProducerRef}
                  hasProducerError={hasError("harvesterProducer")}
                  onProducerChange={() => clearError("harvesterProducer")}
                />

                <HarvesterDescriptionSection
                  harvesterName={harvesterName}
                  harvesterDescription={harvesterDescription}
                  harvesterUrl={harvesterUrl}
                  hasHarvesterNameError={hasError("harvesterName")}
                  hasHarvesterUrlError={hasError("harvesterUrl")}
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

                <HarvesterImplementationSection
                  selectedTypeRef={selectedTypeRef}
                  selectedType={selectedType}
                  filters={filters}
                  isGeoDcat={isGeoDcat}
                  showRemoteUrlPrefix={showRemoteUrlPrefix}
                  remoteUrlPrefix={remoteUrlPrefix}
                  isEnabled={isEnabled}
                  isAutoArchive={isAutoArchive}
                  onTypeChange={(value) => {
                    setSelectedType(value);
                    setShowRemoteUrlPrefix(false);
                    setRemoteUrlPrefix("");
                    setIsGeoDcat(false);
                    setFilters([]);
                  }}
                  onAddFilter={addFilter}
                  onRemoveFilter={removeFilter}
                  onUpdateFilter={updateFilter}
                  onToggleGeoDcat={() => setIsGeoDcat((value) => !value)}
                  onShowRemoteUrlPrefix={() => setShowRemoteUrlPrefix(true)}
                  onRemoteUrlPrefixChange={(event) => setRemoteUrlPrefix(event.target.value)}
                  onClearRemoteUrlPrefix={() => {
                    setShowRemoteUrlPrefix(false);
                    setRemoteUrlPrefix("");
                  }}
                  onToggleEnabled={() => setIsEnabled((value) => !value)}
                  onToggleAutoArchive={() => setIsAutoArchive((value) => !value)}
                />

                <AdminStepActions
                  primaryAction={{
                    label: "Seguinte",
                    type: "submit",
                    hasIcon: true,
                    trailingIcon: "agora-line-arrow-right-circle",
                    trailingIconHover: "agora-solid-arrow-right-circle",
                  }}
                />
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
            <HarvesterPublishStep
              createError={createError}
              onViewInAdmin={() =>
                router.push(
                  createdHarvesterId
                    ? `/pages/admin/harvesters/${createdHarvesterId}`
                    : "/pages/admin/system/harvesters",
                )
              }
              onRequestValidation={() => router.push("/pages/support")}
            />
          )}
        </div>

        {currentStep === 1 && <AdminAuxiliarySidebar items={auxiliaryItems} />}
      </div>
    </AdminLayout>
  );
}
