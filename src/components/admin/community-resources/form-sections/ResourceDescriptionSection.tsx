"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import ResourceDescriptionFields from "@/components/admin/community-resources/form-sections/ResourceDescriptionFields";

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
  const { t } = useTranslation("admin-community-resources");

  return (
    <>
      <h2 className="admin-page__section-title">
        {t("form.descriptionSectionTitle")}
      </h2>

      <div className="admin-page__fields-group">
        <ResourceDescriptionFields
          title={title}
          description={description}
          typeOptions={typeOptions}
          selectedTypeRef={selectedTypeRef}
          hasTitleError={hasTitleError}
          hasTypeError={hasTypeError}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onTypeChange={() => onTypeChange()}
        />
      </div>
    </>
  );
}
