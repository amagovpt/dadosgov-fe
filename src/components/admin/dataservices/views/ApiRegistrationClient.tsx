"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import { createDataservice, updateDataservice } from "@/service/api/dataservices";
import { fetchDataset, fetchMyDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { searchDatasets } from "@/service/api/search";
import {
  AUDIENCE_CONDITIONS,
  AUDIENCE_ROLES,
  RESTRICTION_REASONS,
} from "@/utils/dataserviceLabels";
import type { Dataservice } from "@/service/types/dataservice";
import type { Dataset } from "@/service/types/dataset";
import { useAuth } from "@/context/AuthContext";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import ApiRegistrationDatasetsStep from "@/components/admin/dataservices/registration-steps/ApiRegistrationDatasetsStep";
import ApiRegistrationPublishStep from "@/components/admin/dataservices/registration-steps/ApiRegistrationPublishStep";
import DataserviceProducerSection from "@/components/admin/dataservices/form-sections/DataserviceProducerSection";
import DataserviceDescriptionSection from "@/components/admin/dataservices/form-sections/DataserviceDescriptionSection";
import DataserviceAccessSection from "@/components/admin/dataservices/form-sections/DataserviceAccessSection";
import DataserviceTermsSection from "@/components/admin/dataservices/form-sections/DataserviceTermsSection";
import { getCreateDataserviceAuxiliaryItems } from "@/components/admin/dataservices/config/dataserviceAuxiliaryContent";
import type { BoDataservicesPage } from "@/service/types/admin/dataservices";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ApiRegistrationClientProps {
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  pageContent: BoDataservicesPage;
}

export default function ApiRegistrationClient({
  currentStep,
  onNextStep,
  onPreviousStep,
  pageContent,
}: ApiRegistrationClientProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const { user } = useAuth();
  const [accessType, setAccessType] = useState("open");
  const [producer, setProducer] = useState("");
  const [apiName, setApiName] = useState("");
  const [apiAcronym, setApiAcronym] = useState("");
  const [apiDescription, setApiDescription] = useState("");
  const [baseApiUrl, setBaseApiUrl] = useState("");
  const [machineDocUrl, setMachineDocUrl] = useState("");
  const [technicalDocUrl, setTechnicalDocUrl] = useState("");
  const [rateLimiting, setRateLimiting] = useState("");
  const [availability, setAvailability] = useState("");
  const [rateLimitingUrl, setRateLimitingUrl] = useState("");
  const [accessAudiences, setAccessAudiences] = useState<Record<string, string>>({});
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [authRequestUrl, setAuthRequestUrl] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDataservice, setCreatedDataservice] = useState<Dataservice | null>(null);

  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [dropdownDatasets, setDropdownDatasets] = useState<Dataset[]>([]);
  const [linkDatasets, setLinkDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  const [datasetLinkUrl, setDatasetLinkUrl] = useState("");
  const [datasetLinkError, setDatasetLinkError] = useState<string | null>(null);
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [isLinkingDatasets, setIsLinkingDatasets] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { hasError, setErrors, clearError, resetErrors, focusFirstError } = useFormErrors<
    "apiName" | "apiDescription"
  >();

  useEffect(() => {
    const dedupe = (items: Dataset[]) => Array.from(new Map(items.map((d) => [d.id, d])).values());
    const personal = fetchMyDatasets(1, 100);
    const orgs = (user?.organizations || []).map((org) => fetchOrgDatasets(org.id, 1, 100));

    Promise.all([personal, ...orgs])
      .then((results) => setMyDatasets(dedupe(results.flatMap((result) => result.data || []))))
      .catch(() => {});
  }, [user?.organizations]);

  useEffect(() => {
    const q = datasetSearch.trim();
    if (q.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const result = await searchDatasets(q, 1, 20);
        setDatasetSearchResults(result.data || []);
      } catch {
        setDatasetSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [datasetSearch]);

  const selectedDatasets = useMemo(() => {
    const seen = new Set<string>();
    return [...dropdownDatasets, ...linkDatasets].filter((dataset) => {
      if (seen.has(dataset.id)) return false;
      seen.add(dataset.id);
      return true;
    });
  }, [dropdownDatasets, linkDatasets]);

  const availableDatasets = useMemo(() => {
    const combined: Dataset[] = [...dropdownDatasets, ...datasetSearchResults, ...myDatasets];
    const seen = new Set<string>();
    return combined.filter((dataset) => {
      if (seen.has(dataset.id) || dataset.archived || dataset.deleted) return false;
      seen.add(dataset.id);
      return true;
    });
  }, [dropdownDatasets, datasetSearchResults, myDatasets]);

  async function handleStep1Next() {
    const errors: Partial<Record<"apiName" | "apiDescription", string>> = {};
    if (!apiName.trim()) errors.apiName = t("admin-dataservices:form.validationErrors.name");
    if (!apiDescription.trim()) {
      errors.apiDescription = t("admin-dataservices:form.validationErrors.description");
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setApiError(null);
    setIsSubmitting(true);

    const isRestricted = accessType === "restricted";
    const audiences = isRestricted
      ? AUDIENCE_ROLES.filter((role) => accessAudiences[role.role]).map((role) => ({
          role: role.role,
          condition: accessAudiences[role.role],
        }))
      : undefined;
    const usesOtherReason = reasonCategory === "other";

    try {
      const dataservice = await createDataservice({
        title: apiName.trim(),
        organization: producer && producer !== "user" ? producer : undefined,
        description: apiDescription.trim(),
        acronym: apiAcronym.trim() || undefined,
        base_api_url: baseApiUrl.trim() || undefined,
        machine_documentation_url: machineDocUrl.trim() || undefined,
        technical_documentation_url: technicalDocUrl.trim() || undefined,
        business_documentation_url: businessDocUrl.trim() || undefined,
        authorization_request_url: authRequestUrl.trim() || undefined,
        rate_limiting: rateLimiting.trim() || undefined,
        rate_limiting_url: rateLimitingUrl.trim() || undefined,
        availability: availability.trim() ? parseFloat(availability) : undefined,
        access_type: accessType,
        access_audiences: audiences,
        access_type_reason_category:
          isRestricted && reasonCategory && !usesOtherReason ? reasonCategory : undefined,
        access_type_reason:
          isRestricted && usesOtherReason ? reasonText.trim() || undefined : undefined,
        private: true,
      });

      setCreatedDataservice(dataservice);
      onNextStep();
    } catch (error: unknown) {
      setApiError(normalizeApiError(error, t("admin-dataservices:form.createError")).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDropdownChange(ids: string[]) {
    setDropdownDatasets(availableDatasets.filter((dataset) => ids.includes(dataset.id)));
  }

  function removeDataset(id: string) {
    setDropdownDatasets((previous) => previous.filter((dataset) => dataset.id !== id));
    setLinkDatasets((previous) => previous.filter((dataset) => dataset.id !== id));
  }

  async function handleAddDatasetLink() {
    const raw = datasetLinkUrl.trim();
    if (!raw) return;
    setDatasetLinkError(null);

    let slug = "";
    try {
      const path = new URL(raw).pathname;
      slug = path.split("/").filter(Boolean).pop() || "";
    } catch {
      slug = raw.split("/").filter(Boolean).pop() || "";
    }

    if (!slug) {
      setDatasetLinkError(t("admin-dataservices:edit.invalidDatasetUrl"));
      return;
    }

    setIsResolvingLink(true);
    try {
      const dataset = await fetchDataset(slug);
      if (selectedDatasets.some((selectedDataset) => selectedDataset.id === dataset.id)) {
        setDatasetLinkError(t("admin-dataservices:edit.datasetAlreadyAdded"));
        return;
      }
      setLinkDatasets((previous) => [...previous, dataset]);
      setDatasetLinkUrl("");
    } catch {
      setDatasetLinkError(t("admin-dataservices:edit.datasetNotFound"));
    } finally {
      setIsResolvingLink(false);
    }
  }

  async function handleStep2Next() {
    if (createdDataservice && selectedDatasets.length > 0) {
      setIsLinkingDatasets(true);
      try {
        await updateDataservice(createdDataservice.id, {
          datasets: selectedDatasets.map((dataset) => dataset.id),
        });
      } catch (error) {
        console.error("Error linking datasets to dataservice:", error);
      } finally {
        setIsLinkingDatasets(false);
      }
    }
    onNextStep();
  }

  async function handlePublish() {
    if (!createdDataservice) return;
    setIsPublishing(true);
    setApiError(null);
    try {
      await updateDataservice(createdDataservice.id, { private: false });
      window.location.href = createdDataservice.slug
        ? `/dataservices/${createdDataservice.slug}`
        : "/admin/dataservices";
    } catch {
      setApiError(t("admin-dataservices:edit.publishError"));
      setIsPublishing(false);
    }
  }

  function handleSaveDraft() {
    window.location.href = "/admin/dataservices";
  }

  const auxiliaryItems = getCreateDataserviceAuxiliaryItems({
    items: pageContent.createAuxiliaryItems,
  });

  return (
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

            {apiError && <StatusCard variant="danger" showIcon description={apiError} />}

            <form
              className="admin-page__form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleStep1Next();
              }}
            >
              <p className="pt-32 text-base leading-7 text-neutral-900">
                {t("admin-dataservices:form.requiredFields")}
              </p>

              <DataserviceProducerSection
                displayName={
                  user ? `${user.first_name} ${user.last_name}` : t("admin-dataservices:form.me")
                }
                organizations={(user?.organizations || []).map((organization) => ({
                  id: organization.id,
                  name: organization.name,
                }))}
                helper={pageContent.producerHelper}
                initialValue={producer}
                onValueChange={setProducer}
              />

              <DataserviceDescriptionSection
                apiName={apiName}
                apiAcronym={apiAcronym}
                apiDescription={apiDescription}
                baseApiUrl={baseApiUrl}
                machineDocUrl={machineDocUrl}
                technicalDocUrl={technicalDocUrl}
                availability={availability}
                hasApiNameError={hasError("apiName")}
                hasApiDescriptionError={hasError("apiDescription")}
                showRateLimiting={false}
                onApiNameChange={(event) => {
                  setApiName(event.target.value);
                  if (event.target.value.trim()) clearError("apiName");
                }}
                onApiAcronymChange={(event) => setApiAcronym(event.target.value)}
                onApiDescriptionChange={(event) => {
                  setApiDescription(event.target.value);
                  if (event.target.value.trim()) clearError("apiDescription");
                }}
                onBaseApiUrlChange={(event) => setBaseApiUrl(event.target.value)}
                onMachineDocUrlChange={(event) => setMachineDocUrl(event.target.value)}
                onTechnicalDocUrlChange={(event) => setTechnicalDocUrl(event.target.value)}
                onAvailabilityChange={(event) => setAvailability(event.target.value)}
              />

              <DataserviceAccessSection
                accessType={accessType}
                authRequestUrl={authRequestUrl}
                businessDocUrl={businessDocUrl}
                accountAccessValue="open_with_account"
                accessAudiences={accessAudiences}
                audienceRoles={AUDIENCE_ROLES}
                audienceConditions={AUDIENCE_CONDITIONS}
                reasonCategory={reasonCategory}
                restrictionReasons={RESTRICTION_REASONS}
                reasonText={reasonText}
                onAccessTypeChange={setAccessType}
                onAudienceChange={(role, value) =>
                  setAccessAudiences((previous) => ({ ...previous, [role]: value }))
                }
                onReasonCategoryChange={setReasonCategory}
                onReasonTextChange={(event) => setReasonText(event.target.value)}
                onAuthRequestUrlChange={(event) => setAuthRequestUrl(event.target.value)}
                onBusinessDocUrlChange={(event) => setBusinessDocUrl(event.target.value)}
              />

              <DataserviceTermsSection
                rateLimiting={rateLimiting}
                rateLimitingUrl={rateLimitingUrl}
                onRateLimitingChange={(event) => setRateLimiting(event.target.value)}
                onRateLimitingUrlChange={(event) => setRateLimitingUrl(event.target.value)}
              />

              <AdminStepActions
                primaryAction={{
                  label: isSubmitting
                    ? t("admin-dataservices:form.creating")
                    : t("admin-dataservices:form.next"),
                  type: "submit",
                  hasIcon: true,
                  trailingIcon: "agora-line-arrow-right-circle",
                  trailingIconHover: "agora-solid-arrow-right-circle",
                  disabled: isSubmitting,
                }}
              />
            </form>
          </>
        )}

        {currentStep === 2 && (
          <ApiRegistrationDatasetsStep
            availableDatasets={availableDatasets}
            selectedDatasets={selectedDatasets}
            dropdownDatasets={dropdownDatasets}
            datasetLinkUrl={datasetLinkUrl}
            datasetLinkError={datasetLinkError}
            isResolvingLink={isResolvingLink}
            isLinking={isLinkingDatasets}
            onSearchInputChange={setDatasetSearch}
            onDropdownChange={handleDropdownChange}
            onRemoveDataset={removeDataset}
            onDatasetLinkUrlChange={(value) => {
              setDatasetLinkUrl(value);
              if (datasetLinkError) setDatasetLinkError(null);
            }}
            onAddDatasetLink={handleAddDatasetLink}
            onPreviousStep={onPreviousStep}
            onNextStep={handleStep2Next}
            datasetLinksInfo={pageContent.datasetLinksInfo}
          />
        )}

        {currentStep === 3 && (
          <ApiRegistrationPublishStep
            createdDataservice={createdDataservice}
            apiName={apiName}
            apiDescription={apiDescription}
            createdCard={pageContent.createdCard}
            apiError={apiError}
            isPublishing={isPublishing}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />
        )}
      </div>

      {currentStep === 1 && auxiliaryItems.length > 0 ? (
        <AdminAuxiliarySidebar items={auxiliaryItems} />
      ) : null}
    </div>
  );
}
