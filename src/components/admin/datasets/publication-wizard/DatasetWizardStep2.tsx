"use client";

import React, { type ReactElement } from "react";
import {
  Button,
  Checkbox,
  InputDate,
  InputText,
  InputTextArea,
  StatusCard,
  Tag,
  type DropdownSectionProps,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { SpatialZone } from "@/service/types/catalog";
import type { ContactPoint } from "@/service/types/dataset";
import type { UserRef } from "@/service/types/identity";
import { getZoneName } from "@/utils/spatialLabels";
import type { DatasetWizardDraftContact } from "./datasetWizardTypes";

type DropdownSection = ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[];

export interface DatasetWizardStep2Props {
  router: { push: (href: string) => void };
  user: UserRef | null;
  producerDefaultValue: string;
  selectedProducerRef: React.MutableRefObject<string>;
  onProducerChange: (value: string) => void;
  producerOptions: DropdownSection;
  formErrors: Partial<Record<string, boolean | string>>;
  datasetTitle: string;
  onDatasetTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  datasetAcronym: string;
  onDatasetAcronymChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  datasetDescription: string;
  onDatasetDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  keywordsDefaultValue: string;
  selectedKeywordsRef: React.MutableRefObject<string>;
  onKeywordsSearch: (q: string) => void;
  onKeywordsValueChange: (value: string) => void;
  tagOptions: DropdownSection;
  selectedKeywords: string[];
  onKeywordTagRemove: (keyword: string) => void;
  licenseDefaultValue: string;
  selectedLicenseRef: React.MutableRefObject<string>;
  licenseOptions: DropdownSection;
  selectedProducer: string;
  orgContactPoints: ContactPoint[];
  selectedContactPointIds: string[];
  onToggleExistingContact: (id: string) => void;
  draftContacts: DatasetWizardDraftContact[];
  onDraftFieldChange: (draftId: number, field: string, value: string) => void;
  onSaveContactDraft: (draftId: number) => void;
  onAddDraftContactRow: () => void;
  frequencyDefaultValue: string;
  selectedFrequencyRef: React.MutableRefObject<string>;
  frequencyOptions: DropdownSection;
  temporalStart: string;
  temporalEnd: string;
  onTemporalStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTemporalEndChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearTemporalCoverageErrors: () => void;
  spatialCoverageDefaultValue: string;
  spatialCoverageRef: React.MutableRefObject<string>;
  onSpatialCoverageChange: (value: string) => void;
  onSpatialZoneSearch: (q: string) => void;
  spatialCoverageOptions: DropdownSection;
  selectedZoneObjects: SpatialZone[];
  onRemoveSpatialZoneTag: (zoneId: string) => void;
  spatialGranularityDefaultValue: string;
  spatialGranularityRef: React.MutableRefObject<string>;
  granularityOptions: DropdownSection;
  onPreviousStep: () => void;
  onStep2Next: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
}

export function DatasetWizardStep2(props: DatasetWizardStep2Props) {
  const {
    router,
    user,
    producerDefaultValue,
    selectedProducerRef,
    onProducerChange,
    producerOptions,
    formErrors,
    datasetTitle,
    onDatasetTitleChange,
    datasetAcronym,
    onDatasetAcronymChange,
    datasetDescription,
    onDatasetDescriptionChange,
    keywordsDefaultValue,
    selectedKeywordsRef,
    onKeywordsSearch,
    onKeywordsValueChange,
    tagOptions,
    selectedKeywords,
    onKeywordTagRemove,
    licenseDefaultValue,
    selectedLicenseRef,
    licenseOptions,
    selectedProducer,
    orgContactPoints,
    selectedContactPointIds,
    onToggleExistingContact,
    draftContacts,
    onDraftFieldChange,
    onSaveContactDraft,
    onAddDraftContactRow,
    frequencyDefaultValue,
    selectedFrequencyRef,
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
    granularityOptions,
    onPreviousStep,
    onStep2Next,
    isSubmitting,
  } = props;

  const hasTemporalCoverageError =
    !!formErrors.temporalCoverage || !!formErrors.temporalCoverageInvalidFormat;
  const temporalCoverageErrorText = formErrors.temporalCoverageInvalidFormat
    ? "Formato de data inválido. Utilize o formato dd/mm/aaaa."
    : "A data de início não pode ser posterior à data de fim.";

  return (
    <>
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>O que é um conjunto de dados?</strong>
            <br />
            Em dados.gov.pt, um conjunto de dados é um conjunto de ficheiros.
          </>
        }
      />
      <p className="pt-32 text-base leading-7 text-neutral-900">
        Os campos marcados com um asterisco ( * ) são obrigatórios.
      </p>
      <h2 className="admin-page__section-title">Produtor</h2>

      <div className="admin-page__fields-group">
        <span className="text-base font-medium leading-7 text-primary-900">
          Confirme a identidade que pretende utilizar na publicação.
        </span>
        <IsolatedSelect
          label="Produtor*"
          placeholder="Selecione o produtor..."
          id="dataset-producer"
          defaultValue={producerDefaultValue}
          onChangeRef={selectedProducerRef}
          onChangeCallback={(value) => onProducerChange(value)}
          hasError={!!formErrors.datasetProducer}
          errorFeedbackText="Campo obrigatório"
        >
          {producerOptions}
        </IsolatedSelect>
      </div>

      {(!user?.organizations || user.organizations.length === 0) && (
        <div className="admin-page__org-card rounded-lg mt-24 flex flex-col items-center gap-16 bg-neutral-50 p-8 text-center">
          <h3 className="text-lg font-bold leading-7 text-primary-900">
            Não pertence a uma organização.
          </h3>
          <p className="text-base leading-7 text-neutral-700">
            Quando o conjunto de dados for produzido no contexto de atividade profissional, é
            recomendável que seja publicado em nome da organização responsável.
          </p>
          <Button variant="primary" onClick={() => router.push("/pages/admin/organizations/new")}>
            Crie ou integre uma organização em dados.gov.pt
          </Button>
        </div>
      )}

      <form
        className="admin-page__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onStep2Next();
        }}
      >
        <h2 className="admin-page__section-title">Descrição</h2>

        <div className="admin-page__fields-group">
          {formErrors.datasetTitleTooLong && (
            <StatusCard
              variant="danger"
              showIcon
              description="O título não pode ter mais do que 350 caracteres."
            />
          )}
          <InputText
            label="Título*"
            placeholder="Insira o título aqui"
            id="api-name"
            value={datasetTitle}
            onChange={onDatasetTitleChange}
            hasError={!!formErrors.datasetTitle || !!formErrors.datasetTitleTooLong}
            hasFeedback={!!formErrors.datasetTitle || !!formErrors.datasetTitleTooLong}
            feedbackState="danger"
            errorFeedbackText={
              formErrors.datasetTitleTooLong
                ? "O título não pode ter mais do que 350 caracteres."
                : "Campo obrigatório"
            }
          />
          <InputText
            label="Sigla"
            placeholder="Insira a sigla aqui"
            id="api-acronym"
            required={false}
            value={datasetAcronym}
            onChange={onDatasetAcronymChange}
          />
          <InputTextArea
            label="Descrição *"
            placeholder="Insira a descrição aqui"
            id="dataset-description"
            rows={4}
            maxLength={3000}
            showCharCounter={true}
            value={datasetDescription}
            onChange={onDatasetDescriptionChange}
            hasError={!!formErrors.datasetDescription}
            hasFeedback={!!formErrors.datasetDescription || datasetDescription.length < 1000}
            feedbackState={formErrors.datasetDescription ? "danger" : "warning"}
            feedbackText="Recomenda-se que a descrição tenha pelo menos 1000 caracteres."
            errorFeedbackText="Campo obrigatório"
          />
          <IsolatedSelect
            label="Palavras-chave"
            placeholder="Pesquise ou insira palavras-chave..."
            id="dataset-keywords"
            type="checkbox"
            searchable
            searchInputPlaceholder="Escreva para pesquisar ou criar..."
            searchNoResultsText="Nenhum resultado encontrado"
            defaultValue={keywordsDefaultValue}
            onChangeRef={selectedKeywordsRef}
            onSearchCallback={onKeywordsSearch}
            onChangeCallback={onKeywordsValueChange}
          >
            {tagOptions}
          </IsolatedSelect>

          {selectedKeywords.length > 0 && (
            <div className="-mt-8 flex flex-wrap gap-8">
              {selectedKeywords.map((keyword) => (
                <Tag
                  key={keyword}
                  aria-label={`Remover ${keyword}`}
                  onClick={() => onKeywordTagRemove(keyword)}
                >
                  {keyword}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <h2 className="admin-page__section-title">Acesso</h2>

        <div className="admin-page__fields-group">
          <IsolatedSelect
            label="Licença"
            placeholder="Selecione uma licença..."
            id="dataset-license"
            defaultValue={licenseDefaultValue}
            onChangeRef={selectedLicenseRef}
          >
            {licenseOptions}
          </IsolatedSelect>
        </div>

        {selectedProducer && selectedProducer !== "user" && (
          <>
            <h2 className="admin-page__section-title">Pontos de contacto *</h2>

            <div className="admin-page__fields-group">
              {formErrors.contactDrafts && (
                <StatusCard
                  variant="danger"
                  showIcon
                  description="É obrigatório adicionar pelo menos um ponto de contacto."
                />
              )}
              {orgContactPoints.length > 0 && (
                <div className="flex flex-col gap-2">
                  {orgContactPoints.map((cp) => (
                    <Checkbox
                      key={cp.id}
                      label={cp.name}
                      value={cp.id}
                      name="contact-points"
                      checked={selectedContactPointIds.includes(cp.id)}
                      onChange={() => onToggleExistingContact(cp.id)}
                    />
                  ))}
                </div>
              )}

              {draftContacts.map((draft) => (
                <div key={draft.id}>
                  <div
                    className="text-base font-medium leading-7 text-primary-900"
                    style={{ paddingBottom: "16px" }}
                  >
                    Novo ponto de contacto
                  </div>
                  <div style={{ paddingBottom: "24px" }}>
                    <InputText
                      label="Nome *"
                      placeholder="Por exemplo, o nome do serviço."
                      id={`contact-name-${draft.id}`}
                      value={draft.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onDraftFieldChange(draft.id, "name", e.target.value)
                      }
                      hasError={!!draft.errors.name}
                      hasFeedback={!!draft.errors.name}
                      feedbackState="danger"
                      errorFeedbackText="Campo obrigatório"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-[18px]" style={{ paddingBottom: "24px" }}>
                    <InputText
                      label="E-mail"
                      placeholder="contact@organisation.org"
                      id={`contact-email-${draft.id}`}
                      value={draft.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onDraftFieldChange(draft.id, "email", e.target.value)
                      }
                      hasError={!!draft.errors.email}
                      hasFeedback={!!draft.errors.email}
                      feedbackState="danger"
                      errorFeedbackText="É necessário um endereço de e-mail caso não seja fornecido um link."
                    />
                    <InputText
                      label="Website"
                      placeholder="https://..."
                      id={`contact-link-${draft.id}`}
                      value={draft.link}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onDraftFieldChange(draft.id, "link", e.target.value)
                      }
                      hasError={!!draft.errors.link}
                      hasFeedback={!!draft.errors.link}
                      feedbackState="danger"
                      errorFeedbackText="É necessário um link caso não seja fornecido um endereço de e‑mail."
                    />
                  </div>
                  <div style={{ paddingBottom: "24px" }}>
                    <Button
                      type="button"
                      appearance="outline"
                      variant="primary"
                      hasIcon
                      leadingIcon="agora-line-check-circle"
                      leadingIconHover="agora-solid-check-circle"
                      onClick={() => onSaveContactDraft(draft.id)}
                    >
                      Guardar contacto
                    </Button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "-16px" }}>
                <Button
                  type="button"
                  appearance="outline"
                  variant="primary"
                  hasIcon
                  leadingIcon="agora-line-plus-circle"
                  leadingIconHover="agora-solid-plus-circle"
                  onClick={onAddDraftContactRow}
                >
                  Novo contacto
                </Button>
              </div>
            </div>
          </>
        )}

        <h2 className="admin-page__section-title">Tempo</h2>

        <div className="admin-page__fields-group">
          <IsolatedSelect
            label="Frequência de atualização *"
            placeholder="Selecione uma frequência..."
            id="dataset-frequency"
            defaultValue={frequencyDefaultValue}
            onChangeRef={selectedFrequencyRef}
            hasError={!!formErrors.datasetFrequency}
            errorFeedbackText="Campo obrigatório"
          >
            {frequencyOptions}
          </IsolatedSelect>

          <div className="grid grid-cols-2 gap-[18px]">
            <InputDate
              label="Cobertura temporal (Data de início)"
              id="dataset-date-start"
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
              hasError={hasTemporalCoverageError}
              hasFeedback={hasTemporalCoverageError}
              feedbackState="danger"
              errorFeedbackText={temporalCoverageErrorText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onTemporalStartChange(e);
                clearTemporalCoverageErrors();
              }}
            />
            <InputDate
              label="Data de fim"
              id="dataset-date-end"
              defaultValue={temporalEnd}
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
              hasError={hasTemporalCoverageError}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onTemporalEndChange(e);
                clearTemporalCoverageErrors();
              }}
            />
          </div>
        </div>

        <h2 className="admin-page__section-title">Espaço</h2>

        <div className="admin-page__fields-group">
          <IsolatedSelect
            label="Cobertura espacial"
            placeholder="Selecione uma cobertura espacial..."
            id="dataset-spatial-coverage"
            type="checkbox"
            defaultValue={spatialCoverageDefaultValue}
            searchable
            searchInputPlaceholder="Escreva para pesquisar..."
            searchNoResultsText="Nenhum resultado encontrado"
            onChangeRef={spatialCoverageRef}
            onChangeCallback={onSpatialCoverageChange}
            onSearchCallback={onSpatialZoneSearch}
          >
            {spatialCoverageOptions}
          </IsolatedSelect>

          {selectedZoneObjects.length > 0 && (
            <div className="-mt-8 flex flex-wrap gap-8">
              {selectedZoneObjects.map((zone) => (
                <Tag
                  key={zone.id}
                  aria-label={`Remover ${getZoneName(zone)}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onRemoveSpatialZoneTag(zone.id)}
                >
                  {zone.code ? `${getZoneName(zone)} (${zone.code})` : getZoneName(zone)}
                </Tag>
              ))}
            </div>
          )}

          <IsolatedSelect
            label="Granularidade espacial"
            placeholder="Selecione uma granularidade espacial..."
            id="dataset-spatial-granularity"
            defaultValue={spatialGranularityDefaultValue}
            searchable
            searchInputPlaceholder="Escreva para pesquisar..."
            searchNoResultsText="Nenhum resultado encontrado"
            onChangeRef={spatialGranularityRef}
          >
            {granularityOptions}
          </IsolatedSelect>
        </div>

        <div className="admin-page__actions flex justify-between gap-[18px]">
          <Button
            type="button"
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-solid-arrow-left-circle"
            onClick={onPreviousStep}
          >
            Anterior
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            disabled={isSubmitting}
          >
            {isSubmitting ? "A criar..." : "Seguinte"}
          </Button>
        </div>
      </form>
    </>
  );
}
