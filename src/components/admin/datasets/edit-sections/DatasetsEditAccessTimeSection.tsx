import React from "react";
import { useTranslation } from "react-i18next";
import { Icon, InputDate, type DropdownSectionProps } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { DatasetWizardHelp } from "../publication-wizard/DatasetWizardHelp";
import { getDatasetAuxiliarItem } from "../config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";

type DatasetsEditAccessTimeSectionProps = {
  auxiliaryItems: AuxiliarItem[];
  formErrors: Partial<Record<string, boolean | string>>;
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
  selectedLicenseRef: React.MutableRefObject<string>;
  selectedFrequencyRef: React.MutableRefObject<string>;
  onTemporalStartChange: (value: string) => void;
  onTemporalEndChange: (value: string) => void;
};

export default function DatasetsEditAccessTimeSection({
  auxiliaryItems,
  formErrors,
  loadedLicense,
  licenseOptions,
  loadedFrequency,
  frequencyOptions,
  temporalStart,
  temporalEnd,
  selectedLicenseRef,
  selectedFrequencyRef,
  onTemporalStartChange,
  onTemporalEndChange,
}: DatasetsEditAccessTimeSectionProps) {
  const { t } = useTranslation("admin-datasets");
  const accessSection = useDatasetSection("access-conditions");
  const temporalSection = useDatasetSection("temporal-coverage");

  return (
    <>
      <section className="flex flex-col gap-32">
        <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
          <h2 className="text-xl-bold">{accessSection?.title ?? ""}</h2>
          <DatasetContentDescription html={accessSection?.description} className="text-m-regular" />
        </div>
        <div className="flex min-w-0 flex-col gap-16">
          <IsolatedSelect
            label={t("coverage.licenseLabel")}
            placeholder={t("edit.licensePlaceholder")}
            id="edit-license"
            defaultValue={loadedLicense}
            onChangeRef={selectedLicenseRef}
          >
            {licenseOptions}
          </IsolatedSelect>
          <DatasetWizardHelp
            item={getDatasetAuxiliarItem(auxiliaryItems, "license")}
            background="white"
          />
        </div>
      </section>
      <section id="edit-time-section" className="flex scroll-mt-32 flex-col gap-32">
        <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
          <h2 className="text-xl-bold">{temporalSection?.title ?? ""}</h2>
          <DatasetContentDescription
            html={temporalSection?.description}
            className="text-m-regular"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-16">
          <IsolatedSelect
            label={t("edit.frequencyField")}
            placeholder={t("edit.frequencyPlaceholder")}
            id="edit-frequency"
            defaultValue={loadedFrequency}
            onChangeRef={selectedFrequencyRef}
          >
            {frequencyOptions}
          </IsolatedSelect>

          <span className="-mt-8 flex items-center gap-8 text-s-regular text-neutral-700">
            <Icon
              name="agora-solid-info-mark"
              dimensions="xs"
              className="fill-informative-500!"
              aria-hidden="true"
            />
            {t("form.fieldRequired")}
          </span>
          <DatasetWizardHelp
            item={getDatasetAuxiliarItem(auxiliaryItems, "frequency")}
            background="white"
          />
        </div>
        <h3 className="text-l-semibold text-primary-900">{t("coverage.temporalCoverageTitle")}</h3>
        <div className="grid grid-cols-1 gap-32 md:grid-cols-2">
          <InputDate
            key={`date-start-${temporalStart}`}
            label={t("coverage.startDateLabel")}
            id="edit-date-start"
            defaultValue={temporalStart}
            dayInputPlaceholder={t("edit.date.day")}
            monthInputPlaceholder={t("edit.date.month")}
            yearInputPlaceholder={t("edit.date.year")}
            calendarIconAriaLabel={t("edit.date.openCalendar")}
            previousYearAriaLabel={t("edit.date.previousYear")}
            previousMonthAriaLabel={t("edit.date.previousMonth")}
            nextMonthAriaLabel={t("edit.date.nextMonth")}
            nextYearAriaLabel={t("edit.date.nextYear")}
            selectedDayAriaLabel={t("edit.date.selectedDay")}
            todayDayAriaLabel={t("edit.date.todayDay")}
            todayLabel={t("edit.date.today")}
            cancelLabel={t("edit.date.cancel")}
            okLabel={t("edit.date.ok")}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onTemporalStartChange(event.target.value)
            }
          />
          <InputDate
            key={`date-end-${temporalEnd}`}
            label={t("edit.temporalEndField")}
            id="edit-date-end"
            defaultValue={temporalEnd}
            hasError={!!formErrors.temporalEnd}
            errorFeedbackText={t("edit.invalidTemporalRange")}
            dayInputPlaceholder={t("edit.date.day")}
            monthInputPlaceholder={t("edit.date.month")}
            yearInputPlaceholder={t("edit.date.year")}
            calendarIconAriaLabel={t("edit.date.openCalendar")}
            previousYearAriaLabel={t("edit.date.previousYear")}
            previousMonthAriaLabel={t("edit.date.previousMonth")}
            nextMonthAriaLabel={t("edit.date.nextMonth")}
            nextYearAriaLabel={t("edit.date.nextYear")}
            selectedDayAriaLabel={t("edit.date.selectedDay")}
            todayDayAriaLabel={t("edit.date.todayDay")}
            todayLabel={t("edit.date.today")}
            cancelLabel={t("edit.date.cancel")}
            okLabel={t("edit.date.ok")}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onTemporalEndChange(event.target.value)
            }
          />
        </div>
        <DatasetWizardHelp
          item={getDatasetAuxiliarItem(auxiliaryItems, "temporal-coverage")}
          background="white"
        />
      </section>
    </>
  );
}
