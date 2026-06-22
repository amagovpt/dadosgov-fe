import React from "react";
import { InputDate, type DropdownSectionProps } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

type DatasetsEditAccessTimeSectionProps = {
  formErrors: Partial<Record<string, boolean>>;
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
  return (
    <>
      <h2 className="admin-page__section-title">Acesso</h2>
      <div className="admin-page__fields-group">
        <IsolatedSelect
          label="Licença"
          placeholder="Selecione uma licença..."
          id="edit-license"
          defaultValue={loadedLicense}
          onChangeRef={selectedLicenseRef}
        >
          {licenseOptions}
        </IsolatedSelect>
      </div>

      <h2 className="admin-page__section-title">Tempo</h2>
      <div className="admin-page__fields-group">
        <IsolatedSelect
          label="Frequência de atualização *"
          placeholder="Selecione uma frequência..."
          id="edit-frequency"
          defaultValue={loadedFrequency}
          onChangeRef={selectedFrequencyRef}
        >
          {frequencyOptions}
        </IsolatedSelect>

        <div className="flex gap-[18px] [&>*]:flex-1">
          <InputDate
            key={`date-start-${temporalStart}`}
            label="Cobertura temporal (Data de início)"
            id="edit-date-start"
            defaultValue={temporalStart}
            dayInputPlaceholder="dd"
            monthInputPlaceholder="mm"
            yearInputPlaceholder="aaaa"
            calendarIconAriaLabel="Abrir calendário"
            previousYearAriaLabel="Ano anterior"
            previousMonthAriaLabel="Mês anterior"
            nextMonthAriaLabel="Próximo mês"
            nextYearAriaLabel="Próximo ano"
            selectedDayAriaLabel="Dia selecionado"
            todayDayAriaLabel="Hoje"
            todayLabel="Hoje"
            cancelLabel="Cancelar"
            okLabel="OK"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onTemporalStartChange(event.target.value)
            }
          />
          <InputDate
            key={`date-end-${temporalEnd}`}
            label="Data de fim"
            id="edit-date-end"
            defaultValue={temporalEnd}
            hasError={!!formErrors.temporalEnd}
            errorFeedbackText="A data de fim tem de ser posterior à data de início"
            dayInputPlaceholder="dd"
            monthInputPlaceholder="mm"
            yearInputPlaceholder="aaaa"
            calendarIconAriaLabel="Abrir calendário"
            previousYearAriaLabel="Ano anterior"
            previousMonthAriaLabel="Mês anterior"
            nextMonthAriaLabel="Próximo mês"
            nextYearAriaLabel="Próximo ano"
            selectedDayAriaLabel="Dia selecionado"
            todayDayAriaLabel="Hoje"
            todayLabel="Hoje"
            cancelLabel="Cancelar"
            okLabel="OK"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onTemporalEndChange(event.target.value)
            }
          />
        </div>
      </div>
    </>
  );
}
