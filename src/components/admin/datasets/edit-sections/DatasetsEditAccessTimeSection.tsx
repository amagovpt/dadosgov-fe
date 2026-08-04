import React from "react";
import { useTranslation } from "react-i18next";
import { InputDate, type DropdownSectionProps } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

type DatasetsEditAccessTimeSectionProps = {
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

  return (
    <>
      <h2 className="admin-page__section-title">{t("edit.accessSectionTitle")}</h2>
      <div className="admin-page__fields-group">
        <IsolatedSelect
          label={t("edit.licenseField")}
          placeholder={t("edit.licensePlaceholder")}
          id="edit-license"
          defaultValue={loadedLicense}
          onChangeRef={selectedLicenseRef}
        >
          {licenseOptions}
        </IsolatedSelect>
      </div>

      <h2 className="admin-page__section-title">{t("edit.timeSectionTitle")}</h2>
      <div className="admin-page__fields-group">
        <IsolatedSelect
          label={t("edit.frequencyField")}
          placeholder={t("edit.frequencyPlaceholder")}
          id="edit-frequency"
          defaultValue={loadedFrequency}
          onChangeRef={selectedFrequencyRef}
        >
          {frequencyOptions}
        </IsolatedSelect>

        <div className="flex gap-[18px] [&>*]:flex-1">
          <InputDate
            key={`date-start-${temporalStart}`}
            label={t("edit.temporalStartField")}
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
      </div>
    </>
  );
}
