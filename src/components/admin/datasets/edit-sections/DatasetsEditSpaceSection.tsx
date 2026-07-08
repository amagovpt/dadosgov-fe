import React from "react";
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
  return (
    <>
      <h2 className="admin-page__section-title">Espaço</h2>
      <div className="admin-page__fields-group">
        <IsolatedSelect
          label="Cobertura espacial"
          placeholder="Selecione uma cobertura espacial..."
          id="edit-spatial-coverage"
          type="checkbox"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          searchNoResultsText="Nenhum resultado encontrado"
          defaultValue={spatialCoverageValue || loadedSpatialZones.join(",")}
          onChangeRef={spatialCoverageRef}
          onChangeCallback={onSpatialCoverageChange}
          onSearchCallback={onSpatialSearch}
        >
          {spatialCoverageOptions}
        </IsolatedSelect>

        {selectedZoneObjects.length > 0 && (
          <div className="flex flex-wrap gap-8 -mt-8">
            {selectedZoneObjects.map((zone) => (
              <Tag
                key={zone.id}
                aria-label={`Remover ${zone.name}`}
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
          label="Granularidade espacial"
          placeholder="Selecione uma granularidade..."
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
