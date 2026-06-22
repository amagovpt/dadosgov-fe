import React from "react";
import { Button, type DropdownSectionProps, Switch } from "@ama-pt/agora-design-system";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import { getDatasetAuxiliarItems } from "@/components/admin/datasets/datasetsAuxiliarItems";
import type { SpatialZone } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import AdminVisibilityBanner from "@/components/admin/forms/AdminVisibilityBanner";
import DatasetsEditDescriptionSection from "@/components/admin/datasets/DatasetsEditDescriptionSection";
import DatasetsEditAccessTimeSection from "@/components/admin/datasets/DatasetsEditAccessTimeSection";
import DatasetsEditSpaceSection from "@/components/admin/datasets/DatasetsEditSpaceSection";
import DatasetsEditDangerZone from "@/components/admin/datasets/DatasetsEditDangerZone";

type DatasetsEditMetadataTabProps = {
  dataset: Dataset;
  featured: boolean;
  isSubmitting: boolean;
  formErrors: Partial<Record<string, boolean>>;
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
  onToggleArchive: (e: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (e: React.MouseEvent) => void;
};

export default function DatasetsEditMetadataTab({
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
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditMetadataTabProps) {
  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        {dataset.private && (
          <AdminVisibilityBanner
            description={
              <>
                <strong>Modifique a visibilidade do conjunto de dados.</strong>
                <br />
                Este conjunto de dados encontra-se atualmente em <strong>modo privado</strong>.
                Apenas os membros da organização o podem visualizar e editar.
              </>
            }
            actionLabel="Publicar o conjunto de dados"
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
          <p className="text-neutral-900 text-base leading-7">
            Os campos marcados com um asterisco ( * ) são obrigatórios.
          </p>

          <div>
            <h2 className="admin-page__section-title admin-page__section-title--no-top">
              Destaque
            </h2>
            <Switch
              id="edit-featured"
              label="Destaque"
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
              {isSubmitting ? "A guardar..." : "Guardar"}
            </Button>
          </div>

          <DatasetsEditDangerZone
            datasetArchived={!!dataset.archived}
            isSubmitting={isSubmitting}
            onToggleArchive={onToggleArchive}
            onOpenDeletePopup={onOpenDeletePopup}
          />
        </form>
      </div>

      <AdminAuxiliarySidebar
        items={getDatasetAuxiliarItems({
          title: !!formErrors.title,
          description: !!formErrors.description,
        })}
      />
    </div>
  );
}
