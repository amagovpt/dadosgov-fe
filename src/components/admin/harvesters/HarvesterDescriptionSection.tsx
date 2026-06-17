"use client";

import React from "react";
import { InputText, InputTextArea } from "@ama-pt/agora-design-system";

interface HarvesterDescriptionSectionProps {
  harvesterName: string;
  harvesterDescription: string;
  harvesterUrl: string;
  hasHarvesterNameError: boolean;
  hasHarvesterUrlError: boolean;
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
          placeholder="Insira o nome aqui"
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
          label="Descrição"
          placeholder="Insira a descrição aqui"
          id="harvester-description"
          rows={6}
          value={harvesterDescription}
          onChange={onHarvesterDescriptionChange}
        />

        <InputText
          label="URL *"
          placeholder="Insira o url aqui"
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
