import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  StatusCard,
  InputSelect,
  DropdownSection,
  DropdownOption,
  type DropdownSectionProps,
} from "@ama-pt/agora-design-system";
import {
  getDatasetAuxiliarItem,
  getEditDatasetAuxiliarItems,
} from "@/components/admin/datasets/config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";
import type { SpatialZone } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import DatasetsEditDescriptionSection from "@/components/admin/datasets/edit-sections/DatasetsEditDescriptionSection";
import DatasetsEditAccessTimeSection from "@/components/admin/datasets/edit-sections/DatasetsEditAccessTimeSection";
import DatasetsEditSpaceSection from "@/components/admin/datasets/edit-sections/DatasetsEditSpaceSection";
import { can } from "@/utils/permissions";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import type { ReactNode } from "react";

type DatasetsEditMetadataTabProps = {
  auxiliaryItems?: AdminAuxiliaryItem[];
  dataset: Dataset;
  feedback?: ReactNode;
  onCancel: () => void;
  isSubmitting: boolean;
  formErrors: Partial<Record<string, boolean | string>>;
  loadedTitle: string;
  loadedAcronym: string;
  description: string;
  loadedKeywords: string;
  selectedKeywords: string[];
  keywordOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  loadedLicense: string;
  licenseOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  loadedFrequency: string;
  frequencyOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  temporalStart: string;
  temporalEnd: string;
  loadedSpatialZones: string[];
  spatialCoverageValue: string;
  spatialCoverageOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedZoneObjects: SpatialZone[];
  effectiveSpatialIds: string[];
  loadedSpatialGranularity: string;
  spatialGranularityOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  keywordsRef: React.MutableRefObject<string>;
  selectedLicenseRef: React.MutableRefObject<string>;
  selectedFrequencyRef: React.MutableRefObject<string>;
  spatialCoverageRef: React.MutableRefObject<string>;
  spatialGranularityRef: React.MutableRefObject<string>;
  onTitleChange: (value: string) => void;
  onAcronymChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onKeywordSearch: (query: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onTemporalStartChange: (value: string) => void;
  onTemporalEndChange: (value: string) => void;
  onSpatialCoverageChange: (value: string) => void;
  onSpatialSearch: (query: string) => void;
  onRemoveSpatialZone: (zoneId: string) => void;
  onSaveMetadata: () => void | Promise<void>;
};

export default function DatasetsEditMetadataTab({
  auxiliaryItems,
  dataset,
  feedback,
  onCancel,
  isSubmitting,
  formErrors,
  loadedTitle,
  loadedAcronym,
  description,
  loadedKeywords,
  selectedKeywords,
  keywordOptions,
  loadedLicense,
  licenseOptions,
  loadedFrequency,
  frequencyOptions,
  temporalStart,
  temporalEnd,
  loadedSpatialZones,
  spatialCoverageValue,
  spatialCoverageOptions,
  selectedZoneObjects,
  effectiveSpatialIds,
  loadedSpatialGranularity,
  spatialGranularityOptions,
  keywordsRef,
  selectedLicenseRef,
  selectedFrequencyRef,
  spatialCoverageRef,
  spatialGranularityRef,
  onTitleChange,
  onAcronymChange,
  onDescriptionChange,
  onKeywordSearch,
  onKeywordsChange,
  onRemoveKeyword,
  onTemporalStartChange,
  onTemporalEndChange,
  onSpatialCoverageChange,
  onSpatialSearch,
  onRemoveSpatialZone,
  onSaveMetadata,
}: DatasetsEditMetadataTabProps) {
  const { t } = useTranslation("admin-datasets");
  const identitySection = useDatasetSection("edit-identity");
  const canEdit = can(dataset, "edit");
  const auxiliarItems = getEditDatasetAuxiliarItems({ items: auxiliaryItems });
  const producer =
    dataset.organization?.name ||
    [dataset.owner?.first_name, dataset.owner?.last_name].filter(Boolean).join(" ") ||
    t("form.withoutOrganization");

  return (
    <div className="flex min-w-0 flex-col gap-32">
      {feedback}
      <form
        className="flex w-full max-w-[800px] flex-col gap-32"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void onSaveMetadata();
        }}
      >
        <p className="text-s-regular text-primary-900">{t("form.optionalFields")}</p>
        {dataset.quality?.update_fulfilled_in_time === false && (
          <StatusCard
            variant="outline-warning"
            showIcon
            title={t("editPage.overdueTitle")}
            description={t("editPage.overdueDescription")}
            anchor={{
              href: "#edit-time-section",
              children: t("editPage.updateSchedule"),
              hasIcon: true,
              trailingIcon: "agora-line-arrow-right-circle",
            }}
            className="bg-white"
          />
        )}
        <fieldset
          disabled={isSubmitting || !canEdit}
          className="mt-32 flex min-w-0 flex-col gap-64"
        >
          <section className="flex flex-col gap-32">
            <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
              <h2 className="text-xl-bold">{identitySection?.title ?? ""}</h2>
              <DatasetContentDescription
                html={identitySection?.description}
                className="text-m-regular"
              />
            </div>
            <InputSelect
              id="edit-producer"
              label={t("form.producerInputLabel")}
              value="current"
              disabled
              hasHelperText
              helperText={t("editPage.producerTransferHint")}
            >
              <DropdownSection name="producer">
                <DropdownOption value="current" selected>
                  {producer}
                </DropdownOption>
              </DropdownSection>
            </InputSelect>
          </section>
          <DatasetsEditDescriptionSection
            formErrors={formErrors}
            loadedTitle={loadedTitle}
            loadedAcronym={loadedAcronym}
            description={description}
            loadedKeywords={loadedKeywords}
            selectedKeywords={selectedKeywords}
            keywordOptions={keywordOptions}
            keywordsRef={keywordsRef}
            onTitleChange={onTitleChange}
            onAcronymChange={onAcronymChange}
            onDescriptionChange={onDescriptionChange}
            onKeywordSearch={onKeywordSearch}
            onKeywordsChange={onKeywordsChange}
            onRemoveKeyword={onRemoveKeyword}
            auxiliaryItems={auxiliarItems}
          />
          <DatasetsEditAccessTimeSection
            formErrors={formErrors}
            loadedLicense={loadedLicense}
            licenseOptions={licenseOptions}
            loadedFrequency={loadedFrequency}
            frequencyOptions={frequencyOptions}
            temporalStart={temporalStart}
            temporalEnd={temporalEnd}
            selectedLicenseRef={selectedLicenseRef}
            selectedFrequencyRef={selectedFrequencyRef}
            onTemporalStartChange={onTemporalStartChange}
            onTemporalEndChange={onTemporalEndChange}
            auxiliaryItems={auxiliarItems}
          />
          <DatasetsEditSpaceSection
            loadedSpatialZones={loadedSpatialZones}
            spatialCoverageValue={spatialCoverageValue}
            spatialCoverageOptions={spatialCoverageOptions}
            selectedZoneObjects={selectedZoneObjects}
            effectiveSpatialIds={effectiveSpatialIds}
            loadedSpatialGranularity={loadedSpatialGranularity}
            spatialGranularityOptions={spatialGranularityOptions}
            spatialCoverageRef={spatialCoverageRef}
            spatialGranularityRef={spatialGranularityRef}
            onSpatialCoverageChange={onSpatialCoverageChange}
            onSpatialSearch={onSpatialSearch}
            onRemoveSpatialZone={onRemoveSpatialZone}
            helpItem={getDatasetAuxiliarItem(auxiliarItems, "spatial-granularity")}
          />
        </fieldset>
        <div className="mt-32 flex flex-wrap justify-end gap-16">
          <Button
            type="button"
            appearance="link"
            variant="neutral"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("edit.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-check-circle"
            leadingIconHover="agora-solid-check-circle"
            disabled={isSubmitting || !canEdit}
          >
            {isSubmitting ? t("edit.saving") : t("editPage.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}
