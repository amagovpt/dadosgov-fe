"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputText } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface SchemaSectionProps {
  schemaOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedSchemaRef: React.RefObject<string>;
  schemaUrl: string;
  onSchemaUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SchemaSection({
  schemaOptions,
  selectedSchemaRef,
  schemaUrl,
  onSchemaUrlChange,
}: SchemaSectionProps) {
  const { t } = useTranslation("admin-community-resources");

  return (
    <>
      <h2 className="admin-page__section-title">{t("form.dataSchema")}</h2>

      <div className="admin-page__fields-group">
        <AdminSelectAdapter
          label={t("form.schemaPlan")}
          placeholder={t("form.schemaDataGouvSearchPlaceholder")}
          id="resource-schema"
          valueRef={selectedSchemaRef}
        >
          {schemaOptions}
        </AdminSelectAdapter>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">{t("form.or")}</span>
        </div>

        <InputText
          label={t("form.schemaLinkLabel")}
          placeholder="https://..."
          id="resource-schema-url"
          value={schemaUrl}
          onChange={onSchemaUrlChange}
        />
      </div>
    </>
  );
}
