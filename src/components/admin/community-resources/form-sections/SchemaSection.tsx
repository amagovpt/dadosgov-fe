"use client";

import React from "react";
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
  return (
    <>
      <h2 className="admin-page__section-title">Esquema de dados</h2>

      <div className="admin-page__fields-group">
        <AdminSelectAdapter
          label="Plano"
          placeholder="Procure um esquema referenciado em schema.data.gouv.fr..."
          id="resource-schema"
          valueRef={selectedSchemaRef}
        >
          {schemaOptions}
        </AdminSelectAdapter>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">ou</span>
        </div>

        <InputText
          label="Adicione um link para o diagrama"
          placeholder="https://..."
          id="resource-schema-url"
          value={schemaUrl}
          onChange={onSchemaUrlChange}
        />
      </div>
    </>
  );
}
