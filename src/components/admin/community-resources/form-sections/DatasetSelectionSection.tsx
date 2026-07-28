"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { InputSelect } from "@ama-pt/agora-design-system";
import type { Dataset } from "@/service/types/dataset";
import SelectedDatasetCard from "@/components/admin/community-resources/form-ui/SelectedDatasetCard";

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
  const { t } = useTranslation("admin-community-resources");

  return (
    <>
      <h2 className="admin-page__section-title">
        {t("form.datasetAssociation")} {!datasetId && "*"}
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
          label={t("form.datasetSearchLabel")}
          placeholder={t("form.datasetSearchPlaceholder")}
          id="community-resource-dataset-search"
          searchable
          searchInputPlaceholder={t("form.schemaSearchInputPlaceholder")}
          searchNoResultsText={t("form.noDatasetResults")}
          hasError={hasDatasetError}
          onChange={onDatasetChange}
        >
          {datasetOptions}
        </InputSelect>
      )}
    </>
  );
}
