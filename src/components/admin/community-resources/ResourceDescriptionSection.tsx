"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputText, InputTextArea } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface ResourceDescriptionSectionProps {
  title: string;
  description: string;
  typeOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedTypeRef: React.RefObject<string>;
  hasTitleError: boolean;
  hasTypeError: boolean;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTypeChange: () => void;
}

export default function ResourceDescriptionSection({
  title,
  description,
  typeOptions,
  selectedTypeRef,
  hasTitleError,
  hasTypeError,
  onTitleChange,
  onDescriptionChange,
  onTypeChange,
}: ResourceDescriptionSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Descrição</h2>

      <div className="admin-page__fields-group">
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
          label="Tipo *"
          placeholder="Ficheiros principais"
          id="resource-type"
          valueRef={selectedTypeRef}
          hasError={hasTypeError}
          errorMessage="Campo obrigatório"
          onValueChange={onTypeChange}
        >
          {typeOptions}
        </AdminSelectAdapter>

        <InputTextArea
          label="Descrição"
          placeholder="Insira a descrição aqui"
          id="resource-description"
          rows={6}
          value={description}
          onChange={onDescriptionChange}
        />
      </div>
    </>
  );
}
