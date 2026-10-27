"use client";

import { Icon, InputDate, Tag } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { getZoneName } from "@/utils/spatialLabels";
import { DatasetWizardHelp } from "./DatasetWizardHelp";
import { getDatasetAuxiliarItem } from "../config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";
import type { DatasetWizardStep2Props } from "./DatasetWizardStep2";

type CoverageFieldsProps = Pick<
  DatasetWizardStep2Props,
  | "auxiliaryItems"
  | "formErrors"
  | "licenseDefaultValue"
  | "selectedLicenseRef"
  | "onLicenseChange"
  | "licenseOptions"
  | "frequencyDefaultValue"
  | "selectedFrequencyRef"
  | "onFrequencyChange"
  | "frequencyOptions"
  | "temporalStart"
  | "temporalEnd"
  | "onTemporalStartChange"
  | "onTemporalEndChange"
  | "clearTemporalCoverageErrors"
  | "spatialCoverageDefaultValue"
  | "spatialCoverageRef"
  | "onSpatialCoverageChange"
  | "onSpatialZoneSearch"
  | "spatialCoverageOptions"
  | "selectedZoneObjects"
  | "onRemoveSpatialZoneTag"
  | "spatialGranularityDefaultValue"
  | "spatialGranularityRef"
  | "onGranularityChange"
  | "granularityOptions"
>;

export function DatasetWizardCoverageFields({
  auxiliaryItems = [],
  formErrors,
  licenseDefaultValue,
  selectedLicenseRef,
  onLicenseChange,
  licenseOptions,
  frequencyDefaultValue,
  selectedFrequencyRef,
  onFrequencyChange,
  frequencyOptions,
  temporalStart,
  temporalEnd,
  onTemporalStartChange,
  onTemporalEndChange,
  clearTemporalCoverageErrors,
  spatialCoverageDefaultValue,
  spatialCoverageRef,
  onSpatialCoverageChange,
  onSpatialZoneSearch,
  spatialCoverageOptions,
  selectedZoneObjects,
  onRemoveSpatialZoneTag,
  spatialGranularityDefaultValue,
  spatialGranularityRef,
  onGranularityChange,
  granularityOptions,
}: CoverageFieldsProps) {
  const { t } = useTranslation("admin-datasets");
  const accessSection = useDatasetSection("access-conditions");
  const temporalSection = useDatasetSection("temporal-coverage");
  const hasTemporalError =
    !!formErrors.temporalCoverage || !!formErrors.temporalCoverageInvalidFormat;
  const temporalError = t(
    formErrors.temporalCoverageInvalidFormat
      ? "form.invalidDateFormat"
      : "form.invalidTemporalRange"
  );
  const dateLabels = {
    dayInputPlaceholder: t("edit.date.day"),
    monthInputPlaceholder: t("edit.date.month"),
    yearInputPlaceholder: t("edit.date.year"),
    calendarIconAriaLabel: t("edit.date.openCalendar"),
    previousYearAriaLabel: t("edit.date.previousYear"),
    previousMonthAriaLabel: t("edit.date.previousMonth"),
    nextMonthAriaLabel: t("edit.date.nextMonth"),
    nextYearAriaLabel: t("edit.date.nextYear"),
    selectedDayAriaLabel: t("edit.date.selectedDay"),
    todayDayAriaLabel: t("edit.date.todayDay"),
    todayLabel: t("edit.date.today"),
    cancelLabel: t("edit.date.cancel"),
    okLabel: t("edit.date.ok"),
  };

  return (
    <>
      <section className="flex flex-col gap-32 [&_.indicator_svg]:fill-neutral-900!">
        <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
          <h2 className="text-xl-bold">{accessSection?.title ?? ""}</h2>
          <DatasetContentDescription html={accessSection?.description} className="text-m-regular" />
        </div>
        <IsolatedSelect
          label={t("coverage.licenseLabel")}
          placeholder={t("form.licensePlaceholder")}
          id="dataset-license"
          defaultValue={licenseDefaultValue}
          onChangeRef={selectedLicenseRef}
          onChangeCallback={onLicenseChange}
          required={false}
        >
          {licenseOptions}
        </IsolatedSelect>
        <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "license")} />
      </section>

      <section className="flex flex-col gap-32 [&_.indicator_svg]:fill-neutral-900!">
        <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
          <h2 className="text-xl-bold">{temporalSection?.title ?? ""}</h2>
          <DatasetContentDescription
            html={temporalSection?.description}
            className="text-m-regular"
          />
        </div>
        <div className="flex flex-col gap-8">
          <IsolatedSelect
            label={t("coverage.frequencyLabel")}
            placeholder={t("coverage.frequencyPlaceholder")}
            id="dataset-frequency"
            defaultValue={frequencyDefaultValue}
            onChangeRef={selectedFrequencyRef}
            onChangeCallback={onFrequencyChange}
            hasError={!!formErrors.datasetFrequency}
            errorFeedbackText={t("form.fieldRequired")}
            required
          >
            {frequencyOptions}
          </IsolatedSelect>
          <p className="flex items-center gap-8 text-s-regular text-neutral-700">
            <Icon
              name="agora-solid-info-mark"
              dimensions="xs"
              className="shrink-0 fill-informative-500!"
            />
            {t("coverage.frequencyRequired")}
          </p>
        </div>
        <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "frequency")} />
        <h3 className="text-l-semibold text-primary-900">{t("coverage.temporalCoverageTitle")}</h3>
        <div className="grid grid-cols-1 gap-32 md:grid-cols-2 [&_.input-trailing-icon_svg]:fill-neutral-900!">
          <InputDate
            {...dateLabels}
            id="dataset-date-start"
            label={t("coverage.startDateLabel")}
            defaultValue={temporalStart}
            required={false}
            hasError={hasTemporalError}
            hasFeedback={hasTemporalError}
            feedbackState="danger"
            errorFeedbackText={temporalError}
            onChange={(event) => {
              onTemporalStartChange(event);
              clearTemporalCoverageErrors();
            }}
          />
          <InputDate
            {...dateLabels}
            id="dataset-date-end"
            label={t("form.temporalEndField")}
            defaultValue={temporalEnd}
            required={false}
            hasError={hasTemporalError}
            onChange={(event) => {
              onTemporalEndChange(event);
              clearTemporalCoverageErrors();
            }}
          />
        </div>
        <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "temporal-coverage")} />
      </section>

      <section className="flex flex-col gap-32 [&_.indicator_svg]:fill-neutral-900!">
        <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
          <h2 className="text-xl-bold">{t("coverage.geographicSectionTitle")}</h2>
          <p className="text-m-regular">{t("coverage.geographicDescription")}</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-32 md:grid-cols-2 [&>*]:min-w-0">
          <div className="flex min-w-0 flex-col gap-16">
            <IsolatedSelect
              label={t("coverage.geographicCoverageLabel")}
              placeholder={t("coverage.geographicCoveragePlaceholder")}
              id="dataset-spatial-coverage"
              type="checkbox"
              defaultValue={spatialCoverageDefaultValue}
              searchable
              searchInputPlaceholder={t("form.searchPlaceholder")}
              searchNoResultsText={t("form.searchNoResults")}
              onChangeRef={spatialCoverageRef}
              onChangeCallback={onSpatialCoverageChange}
              onSearchCallback={onSpatialZoneSearch}
              required={false}
            >
              {spatialCoverageOptions}
            </IsolatedSelect>
            {selectedZoneObjects.length > 0 && (
              <div className="flex flex-wrap gap-8">
                {selectedZoneObjects.map((zone) => (
                  <Tag
                    key={zone.id}
                    aria-label={t("form.removeSpatialZone", { name: getZoneName(zone) })}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onRemoveSpatialZoneTag(zone.id)}
                  >
                    {zone.code ? `${getZoneName(zone)} (${zone.code})` : getZoneName(zone)}
                  </Tag>
                ))}
              </div>
            )}
          </div>
          <IsolatedSelect
            label={t("coverage.geographicGranularityLabel")}
            placeholder={t("coverage.geographicGranularityPlaceholder")}
            id="dataset-spatial-granularity"
            defaultValue={spatialGranularityDefaultValue}
            searchable
            searchInputPlaceholder={t("form.searchPlaceholder")}
            searchNoResultsText={t("form.searchNoResults")}
            onChangeRef={spatialGranularityRef}
            onChangeCallback={onGranularityChange}
            required={false}
          >
            {granularityOptions}
          </IsolatedSelect>
        </div>
        <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "spatial-granularity")} />
      </section>
    </>
  );
}
