"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputText } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";
import ResourceDescriptionFields from "@/components/admin/community-resources/form-sections/ResourceDescriptionFields";

interface EditDescriptionSectionProps {
  resourceId: string;
  saveCount: number;
  resourceTypesCount: number;
  title: string;
  description: string;
  format: string;
  selectedType: string;
  mimeType: string;
  typeOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  formatOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedTypeRef: React.RefObject<string>;
  selectedFormatRef: React.RefObject<string>;
  hasTitleError: boolean;
  hasTypeError: boolean;
  hasFormatError: boolean;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onMimeTypeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (value: string) => void;
  onFormatChange: (value: string) => void;
}

export default function EditDescriptionSection({
  resourceId,
  saveCount,
  resourceTypesCount,
  title,
  description,
  format,
  selectedType,
  mimeType,
  typeOptions,
  formatOptions,
  selectedTypeRef,
  selectedFormatRef,
  hasTitleError,
  hasTypeError,
  hasFormatError,
  onTitleChange,
  onDescriptionChange,
  onMimeTypeChange,
  onTypeChange,
  onFormatChange,
}: EditDescriptionSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Descrição</h2>

      <div className="admin-page__fields-group">
        <ResourceDescriptionFields
          title={title}
          description={description}
          typeOptions={typeOptions}
          selectedTypeRef={selectedTypeRef}
          hasTitleError={hasTitleError}
          hasTypeError={hasTypeError}
          typeSelectKey={`type-${resourceId}-${resourceTypesCount}`}
          typeInitialValue={selectedType}
          renderTypeErrorBelow
          descriptionRows={10}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onTypeChange={onTypeChange}
        />

        <AdminSelectAdapter
          key={`format-${resourceId}-${saveCount}`}
          label="Formato *"
          placeholder="Selecione o formato"
          id="resource-format"
          initialValue={format}
          valueRef={selectedFormatRef}
          onValueChange={onFormatChange}
          hasError={hasFormatError}
          errorMessage="Campo obrigatório"
          renderErrorBelow
        >
          {formatOptions}
        </AdminSelectAdapter>

        <InputText
          label="Tipo de recurso"
          placeholder="application/pdf"
          id="resource-mime"
          value={mimeType}
          onChange={onMimeTypeChange}
        />
      </div>
    </>
  );
}
