"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
  InputText,
  StatusCard,
  Tag,
} from "@ama-pt/agora-design-system";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { Dataset } from "@/service/types/dataset";

interface ApiRegistrationDatasetsStepProps {
  availableDatasets: Dataset[];
  selectedDatasets: Dataset[];
  dropdownDatasets: Dataset[];
  datasetLinkUrl: string;
  datasetLinkError: string | null;
  isResolvingLink: boolean;
  isLinking: boolean;
  onSearchInputChange: (value: string) => void;
  onDropdownChange: (ids: string[]) => void;
  onRemoveDataset: (id: string) => void;
  onDatasetLinkUrlChange: (value: string) => void;
  onAddDatasetLink: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  datasetLinksInfo?: AdminHelpBlock;
}

export default function ApiRegistrationDatasetsStep({
  availableDatasets,
  selectedDatasets,
  dropdownDatasets,
  datasetLinkUrl,
  datasetLinkError,
  isResolvingLink,
  isLinking,
  onSearchInputChange,
  onDropdownChange,
  onRemoveDataset,
  onDatasetLinkUrlChange,
  onAddDatasetLink,
  onPreviousStep,
  onNextStep,
  datasetLinksInfo,
}: ApiRegistrationDatasetsStepProps) {
  const { t } = useTranslation("admin-dataservices");

  return (
    <>
      {datasetLinksInfo ? (
        <StatusCard
          variant="informative"
          showIcon
          description={
            datasetLinksInfo.title ? (
              <>
                <strong>{datasetLinksInfo.title}</strong>
                <br />
                {formatHtmlParagraphs(datasetLinksInfo.description)}
              </>
            ) : (
              formatHtmlParagraphs(datasetLinksInfo.description)
            )
          }
        />
      ) : null}

      <form
        className="admin-page__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onNextStep();
        }}
      >
        <InputSelect
          label={t("datasetLinks.searchLabel")}
          placeholder={t("edit.datasetSelectPlaceholder")}
          id="api-registration-datasets"
          type="checkbox"
          searchable
          searchInputPlaceholder={t("edit.datasetSearchPlaceholder")}
          searchNoResultsText={t("edit.noDatasetResults")}
          onSearchInputChange={onSearchInputChange}
          onChange={(options) => onDropdownChange(options.map((o) => String(o.value)))}
        >
          <DropdownSection name="datasets">
            {availableDatasets.map((dataset) => (
              <DropdownOption
                key={dataset.id}
                value={dataset.id}
                selected={dropdownDatasets.some((s) => s.id === dataset.id)}
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
                aria-label={t("edit.removeDataset", { title: dataset.title })}
                onClick={() => onRemoveDataset(dataset.id)}
              >
                {dataset.title}
              </Tag>
            ))}
          </div>
        )}

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">{t("edit.or")}</span>
        </div>

        <div className="flex flex-col gap-8">
          <InputText
            label={t("datasetLinks.linkLabel")}
            placeholder="https://..."
            id="api-registration-dataset-link-url"
            required={false}
            value={datasetLinkUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onDatasetLinkUrlChange(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddDatasetLink();
              }
            }}
            hasError={!!datasetLinkError}
          />
          {datasetLinkError && (
            <span className="text-sm text-danger-600">{datasetLinkError}</span>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              onClick={onAddDatasetLink}
              disabled={isResolvingLink || !datasetLinkUrl.trim()}
            >
              {t("datasetLinks.add")}
            </Button>
          </div>
        </div>

        <AdminStepActions
          previousAction={{
            label: t("form.previous"),
            appearance: "outline",
            variant: "neutral",
            onClick: onPreviousStep,
          }}
          primaryAction={{
            label: isLinking ? t("form.linking") : t("form.next"),
            type: "submit",
            hasIcon: true,
            trailingIcon: "agora-line-arrow-right-circle",
            trailingIconHover: "agora-solid-arrow-right-circle",
            disabled: isLinking,
          }}
        />
      </form>
    </>
  );
}
