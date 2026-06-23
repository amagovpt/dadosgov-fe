"use client";

import React from "react";
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
  return (
    <>
      <h2 className="admin-page__section-title">Esquema de dados</h2>

      <div className="admin-page__fields-group">
        <AdminSelectAdapter
          key={`schema-${resourceId}-${schemasCount}`}
          label="Plano"
          placeholder="Procure um esquema referenciado em dados.gov.pt..."
          id="resource-schema"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          initialValue={loadedSchema}
          valueRef={selectedSchemaRef}
          onValueChange={onSchemaSelect}
        >
          {schemaOptions}
        </AdminSelectAdapter>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">ou</span>
        </div>

        <InputText
          label="Adicione um link para o diagrama"
          placeholder="Insira o link para o diagrama"
          id="resource-schema-url"
          value={schemaUrl}
          onChange={onSchemaUrlChange}
        />
      </div>
    </>
  );
}
