import React from "react";
import { useTranslation } from "react-i18next";
import { Button, type DropdownSectionProps, Switch } from "@ama-pt/agora-design-system";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import { getEditDatasetAuxiliarItems } from "@/components/admin/datasets/config/datasetsAuxiliarItems";
import type { SpatialZone } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import AdminVisibilityBanner from "@/components/admin/forms/AdminVisibilityBanner";
import DatasetsEditDescriptionSection from "@/components/admin/datasets/edit-sections/DatasetsEditDescriptionSection";
import DatasetsEditAccessTimeSection from "@/components/admin/datasets/edit-sections/DatasetsEditAccessTimeSection";
import DatasetsEditSpaceSection from "@/components/admin/datasets/edit-sections/DatasetsEditSpaceSection";
import DatasetsEditDangerZone from "@/components/admin/datasets/edit-sections/DatasetsEditDangerZone";
import { can } from "@/utils/permissions";
import type { AdminAuxiliaryItem, AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

type DatasetsEditMetadataTabProps = {
  auxiliaryItems?: AdminAuxiliaryItem[];
  visibilityCard?: AdminCard;
  transferCard?: AdminCard;
  archiveCard?: AdminCard;
  unarchiveCard?: AdminCard;
  deleteCard?: AdminCard;
  dataset: Dataset;
  featured: boolean;
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
  onPublishDataset: () => void | Promise<void>;
  onFeaturedChange: (checked: boolean) => void;
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
  onOpenTransferPopup: (e: React.MouseEvent) => void;
  onToggleArchive: (e: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (e: React.MouseEvent) => void;
};

export default function DatasetsEditMetadataTab({
  auxiliaryItems,
  visibilityCard,
  transferCard,
  archiveCard,
  unarchiveCard,
  deleteCard,
  dataset,
  featured,
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
  onPublishDataset,
  onFeaturedChange,
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
  onOpenTransferPopup,
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditMetadataTabProps) {
  const { t } = useTranslation("admin-datasets");
  const canEdit = can(dataset, "edit");
  const canDelete = can(dataset, "delete");
  const auxiliarItems = getEditDatasetAuxiliarItems({
    items: auxiliaryItems,
  });

  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        {dataset.private && canEdit && visibilityCard && (
          <AdminVisibilityBanner
            description={
              <>
                <strong>{visibilityCard.title}</strong>
                {visibilityCard.description && (
                  <>
                    <br />
                    {formatHtmlParagraphs(visibilityCard.description)}
                  </>
                )}
              </>
            }
            actionLabel={visibilityCard.anchor?.children ?? ""}
            disabled={isSubmitting}
            onAction={onPublishDataset}
          />
        )}

        <form
          className="admin-page__form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void onSaveMetadata();
          }}
        >
          <p className="text-neutral-900 text-base leading-7">{t("edit.requiredFields")}</p>

          <div>
            <h2 className="admin-page__section-title admin-page__section-title--no-top">
              {t("edit.featuredSectionTitle")}
            </h2>
            <Switch
              id="edit-featured"
              label={t("edit.featuredLabel")}
              checked={featured}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFeaturedChange(e.target.checked)}
            />
          </div>

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
          />

          <div className="admin-page__actions mt-24 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("edit.saving") : t("edit.save")}
            </Button>
          </div>

          <DatasetsEditDangerZone
            datasetArchived={!!dataset.archived}
            isSubmitting={isSubmitting}
            canEdit={canEdit}
            canDelete={canDelete}
            transferCard={transferCard}
            archiveCard={archiveCard}
            unarchiveCard={unarchiveCard}
            deleteCard={deleteCard}
            onOpenTransferPopup={onOpenTransferPopup}
            onToggleArchive={onToggleArchive}
            onOpenDeletePopup={onOpenDeletePopup}
          />
        </form>
      </div>

      {auxiliarItems.length > 0 && <AdminAuxiliarySidebar items={auxiliarItems} />}
    </div>
  );
}
