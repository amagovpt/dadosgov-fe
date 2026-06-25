"use client";

import React, { useState } from "react";
import { StatusCard } from "@ama-pt/agora-design-system";
import { createDataservice } from "@/service/api/dataservices";
import type { Dataservice } from "@/service/types/dataservice";
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
  const [apiName, setApiName] = useState("");
  const [apiAcronym, setApiAcronym] = useState("");
  const [apiDescription, setApiDescription] = useState("");
  const [baseApiUrl, setBaseApiUrl] = useState("");
  const [machineDocUrl, setMachineDocUrl] = useState("");
  const [technicalDocUrl, setTechnicalDocUrl] = useState("");
  const [rateLimiting, setRateLimiting] = useState("");
  const [availability, setAvailability] = useState("");
  const [authRequestUrl, setAuthRequestUrl] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDataservice, setCreatedDataservice] = useState<Dataservice | null>(null);
  const [datasetLinks, setDatasetLinks] = useState([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
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

    try {
      const dataservice = await createDataservice({
        title: apiName.trim(),
        description: apiDescription.trim(),
        acronym: apiAcronym.trim() || undefined,
        base_api_url: baseApiUrl.trim() || undefined,
        machine_documentation_url: machineDocUrl.trim() || undefined,
        technical_documentation_url: technicalDocUrl.trim() || undefined,
        business_documentation_url: businessDocUrl.trim() || undefined,
        authorization_request_url: authRequestUrl.trim() || undefined,
        rate_limiting: rateLimiting.trim() || undefined,
        availability: availability.trim() ? parseFloat(availability) : undefined,
        access_type: accessType,
        private: true,
      });

      setCreatedDataservice(dataservice);
      handleStepChange(onNextStep);
    } catch (error: unknown) {
      setApiError(normalizeApiError(error, "Erro ao criar a API. Tente novamente.").message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDatasetUrlChange(index: number, value: string) {
    const updatedLinks = [...datasetLinks];
    updatedLinks[index] = { url: value };
    setDatasetLinks(updatedLinks);

    if (value.trim() && datasetLinkErrors[index]) {
      setDatasetLinkErrors((previousErrors) => {
        const nextErrors = { ...previousErrors };
        delete nextErrors[index];
        return nextErrors;
      });
    }
  }

  function addDatasetLink() {
    const lastIndex = datasetLinks.length - 1;
    if (!datasetLinks[lastIndex].url.trim()) {
      setDatasetLinkErrors((previousErrors) => ({
        ...previousErrors,
        [lastIndex]: "Campo obrigatório",
      }));
      return;
    }

    setDatasetLinks((previousLinks) => [...previousLinks, { url: "" }]);
  }

  function removeDatasetLink(index: number) {
    setDatasetLinks((previousLinks) => previousLinks.filter((_, itemIndex) => itemIndex !== index));
    setDatasetLinkErrors((previousErrors) => {
      const nextErrors: Record<number, string> = {};
      Object.entries(previousErrors).forEach(([key, value]) => {
        const errorIndex = Number(key);
        if (errorIndex < index) nextErrors[errorIndex] = value;
        else if (errorIndex > index) nextErrors[errorIndex - 1] = value;
      });
      return nextErrors;
    });
  }

  function handleStepChange(callback: () => void) {
    setDatasetLinkErrors({});
    callback();
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
              />

              <DataserviceDescriptionSection
                apiName={apiName}
                apiAcronym={apiAcronym}
                apiDescription={apiDescription}
                baseApiUrl={baseApiUrl}
                machineDocUrl={machineDocUrl}
                technicalDocUrl={technicalDocUrl}
                rateLimiting={rateLimiting}
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
                onAvailabilityChange={(event) => setAvailability(event.target.value)}
              />

              <DataserviceAccessSection
                accessType={accessType}
                authRequestUrl={authRequestUrl}
                businessDocUrl={businessDocUrl}
                onAccessTypeChange={setAccessType}
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
            datasetLinks={datasetLinks}
            datasetLinkErrors={datasetLinkErrors}
            onDatasetUrlChange={handleDatasetUrlChange}
            onRemoveDatasetLink={removeDatasetLink}
            onAddDatasetLink={addDatasetLink}
            onPreviousStep={() => handleStepChange(onPreviousStep)}
            onNextStep={() => handleStepChange(onNextStep)}
          />
        )}

        {currentStep === 3 && (
          <ApiRegistrationPublishStep
            createdDataservice={createdDataservice}
            apiName={apiName}
            apiDescription={apiDescription}
          />
        )}
      </div>

      {currentStep === 1 && <AdminAuxiliarySidebar items={auxiliaryItems} />}
    </div>
  );
}
