"use client";

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  type DropdownSectionProps,
  InputSelect,
  StatusCard,
  Tag,
} from "@ama-pt/agora-design-system";
import ReuseExternalDatasetFields from "@/components/admin/reuses/form-sections/ReuseExternalDatasetFields";
import type { Dataset } from "@/service/types/dataset";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ReusesFormDatasetsStepProps {
  datasetAssociationInfo?: AdminHelpBlock;
  datasetAssociationWarning?: AdminHelpBlock;
  apiError: string | null;
  producerId: string;
  datasetOptions:
    | ReactElement<DropdownSectionProps>
    | ReactElement<DropdownSectionProps>[];
  selectedDatasets: Dataset[];
  datasetSearchResults: Dataset[];
  myDatasets: Dataset[];
  onDatasetSearch: (value: string) => void;
  onSelectedDatasetsChange: (datasets: Dataset[]) => void;
  onSelectedDatasetRemove: (datasetId: string) => void;
  datasetLinks: RemoteDatasetEntry[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onDatasetTitleChange: (index: number, value: string) => void;
  onDatasetDescriptionChange: (index: number, value: string) => void;
  onDatasetLinkRemove: (index: number) => void;
  onDatasetLinkAdd: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  isSubmitting: boolean;
}

export default function ReusesFormDatasetsStep({
  datasetAssociationInfo,
  datasetAssociationWarning,
  apiError,
  producerId,
  datasetOptions,
  selectedDatasets,
  datasetSearchResults,
  myDatasets,
  onDatasetSearch,
  onSelectedDatasetsChange,
  onSelectedDatasetRemove,
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onDatasetTitleChange,
  onDatasetDescriptionChange,
  onDatasetLinkRemove,
  onDatasetLinkAdd,
  onPreviousStep,
  onNextStep,
  isSubmitting,
}: ReusesFormDatasetsStepProps) {
  const { t } = useTranslation("admin-reuses");

  return (
    <>
      {datasetAssociationInfo ? (
        <div className="mb-24">
          <StatusCard
            variant="informative"
            showIcon
            description={
              datasetAssociationInfo.title ? (
                <>
                  <strong>{datasetAssociationInfo.title}</strong>
                  <br />
                  {formatHtmlParagraphs(datasetAssociationInfo.description)}
                </>
              ) : (
                formatHtmlParagraphs(datasetAssociationInfo.description)
              )
            }
          />
        </div>
      ) : null}
      {datasetAssociationWarning ? (
        <div className="mb-24">
          <StatusCard
            variant="warning"
            showIcon
            description={
              datasetAssociationWarning.title ? (
                <>
                  <strong>{datasetAssociationWarning.title}</strong>
                  <br />
                  {formatHtmlParagraphs(datasetAssociationWarning.description)}
                </>
              ) : (
                formatHtmlParagraphs(datasetAssociationWarning.description)
              )
            }
          />
        </div>
      ) : null}
      {apiError && (
        <div className="mb-16 mt-32">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}

      <form
        className="admin-page__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onNextStep();
        }}
      >
        <InputSelect
          key={`dataset-select-${producerId}`}
          label={t("form.datasetSearchLabel")}
          placeholder={t("form.datasetSearchPlaceholder")}
          id="reuse-dataset-search"
          type="checkbox"
          searchable
          searchInputPlaceholder={t("form.datasetSearchInputPlaceholder")}
          searchNoResultsText={t("form.noResults")}
          onSearchInputChange={onDatasetSearch}
          onChange={(options) => {
            const selectedIds = new Set(options.map((option) => option.value as string));
            const pool: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
            const seen = new Set<string>();
            const next: Dataset[] = [];

            for (const dataset of pool) {
              if (selectedIds.has(dataset.id) && !seen.has(dataset.id)) {
                seen.add(dataset.id);
                next.push(dataset);
              }
            }

            onSelectedDatasetsChange(next);
          }}
        >
          {datasetOptions}
        </InputSelect>

        {selectedDatasets.length > 0 && (
          <div className="mt-16 flex flex-wrap gap-8">
            {selectedDatasets.map((dataset) => (
              <Tag
                key={dataset.id}
                aria-label={t("form.removeDataset", { title: dataset.title })}
                onClick={() => onSelectedDatasetRemove(dataset.id)}
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
          idPrefix="reuse"
          itemClassName="mt-16 flex flex-col gap-16"
          onDatasetUrlChange={onDatasetUrlChange}
          onDatasetTitleChange={onDatasetTitleChange}
          onDatasetDescriptionChange={onDatasetDescriptionChange}
          onRemoveDatasetLink={onDatasetLinkRemove}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            appearance="outline"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={onDatasetLinkAdd}
          >
            {t("form.addDatasetLink")}
          </Button>
        </div>

        <div className="admin-page__actions flex justify-between gap-[18px]">
          <Button
            type="button"
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-solid-arrow-left-circle"
            onClick={onPreviousStep}
          >
            {t("form.previous")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("form.associating") : t("form.next")}
          </Button>
        </div>
      </form>
    </>
  );
}
