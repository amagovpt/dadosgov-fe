"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import { createHarvester, previewHarvestSource } from "@/service/api/harvesters";
import type { HarvestPreviewJob } from "@/service/types/harvester";
import HarvesterProducerSection from "@/components/admin/harvesters/form-sections/HarvesterProducerSection";
import { useHarvesterProducerOptions } from "@/components/admin/harvesters/hooks/useHarvesterProducerOptions";
import HarvesterDescriptionSection from "@/components/admin/harvesters/form-sections/HarvesterDescriptionSection";
import HarvesterImplementationSection from "@/components/admin/harvesters/form-sections/HarvesterImplementationSection";
import { useHarvesterBackendOptions } from "@/components/admin/harvesters/hooks/useHarvesterBackendOptions";
import HarvesterPreviewSection from "@/components/admin/harvesters/form-sections/HarvesterPreviewSection";
import HarvesterPublishStep from "@/components/admin/harvesters/form-steps/HarvesterPublishStep";
import { getCreateHarvesterAuxiliaryItems } from "@/components/admin/harvesters/config/harvesterAuxiliaryContent";
import { AdminStepper } from "@/components/admin/AdminStepper";
import { getAdminStepTitle } from "@/components/admin/getAdminStepTitle";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { BoHarvestersPage } from "@/service/types/admin/harvesters";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import {
  buildHarvesterCreatePayload,
  type HarvesterFormField,
  validateHarvesterDetails,
} from "@/components/admin/harvesters/form-state/harvesterFormModel";

interface HarvestersNewClientProps {
  pageContent: BoHarvestersPage;
}

export default function HarvestersNewClient({ pageContent }: HarvestersNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const producer = useHarvesterProducerOptions();
  const backendOptions = useHarvesterBackendOptions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const pageTitle = pageContent.createHero?.title ?? "";

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
  const { hasError, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors<HarvesterFormField>();

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

  function buildPayload() {
    return buildHarvesterCreatePayload({
      name: harvesterName,
      description: harvesterDescription,
      url: harvesterUrl,
      producer: selectedProducerRef.current,
      backend: selectedTypeRef.current,
      active: isEnabled,
      autoarchive: isAutoArchive,
      filters,
    });
  }

  async function handleCreate() {
    if (isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await createHarvester(buildPayload());
      sessionStorage.setItem("createdHarvesterId", created.id);
      router.push(`/admin/harvesters/new?step=3&id=${created.id}`);
    } catch (error: unknown) {
      setCreateError(normalizeApiError(error, t("admin-harvesters:form.createError")).message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStep1Next(event?: React.MouseEvent) {
    event?.preventDefault();

    const errors = validateHarvesterDetails({
      producer: selectedProducerRef.current,
      name: harvesterName,
      url: harvesterUrl,
      backend: selectedTypeRef.current,
      requireOrganizationProducer: true,
      requireBackend: true,
      messages: {
        harvesterProducer: t("admin-harvesters:form.validationErrors.producer"),
        harvesterName: t("admin-harvesters:form.validationErrors.name"),
        harvesterUrl: t("admin-harvesters:form.validationErrors.url"),
        harvesterType: t("admin-harvesters:form.validationErrors.type"),
      },
    });

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewJob(null);
    router.push("/admin/harvesters/new?step=2");

    try {
      const job = await previewHarvestSource(buildPayload());
      setPreviewJob(job);
    } catch (error: unknown) {
      setPreviewError(normalizeApiError(error, t("admin-harvesters:form.previewError")).message);
    } finally {
      setIsPreviewing(false);
    }
  }

  const stepTitle = getAdminStepTitle(pageContent.steps?.[currentStep - 1]);

  const auxiliaryItems = getCreateHarvesterAuxiliaryItems({
    items: pageContent.createAuxiliaryItems,
  });

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-harvesters:title"), url: "/admin/system/harvesters" },
        {
          label: pageTitle,
          url: "/admin/harvesters/new",
        },
      ]}
      title={pageTitle}
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
        labelFormat="slash"
        stepTitle={stepTitle}
      />

      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {currentStep === 1 && (
            <>
              {pageContent.introduction ? (
                <StatusCard
                  variant="informative"
                  showIcon
                  description={
                    <>
                      <strong>{pageContent.introduction.title}</strong>
                      <br />
                      {formatHtmlParagraphs(pageContent.introduction.description)}
                    </>
                  }
                />
              ) : null}

              <form
                className="admin-page__form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleStep1Next();
                }}
              >
                <p className="pt-32 text-base leading-7 text-neutral-900">
                  {t("admin-harvesters:form.requiredFields")}
                </p>

                <HarvesterProducerSection
                  organizations={producer.organizations}
                  selectedProducerRef={selectedProducerRef}
                  hasProducerError={hasError("harvesterProducer")}
                  onProducerChange={(value) => {
                    producer.rememberSelection(value);
                    clearError("harvesterProducer");
                  }}
                  searchable={producer.isSearchable}
                  onSearch={producer.onSearch}
                  searchNoResultsText={producer.noResultsText}
                  hasNoEligibleOrganization={producer.hasNoEligibleOrganization}
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
                  backends={backendOptions.backends}
                  typeNoResultsText={backendOptions.noResultsText}
                  hasNoBackend={backendOptions.hasNoBackend}
                  hasTypeError={hasError("harvesterType")}
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
                    if (value) clearError("harvesterType");
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
                    label: t("admin-harvesters:form.next"),
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
              onPrevious={() => router.push("/admin/harvesters/new?step=1")}
              onCreate={() => {
                void handleCreate();
              }}
            />
          )}

          {currentStep === 3 && (
            <HarvesterPublishStep
              createError={createError}
              createdPendingCard={pageContent.createdPendingCard}
              onViewInAdmin={() =>
                router.push(
                  createdHarvesterId
                    ? `/admin/harvesters/${createdHarvesterId}`
                    : "/admin/system/harvesters",
                )
              }
              onRequestValidation={() => router.push("/ajuda-e-contactos")}
            />
          )}
        </div>

        {currentStep === 1 && auxiliaryItems.length > 0 ? (
          <AdminAuxiliarySidebar items={auxiliaryItems} />
        ) : null}
      </div>
    </AdminLayout>
  );
}
