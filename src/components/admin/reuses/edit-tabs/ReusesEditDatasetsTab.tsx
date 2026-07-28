import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownOption,
  DropdownSection,
  InputSelect,
  StatusCard,
  Tag,
} from "@ama-pt/agora-design-system";
import ReuseExternalDatasetFields from "@/components/admin/reuses/form-sections/ReuseExternalDatasetFields";
import ReusesEditAssociatedDatasetsSection from "@/components/admin/reuses/edit-sections/ReusesEditAssociatedDatasetsSection";
import ReusesEditDatasetsActions from "@/components/admin/reuses/edit-sections/ReusesEditDatasetsActions";
import type { Dataset } from "@/service/types/dataset";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";

type ReusesEditDatasetsTabProps = {
  associatedDatasets: Dataset[];
  selectedDatasets: Dataset[];
  datasetSearchResults: Dataset[];
  myDatasets: Dataset[];
  datasetLinks: RemoteDatasetEntry[];
  datasetLinkErrors: Record<number, string>;
  isSubmitting: boolean;
  onDatasetSearchChange: (value: string) => void;
  onDatasetSelectChange: (selectedIds: string[]) => void;
  onRemoveSelectedDataset: (datasetId: string) => void;
  onRemoveAssociatedDataset: (datasetId: string) => void;
  onRemoveAllAssociatedDatasets: () => void;
  onDatasetLinkChange: (index: number, value: string) => void;
  onDatasetTitleChange: (index: number, value: string) => void;
  onDatasetDescriptionChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
  onSave: () => void | Promise<void>;
};

export default function ReusesEditDatasetsTab({
  associatedDatasets,
  selectedDatasets,
  datasetSearchResults,
  myDatasets,
  datasetLinks,
  datasetLinkErrors,
  isSubmitting,
  onDatasetSearchChange,
  onDatasetSelectChange,
  onRemoveSelectedDataset,
  onRemoveAssociatedDataset,
  onRemoveAllAssociatedDatasets,
  onDatasetLinkChange,
  onDatasetTitleChange,
  onDatasetDescriptionChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
  onSave,
}: ReusesEditDatasetsTabProps) {
  const { t } = useTranslation("admin-reuses");

  const availableDatasets = (() => {
    const combined: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
    const associatedIds = new Set(associatedDatasets.map((dataset) => dataset.id));
    const seen = new Set<string>();
    return combined.filter((dataset) => {
      if (seen.has(dataset.id)) return false;
      if (associatedIds.has(dataset.id)) return false;
      if (dataset.archived) return false;
      if (dataset.deleted) return false;
      seen.add(dataset.id);
      return true;
    });
  })();

  return (
    <div className="mt-24 flex flex-col gap-24">
      <ReusesEditAssociatedDatasetsSection
        associatedDatasets={associatedDatasets}
        isSubmitting={isSubmitting}
        onRemoveAssociatedDataset={onRemoveAssociatedDataset}
        onRemoveAllAssociatedDatasets={onRemoveAllAssociatedDatasets}
      />

      <div className="admin-page__form-area">
        <form
          className="admin-page__form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <div className="mb-24">
            <StatusCard
              variant="warning"
              showIcon
              description={t("form.datasetMutualExclusion")}
            />
          </div>

          <InputSelect
            label={t("form.datasetSearchLabel")}
            placeholder={t("form.datasetSearchPlaceholder")}
            id="edit-dataset-search"
            type="checkbox"
            searchable
            searchInputPlaceholder={t("form.datasetSearchInputPlaceholder")}
            searchNoResultsText={t("form.noResults")}
            onSearchInputChange={onDatasetSearchChange}
            onChange={(options) => {
              const selectedIds = options.map((option) => String(option.value));
              onDatasetSelectChange(selectedIds);
            }}
          >
            <DropdownSection name="datasets">
              {availableDatasets.map((dataset) => (
                <DropdownOption
                  key={dataset.id}
                  value={dataset.id}
                  selected={selectedDatasets.some((selected) => selected.id === dataset.id)}
                >
                  {dataset.title}
                </DropdownOption>
              ))}
            </DropdownSection>
          </InputSelect>

          {selectedDatasets.length > 0 && (
            <div className="mt-16 flex flex-wrap gap-8">
              {selectedDatasets.map((dataset) => (
                <Tag
                  key={dataset.id}
                  aria-label={t("form.removeDataset", { title: dataset.title })}
                  onClick={() => onRemoveSelectedDataset(dataset.id)}
                >
                  {dataset.title}
                </Tag>
              ))}
            </div>
          )}

          <div className="admin-page__divider-or">
            <span className="admin-page__divider-or-text">{t("form.or")}</span>
          </div>

          <ReuseExternalDatasetFields
            datasetLinks={datasetLinks}
            datasetLinkErrors={datasetLinkErrors}
            idPrefix="edit"
            onDatasetUrlChange={onDatasetLinkChange}
            onDatasetTitleChange={onDatasetTitleChange}
            onDatasetDescriptionChange={onDatasetDescriptionChange}
            onRemoveDatasetLink={onRemoveDatasetLink}
          />

          <ReusesEditDatasetsActions
            isSubmitting={isSubmitting}
            canSave={
              selectedDatasets.length > 0 || datasetLinks.some((link) => link.url.trim())
            }
            onAddDatasetLink={onAddDatasetLink}
          />
        </form>
      </div>
    </div>
  );
}
