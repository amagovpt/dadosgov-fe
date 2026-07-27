"use client";

import React from "react";
import { InputText, InputTextArea } from "@ama-pt/agora-design-system";

interface DataserviceDescriptionSectionProps {
  apiName: string;
  apiAcronym: string;
  apiDescription: string;
  baseApiUrl: string;
  machineDocUrl: string;
  technicalDocUrl: string;
  availability: string;
  hasApiNameError: boolean;
  hasApiDescriptionError: boolean;
  onApiNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApiAcronymChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApiDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBaseApiUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMachineDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTechnicalDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvailabilityChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataserviceDescriptionSection({
  apiName,
  apiAcronym,
  apiDescription,
  baseApiUrl,
  machineDocUrl,
  technicalDocUrl,
  availability,
  hasApiNameError,
  hasApiDescriptionError,
  onApiNameChange,
  onApiAcronymChange,
  onApiDescriptionChange,
  onBaseApiUrlChange,
  onMachineDocUrlChange,
  onTechnicalDocUrlChange,
  onAvailabilityChange,
}: DataserviceDescriptionSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Descrição</h2>

      <div className="admin-page__fields-group">
        <InputText
          label="Nome da API *"
          placeholder="Insira o nome aqui"
          id="api-name"
          value={apiName}
          onChange={onApiNameChange}
          hasError={hasApiNameError}
          hasFeedback={hasApiNameError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
        />
        <InputText
          label="Sigla"
          placeholder="Insira a sigla aqui"
          id="api-acronym"
          value={apiAcronym}
          onChange={onApiAcronymChange}
        />
        <InputTextArea
          label="Descrição *"
          placeholder="Insira a descrição aqui"
          id="api-description"
          rows={4}
          maxLength={246}
          value={apiDescription}
          onChange={onApiDescriptionChange}
          hasError={hasApiDescriptionError}
          hasFeedback={hasApiDescriptionError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
        />
        <InputText
          label="URL base da API"
          placeholder="Insira o URL aqui"
          id="api-root-link"
          value={baseApiUrl}
          onChange={onBaseApiUrlChange}
        />
        <InputText
          label="Link para a documentação da API (ficheiro OpenAPI ou Swagger)"
          placeholder="Insira o URL aqui"
          id="api-doc-openapi"
          value={machineDocUrl}
          onChange={onMachineDocUrlChange}
        />
        <InputText
          label="Link para a documentação técnica da API"
          placeholder="Insira o URL aqui"
          id="api-doc-technical"
          value={technicalDocUrl}
          onChange={onTechnicalDocUrlChange}
        />
        <InputText
          label="Disponibilidade"
          placeholder="99,9"
          id="api-availability"
          value={availability}
          onChange={onAvailabilityChange}
        />
      </div>
    </>
  );
}
