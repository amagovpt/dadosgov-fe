"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputText, InputTextArea } from "@ama-pt/agora-design-system";

interface DataserviceDescriptionSectionProps {
  apiName: string;
  apiAcronym: string;
  apiDescription: string;
  baseApiUrl: string;
  machineDocUrl: string;
  technicalDocUrl: string;
  rateLimiting: string;
  availability: string;
  hasApiNameError: boolean;
  hasApiDescriptionError: boolean;
  onApiNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApiAcronymChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApiDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBaseApiUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMachineDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTechnicalDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRateLimitingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvailabilityChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataserviceDescriptionSection({
  apiName,
  apiAcronym,
  apiDescription,
  baseApiUrl,
  machineDocUrl,
  technicalDocUrl,
  rateLimiting,
  availability,
  hasApiNameError,
  hasApiDescriptionError,
  onApiNameChange,
  onApiAcronymChange,
  onApiDescriptionChange,
  onBaseApiUrlChange,
  onMachineDocUrlChange,
  onTechnicalDocUrlChange,
  onRateLimitingChange,
  onAvailabilityChange,
}: DataserviceDescriptionSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);

  return (
    <>
      <h2 className="admin-page__section-title">{t("admin-dataservices:fields.description")}</h2>

      <div className="admin-page__fields-group">
        <InputText
          label={t("admin-dataservices:fields.apiName")}
          placeholder={t("admin-dataservices:fields.namePlaceholder")}
          id="api-name"
          value={apiName}
          onChange={onApiNameChange}
          hasError={hasApiNameError}
          hasFeedback={hasApiNameError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
        />
        <InputText
          label={t("admin-dataservices:fields.acronym")}
          placeholder={t("admin-dataservices:fields.acronymPlaceholder")}
          id="api-acronym"
          value={apiAcronym}
          onChange={onApiAcronymChange}
        />
        <InputTextArea
          label={t("admin-dataservices:fields.apiDescription")}
          placeholder={t("admin-dataservices:fields.descriptionPlaceholder")}
          id="api-description"
          rows={4}
          maxLength={246}
          value={apiDescription}
          onChange={onApiDescriptionChange}
          hasError={hasApiDescriptionError}
          hasFeedback={hasApiDescriptionError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
        />
        <InputText
          label={t("admin-dataservices:fields.baseApiUrl")}
          placeholder={t("admin-dataservices:fields.urlPlaceholder")}
          id="api-root-link"
          value={baseApiUrl}
          onChange={onBaseApiUrlChange}
        />
        <InputText
          label={t("admin-dataservices:fields.machineDocUrl")}
          placeholder={t("admin-dataservices:fields.urlPlaceholder")}
          id="api-doc-openapi"
          value={machineDocUrl}
          onChange={onMachineDocUrlChange}
        />
        <InputText
          label={t("admin-dataservices:fields.technicalDocUrl")}
          placeholder={t("admin-dataservices:fields.urlPlaceholder")}
          id="api-doc-technical"
          value={technicalDocUrl}
          onChange={onTechnicalDocUrlChange}
        />
        <InputText
          label={t("admin-dataservices:fields.rateLimiting")}
          placeholder={t("admin-dataservices:fields.shortPlaceholder")}
          id="api-rate-limit"
          value={rateLimiting}
          onChange={onRateLimitingChange}
        />
        <InputText
          label={t("admin-dataservices:fields.availability")}
          placeholder="99,9"
          id="api-availability"
          value={availability}
          onChange={onAvailabilityChange}
        />
      </div>
    </>
  );
}
