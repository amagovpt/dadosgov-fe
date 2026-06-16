"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputSelect } from "@ama-pt/agora-design-system";
import type { Dataset } from "@/service/types/dataset";
import SelectedDatasetCard from "@/components/admin/community-resources/SelectedDatasetCard";

interface DatasetSelectionSectionProps {
  datasetId: string;
  activeDataset: Dataset | null;
  datasetOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  hasDatasetError: boolean;
  onDatasetChange: (options: { value: string }[]) => void;
  onRemoveSelectedDataset: () => void;
}

export default function DatasetSelectionSection({
  datasetId,
  activeDataset,
  datasetOptions,
  hasDatasetError,
  onDatasetChange,
  onRemoveSelectedDataset,
}: DatasetSelectionSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">
        Associe um conjunto de dados {!datasetId && "*"}
      </h2>

      {activeDataset && (
        <SelectedDatasetCard
          dataset={activeDataset}
          canRemove={!datasetId}
          onRemove={onRemoveSelectedDataset}
        />
      )}

      {!datasetId && !activeDataset && (
        <InputSelect
          label="Pesquisar um conjunto de dados *"
          placeholder="Procurando um conjunto de dados..."
          id="community-resource-dataset-search"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          searchNoResultsText="Nenhum resultado encontrado"
          hasError={hasDatasetError}
          onChange={onDatasetChange}
        >
          {datasetOptions}
        </InputSelect>
      )}
    </>
  );
}
