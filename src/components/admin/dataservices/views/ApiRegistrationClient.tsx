"use client";

import React, { useEffect, useMemo, useState } from "react";
import { StatusCard } from "@ama-pt/agora-design-system";
import { createDataservice, updateDataservice } from "@/service/api/dataservices";
import { fetchDataset, fetchMyDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { searchDatasets } from "@/service/api/search";
import { AUDIENCE_ROLES } from "@/utils/dataserviceLabels";
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
import { getDataserviceAuxiliaryItems } from "@/components/admin/dataservices/config/dataserviceAuxiliaryContent";

interface ApiRegistrationClientProps {
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

export default function ApiRegistrationClient({
  currentStep,
  onNextStep,
  onPreviousStep,
}: ApiRegistrationClientProps) {
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

  // Dataset linking (step 2) — mirrors the edit flow: preload the user's own +
  // their orgs' datasets, search the whole portal, and allow adding by URL.
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
  const { hasError, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors<"apiName" | "apiDescription">();

  async function handleStep1Next() {
    const errors: Partial<Record<"apiName" | "apiDescription", string>> = {};
    if (!apiName.trim()) errors.apiName = "Indique o nome da API.";
    if (!apiDescription.trim()) errors.apiDescription = "Descreva a API.";

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
      ? AUDIENCE_ROLES.filter((r) => accessAudiences[r.role]).map((r) => ({
          role: r.role,
          condition: accessAudiences[r.role],
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
      setApiError(normalizeApiError(error, "Erro ao criar a API. Tente novamente.").message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Preload the dataset pool (user's own + their organizations' datasets).
  useEffect(() => {
    const dedupe = (items: Dataset[]) =>
      Array.from(new Map(items.map((d) => [d.id, d])).values());
    const personal = fetchMyDatasets(1, 100);
    const orgs = (user?.organizations || []).map((org) => fetchOrgDatasets(org.id, 1, 100));
    Promise.all([personal, ...orgs])
      .then((results) => setMyDatasets(dedupe(results.flatMap((r) => r.data || []))))
      .catch(() => {});
  }, [user?.organizations]);

  // Search datasets across the whole portal when the user types (debounced).
  useEffect(() => {
    const q = datasetSearch.trim();
    if (q.length < 2) return;
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

  // Deduped union of both buckets — the persisted/displayed selection.
  const selectedDatasets = useMemo(() => {
    const seen = new Set<string>();
    return [...dropdownDatasets, ...linkDatasets].filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [dropdownDatasets, linkDatasets]);

  // Options offered by the search multi-select (excludes archived/deleted).
  const availableDatasets = (() => {
    const combined: Dataset[] = [...dropdownDatasets, ...datasetSearchResults, ...myDatasets];
    const seen = new Set<string>();
    return combined.filter((d) => {
      if (seen.has(d.id) || d.archived || d.deleted) return false;
      seen.add(d.id);
      return true;
    });
  })();

  function handleDropdownChange(ids: string[]) {
    setDropdownDatasets(availableDatasets.filter((d) => ids.includes(d.id)));
  }

  function removeDataset(id: string) {
    setDropdownDatasets((prev) => prev.filter((d) => d.id !== id));
    setLinkDatasets((prev) => prev.filter((d) => d.id !== id));
  }

  // Resolve a pasted dados.gov.pt dataset URL to a portal dataset and add it.
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
      setDatasetLinkError("URL inválido. Cole o link de um conjunto de dados deste portal.");
      return;
    }

    setIsResolvingLink(true);
    try {
      const dataset = await fetchDataset(slug);
      if (selectedDatasets.some((d) => d.id === dataset.id)) {
        setDatasetLinkError("Este conjunto de dados já foi adicionado.");
        return;
      }
      setLinkDatasets((prev) => [...prev, dataset]);
      setDatasetLinkUrl("");
    } catch {
      setDatasetLinkError("Conjunto de dados não encontrado neste portal.");
    } finally {
      setIsResolvingLink(false);
    }
  }

  // Attach the selected datasets to the created dataservice before advancing.
  async function handleStep2Next() {
    if (createdDataservice && selectedDatasets.length > 0) {
      setIsLinkingDatasets(true);
      try {
        await updateDataservice(createdDataservice.id, {
          datasets: selectedDatasets.map((d) => d.id),
        });
      } catch (error) {
        console.error("Error linking datasets to dataservice:", error);
      } finally {
        setIsLinkingDatasets(false);
      }
    }
    onNextStep();
  }

  // Step 3: the API was created as a draft (private: true) in step 1. Publishing
  // flips it public and redirects to the API's public page; saving keeps it as a
  // draft and returns to the list.
  async function handlePublish() {
    if (!createdDataservice) return;
    setIsPublishing(true);
    setApiError(null);
    try {
      await updateDataservice(createdDataservice.id, { private: false });
      window.location.href = createdDataservice.slug
        ? `/dataservices/${createdDataservice.slug}`
        : "/admin/me/dataservices";
    } catch {
      setApiError("Erro ao publicar a API. Tente novamente.");
      setIsPublishing(false);
    }
  }

  function handleSaveDraft() {
    window.location.href = "/admin/me/dataservices";
  }

  const auxiliaryItems = getDataserviceAuxiliaryItems({
    hasApiNameError: hasError("apiName"),
    hasApiDescriptionError: hasError("apiDescription"),
  });

  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        {currentStep === 1 && (
          <>
            <StatusCard
              variant="informative"
              showIcon
              description={
                <>
                  <strong>O que é uma API?</strong>
                  <br />
                  Uma API é uma ferramenta informática que permite que um website ou software se
                  comunique com outro computador e troque dados.
                </>
              }
            />

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
                Os campos marcados com um asterisco ( * ) são obrigatórios.
              </p>

              <DataserviceProducerSection
                displayName={user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
                organizations={(user?.organizations || []).map((organization) => ({
                  id: organization.id,
                  name: organization.name,
                }))}
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
                rateLimiting={rateLimiting}
                rateLimitingUrl={rateLimitingUrl}
                availability={availability}
                hasApiNameError={hasError("apiName")}
                hasApiDescriptionError={hasError("apiDescription")}
                onApiNameChange={(event) => {
                  setApiName(event.target.value);
                  if (event.target.value.trim()) {
                    clearError("apiName");
                  }
                }}
                onApiAcronymChange={(event) => setApiAcronym(event.target.value)}
                onApiDescriptionChange={(event) => {
                  setApiDescription(event.target.value);
                  if (event.target.value.trim()) {
                    clearError("apiDescription");
                  }
                }}
                onBaseApiUrlChange={(event) => setBaseApiUrl(event.target.value)}
                onMachineDocUrlChange={(event) => setMachineDocUrl(event.target.value)}
                onTechnicalDocUrlChange={(event) => setTechnicalDocUrl(event.target.value)}
                onRateLimitingChange={(event) => setRateLimiting(event.target.value)}
                onRateLimitingUrlChange={(event) => setRateLimitingUrl(event.target.value)}
                onAvailabilityChange={(event) => setAvailability(event.target.value)}
              />

              <DataserviceAccessSection
                accessType={accessType}
                authRequestUrl={authRequestUrl}
                businessDocUrl={businessDocUrl}
                accessAudiences={accessAudiences}
                reasonCategory={reasonCategory}
                reasonText={reasonText}
                onAccessTypeChange={setAccessType}
                onAudienceChange={(role, value) =>
                  setAccessAudiences((prev) => ({ ...prev, [role]: value }))
                }
                onReasonCategoryChange={setReasonCategory}
                onReasonTextChange={(event) => setReasonText(event.target.value)}
                onAuthRequestUrlChange={(event) => setAuthRequestUrl(event.target.value)}
                onBusinessDocUrlChange={(event) => setBusinessDocUrl(event.target.value)}
              />

              <AdminStepActions
                primaryAction={{
                  label: isSubmitting ? "A criar..." : "Seguinte",
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
          />
        )}

        {currentStep === 3 && (
          <ApiRegistrationPublishStep
            createdDataservice={createdDataservice}
            apiName={apiName}
            apiDescription={apiDescription}
            apiError={apiError}
            isPublishing={isPublishing}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />
        )}
      </div>

      {currentStep === 1 && <AdminAuxiliarySidebar items={auxiliaryItems} />}
    </div>
  );
}
