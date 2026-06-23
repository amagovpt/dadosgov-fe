"use client";

import React from "react";
import { DropdownOption, DropdownSection, InputSelect } from "@ama-pt/agora-design-system";
import AdminExternalUrlFields from "@/components/admin/forms/AdminExternalUrlFields";

interface DataserviceDatasetLink {
  url: string;
}

interface DataserviceDatasetLinksSectionProps {
  datasetLinks: DataserviceDatasetLink[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
}

export default function DataserviceDatasetLinksSection({
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
}: DataserviceDatasetLinksSectionProps) {
  return (
    <>
      <InputSelect
        label="Pesquisar um conjunto de dados"
        placeholder="Procurando um conjunto de dados..."
        id="dataset-search"
      >
        <DropdownSection name="datasets">
          <DropdownOption value="dataset1">Conjunto de dados 1</DropdownOption>
        </DropdownSection>
      </InputSelect>

      <AdminExternalUrlFields
        entries={datasetLinks}
        errors={datasetLinkErrors}
        idPrefix="dataset-url"
        label="Link para o conjunto de dados"
        placeholder="Insira o URL aqui"
        itemClassName="mt-16"
        removeButtonAppearance="link"
        onEntryChange={onDatasetUrlChange}
        onRemoveEntry={onRemoveDatasetLink}
        addLabel="Adicionar"
        onAddEntry={onAddDatasetLink}
      />
    </>
  );
}
