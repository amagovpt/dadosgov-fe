"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputText, InputTextArea } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface ResourceDescriptionFieldsProps {
  title: string;
  description: string;
  typeOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedTypeRef: React.RefObject<string>;
  hasTitleError: boolean;
  hasTypeError: boolean;
  typeSelectKey?: string;
  typeInitialValue?: string;
  renderTypeErrorBelow?: boolean;
  descriptionRows?: number;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTypeChange: (value: string) => void;
}

export default function ResourceDescriptionFields({
  title,
  description,
  typeOptions,
  selectedTypeRef,
  hasTitleError,
  hasTypeError,
  typeSelectKey,
  typeInitialValue,
  renderTypeErrorBelow = false,
  descriptionRows = 6,
  onTitleChange,
  onDescriptionChange,
  onTypeChange,
}: ResourceDescriptionFieldsProps) {
  return (
    <>
      <InputText
        label="Título *"
        placeholder="Insira o título aqui"
        id="resource-title"
        value={title}
        onChange={onTitleChange}
        hasError={hasTitleError}
        hasFeedback={hasTitleError}
        feedbackState="danger"
        errorFeedbackText="Campo obrigatório"
      />

      <AdminSelectAdapter
        key={typeSelectKey}
        label="Tipo *"
        placeholder="Ficheiros principais"
        id="resource-type"
        initialValue={typeInitialValue}
        valueRef={selectedTypeRef}
        onValueChange={onTypeChange}
        hasError={hasTypeError}
        errorMessage="Campo obrigatório"
        renderErrorBelow={renderTypeErrorBelow}
      >
        {typeOptions}
      </AdminSelectAdapter>

      <InputTextArea
        label="Descrição"
        placeholder="Insira a descrição aqui"
        id="resource-description"
        rows={descriptionRows}
        value={description}
        onChange={onDescriptionChange}
      />
    </>
  );
}
