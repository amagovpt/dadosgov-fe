"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputText, InputTextArea } from "@ama-pt/agora-design-system";

interface HarvesterDescriptionSectionProps {
  harvesterName: string;
  harvesterDescription: string;
  harvesterUrl: string;
  hasHarvesterNameError: boolean;
  hasHarvesterUrlError: boolean;
  namePlaceholder?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  urlPlaceholder?: string;
  onHarvesterNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onHarvesterDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onHarvesterUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function HarvesterDescriptionSection({
  harvesterName,
  harvesterDescription,
  harvesterUrl,
  hasHarvesterNameError,
  hasHarvesterUrlError,
  namePlaceholder,
  descriptionLabel,
  descriptionPlaceholder,
  urlPlaceholder,
  onHarvesterNameChange,
  onHarvesterDescriptionChange,
  onHarvesterUrlChange,
}: HarvesterDescriptionSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const resolvedNamePlaceholder = namePlaceholder ?? t("admin-harvesters:fields.namePlaceholder");
  const resolvedDescriptionLabel = descriptionLabel ?? t("admin-harvesters:fields.description");
  const resolvedDescriptionPlaceholder =
    descriptionPlaceholder ?? t("admin-harvesters:fields.descriptionPlaceholder");
  const resolvedUrlPlaceholder = urlPlaceholder ?? t("admin-harvesters:fields.urlPlaceholder");

  return (
    <>
      <h2 className="admin-page__section-title">{t("admin-harvesters:fields.description")}</h2>

      <div className="admin-page__fields-group">
        <InputText
          label={t("admin-harvesters:fields.name")}
          placeholder={resolvedNamePlaceholder}
          id="harvester-name"
          value={harvesterName}
          onChange={onHarvesterNameChange}
          hasError={hasHarvesterNameError}
          hasFeedback={hasHarvesterNameError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
          required
        />

        <InputTextArea
          label={resolvedDescriptionLabel}
          placeholder={resolvedDescriptionPlaceholder}
          id="harvester-description"
          rows={6}
          value={harvesterDescription}
          onChange={onHarvesterDescriptionChange}
        />

        <InputText
          label={`${t("admin-harvesters:detail.fields.url")} *`}
          placeholder={resolvedUrlPlaceholder}
          id="harvester-url"
          value={harvesterUrl}
          onChange={onHarvesterUrlChange}
          hasError={hasHarvesterUrlError}
          hasFeedback={hasHarvesterUrlError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
          required
        />
      </div>
    </>
  );
}
