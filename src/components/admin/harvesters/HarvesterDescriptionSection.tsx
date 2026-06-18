"use client";

import React from "react";
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
  namePlaceholder = "Insira o nome aqui",
  descriptionLabel = "Descrição",
  descriptionPlaceholder = "Insira a descrição aqui",
  urlPlaceholder = "Insira o url aqui",
  onHarvesterNameChange,
  onHarvesterDescriptionChange,
  onHarvesterUrlChange,
}: HarvesterDescriptionSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Descrição</h2>

      <div className="admin-page__fields-group">
        <InputText
          label="Nome *"
          placeholder={namePlaceholder}
          id="harvester-name"
          value={harvesterName}
          onChange={onHarvesterNameChange}
          hasError={hasHarvesterNameError}
          hasFeedback={hasHarvesterNameError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
          required
        />

        <InputTextArea
          label={descriptionLabel}
          placeholder={descriptionPlaceholder}
          id="harvester-description"
          rows={6}
          value={harvesterDescription}
          onChange={onHarvesterDescriptionChange}
        />

        <InputText
          label="URL *"
          placeholder={urlPlaceholder}
          id="harvester-url"
          value={harvesterUrl}
          onChange={onHarvesterUrlChange}
          hasError={hasHarvesterUrlError}
          hasFeedback={hasHarvesterUrlError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
          required
        />
      </div>
    </>
  );
}
