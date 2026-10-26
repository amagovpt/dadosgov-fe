import React from "react";
import { useTranslation } from "react-i18next";
import { type DropdownSectionProps, Tag } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { SpatialZone } from "@/service/types/catalog";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { DatasetWizardHelp } from "../publication-wizard/DatasetWizardHelp";

type DatasetsEditSpaceSectionProps = {
  helpItem?: AuxiliarItem;
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
  helpItem,
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
    <section className="flex min-w-0 flex-col gap-32">
      <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
        <h2 className="text-xl-bold">{t("coverage.geographicSectionTitle")}</h2>
        <p className="text-m-regular">{t("coverage.geographicDescription")}</p>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-32 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-16">
          <IsolatedSelect
            label={t("coverage.geographicCoverageLabel")}
            placeholder={t("coverage.geographicCoveragePlaceholder")}
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
        </div>
        <IsolatedSelect
          label={t("coverage.geographicGranularityLabel")}
          placeholder={t("coverage.geographicGranularityPlaceholder")}
          id="edit-spatial-granularity"
          defaultValue={loadedSpatialGranularity}
          onChangeRef={spatialGranularityRef}
        >
          {spatialGranularityOptions}
        </IsolatedSelect>
      </div>
      <DatasetWizardHelp item={helpItem} background="white" />
    </section>
  );
}
