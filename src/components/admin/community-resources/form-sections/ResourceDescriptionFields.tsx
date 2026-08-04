"use client";

import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["admin-common", "admin-community-resources"]);

  return (
    <>
      <InputText
        label={t("admin-community-resources:form.titleField")}
        placeholder={t("admin-community-resources:form.titlePlaceholder")}
        id="resource-title"
        value={title}
        onChange={onTitleChange}
        hasError={hasTitleError}
        hasFeedback={hasTitleError}
        feedbackState="danger"
        errorFeedbackText={t("admin-common:forms.requiredField")}
      />

      <AdminSelectAdapter
        key={typeSelectKey}
        label={t("admin-community-resources:form.typeField")}
        placeholder={t("admin-community-resources:form.mainFilesPlaceholder")}
        id="resource-type"
        initialValue={typeInitialValue}
        valueRef={selectedTypeRef}
        onValueChange={onTypeChange}
        hasError={hasTypeError}
        errorMessage={t("admin-common:forms.requiredField")}
        renderErrorBelow={renderTypeErrorBelow}
      >
        {typeOptions}
      </AdminSelectAdapter>

      <InputTextArea
        label={t("admin-community-resources:form.descriptionField")}
        placeholder={t("admin-community-resources:form.descriptionPlaceholder")}
        id="resource-description"
        rows={descriptionRows}
        value={description}
        onChange={onDescriptionChange}
      />
    </>
  );
}
