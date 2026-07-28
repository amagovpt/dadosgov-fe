"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputText } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface EditSchemaSectionProps {
  resourceId: string;
  schemasCount: number;
  loadedSchema: string;
  schemaUrl: string;
  schemaOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedSchemaRef: React.RefObject<string>;
  onSchemaSelect: (value: string) => void;
  onSchemaUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EditSchemaSection({
  resourceId,
  schemasCount,
  loadedSchema,
  schemaUrl,
  schemaOptions,
  selectedSchemaRef,
  onSchemaSelect,
  onSchemaUrlChange,
}: EditSchemaSectionProps) {
  const { t } = useTranslation("admin-community-resources");

  return (
    <>
      <h2 className="admin-page__section-title">{t("form.dataSchema")}</h2>

      <div className="admin-page__fields-group">
        <AdminSelectAdapter
          key={`schema-${resourceId}-${schemasCount}`}
          label={t("form.schemaPlan")}
          placeholder={t("form.schemaSearchPlaceholder")}
          id="resource-schema"
          searchable
          searchInputPlaceholder={t("form.schemaSearchInputPlaceholder")}
          initialValue={loadedSchema}
          valueRef={selectedSchemaRef}
          onValueChange={onSchemaSelect}
        >
          {schemaOptions}
        </AdminSelectAdapter>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">{t("form.or")}</span>
        </div>

        <InputText
          label={t("form.schemaLinkLabel")}
          placeholder={t("form.schemaLinkPlaceholder")}
          id="resource-schema-url"
          value={schemaUrl}
          onChange={onSchemaUrlChange}
        />
      </div>
    </>
  );
}
