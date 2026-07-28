import React from "react";
import { useTranslation } from "react-i18next";
import { type DropdownSectionProps, Tag } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { SpatialZone } from "@/service/types/catalog";

type DatasetsEditSpaceSectionProps = {
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
  spatialCoverageRef: React.MutableRefObject<string>;
  spatialGranularityRef: React.MutableRefObject<string>;
  onSpatialCoverageChange: (value: string) => void;
  onSpatialSearch: (query: string) => void;
  onRemoveSpatialZone: (zoneId: string) => void;
};

export default function DatasetsEditSpaceSection({
  loadedSpatialZones,
  spatialCoverageValue,
  spatialCoverageOptions,
  selectedZoneObjects,
  effectiveSpatialIds,
  loadedSpatialGranularity,
  spatialGranularityOptions,
  spatialCoverageRef,
  spatialGranularityRef,
  onSpatialCoverageChange,
  onSpatialSearch,
  onRemoveSpatialZone,
}: DatasetsEditSpaceSectionProps) {
  const { t } = useTranslation("admin-datasets");

  return (
    <>
      <h2 className="admin-page__section-title">{t("edit.spaceSectionTitle")}</h2>
      <div className="admin-page__fields-group">
        <IsolatedSelect
          label={t("edit.spatialCoverageField")}
          placeholder={t("edit.spatialCoveragePlaceholder")}
          id="edit-spatial-coverage"
          type="checkbox"
          searchable
          searchInputPlaceholder={t("edit.searchPlaceholder")}
          searchNoResultsText={t("edit.searchNoResults")}
          defaultValue={spatialCoverageValue || loadedSpatialZones.join(",")}
          onChangeRef={spatialCoverageRef}
          onChangeCallback={onSpatialCoverageChange}
          onSearchCallback={onSpatialSearch}
        >
          {spatialCoverageOptions}
        </IsolatedSelect>

        {selectedZoneObjects.length > 0 && (
          <div className="-mt-8 flex flex-wrap gap-8">
            {selectedZoneObjects.map((zone) => (
              <Tag
                key={zone.id}
                aria-label={t("edit.removeSpatialZone", { name: zone.name })}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const savedScroll = window.scrollY;
                  const next = effectiveSpatialIds.filter((id) => id !== zone.id).join(",");
                  spatialCoverageRef.current = next;
                  onRemoveSpatialZone(zone.id);
                  setTimeout(() => {
                    document
                      .getElementById("agora-input-select-edit-spatial-coverage-control")
                      ?.focus({ preventScroll: true });
                    window.scrollTo({ top: savedScroll, behavior: "instant" });
                  }, 50);
                }}
              >
                {zone.code ? `${zone.name} (${zone.code})` : zone.name}
              </Tag>
            ))}
          </div>
        )}

        <IsolatedSelect
          label={t("edit.spatialGranularityField")}
          placeholder={t("edit.spatialGranularityPlaceholder")}
          id="edit-spatial-granularity"
          defaultValue={loadedSpatialGranularity}
          onChangeRef={spatialGranularityRef}
        >
          {spatialGranularityOptions}
        </IsolatedSelect>
      </div>
    </>
  );
}
