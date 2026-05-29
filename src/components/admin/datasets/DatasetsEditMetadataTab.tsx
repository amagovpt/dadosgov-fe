import React from "react";
import {
  Button,
  type DropdownSectionProps,
  Icon,
  InputDate,
  StatusCard,
  Switch,
  Tag,
} from "@ama-pt/agora-design-system";
import dynamic from "next/dynamic";
import AuxiliarList from "@/components/admin/AuxiliarList";
import { getDatasetAuxiliarItems } from "@/components/admin/datasets/datasetsAuxiliarItems";
import IsolatedInput from "@/components/admin/IsolatedInput";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { SpatialZone } from '@/service/types/catalog';
import type { Dataset } from '@/service/types/dataset';
import AppIcon from "@/components/Primitives/AppIcon";

const RichTextEditor = dynamic(() => import("@/components/admin/posts/RichTextEditor"), {
  ssr: false,
  loading: () => <p>A carregar editor...</p>,
});

type DatasetsEditMetadataTabProps = {
  dataset: Dataset;
  featured: boolean;
  isSubmitting: boolean;
  formErrors: Record<string, boolean>;
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
          <div className="dataset-edit-visibility-banner">
            <StatusCard
              variant="informative"
              showIcon
              description={
                <>
                  <strong>Modifique a visibilidade do conjunto de dados.</strong>
                  <br />
                  Este conjunto de dados encontra-se atualmente em <strong>modo privado</strong>.
                  Apenas os membros da organização o podem visualizar e editar.
                </>
              }
            />
            <div>
              <Button
                variant="primary"
                appearance="outline"
                onClick={onPublishDataset}
                disabled={isSubmitting}
              >
                Publicar o conjunto de dados
              </Button>
            </div>
          </div>
        )}

        <form className="admin-page__form" noValidate onSubmit={(e) => e.preventDefault()}>
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

          <h2 className="admin-page__section-title admin-page__section-title--no-top">Descrição</h2>
          <div className="admin-page__fields-group">
            <IsolatedInput
              label="Título*"
              placeholder="Insira o título aqui"
              id="edit-title"
              defaultValue={loadedTitle}
              onChange={onTitleChange}
              hasError={!!formErrors.title}
              hasFeedback={!!formErrors.title}
              feedbackState="danger"
              errorFeedbackText="Campo obrigatório"
            />
            <IsolatedInput
              label="Sigla"
              placeholder="Insira a sigla aqui"
              id="edit-acronym"
              defaultValue={loadedAcronym}
              onChange={onAcronymChange}
            />
            <div className="flex flex-col gap-8">
              <span className="text-primary-900 text-base font-medium leading-7">Descrição *</span>
              <RichTextEditor content={description} onChange={onDescriptionChange} />
              {formErrors.description && (
                <span className="text-danger-600 text-sm">Campo obrigatório</span>
              )}
            </div>
            <IsolatedSelect
              label="Palavras-chave"
              placeholder="Pesquise ou insira palavras-chave..."
              id="edit-keywords"
              type="checkbox"
              searchable
              searchInputPlaceholder="Escreva para pesquisar ou criar..."
              searchNoResultsText="Nenhum resultado encontrado"
              defaultValue={loadedKeywords}
              onChangeRef={keywordsRef}
              onSearchCallback={onKeywordSearch}
              onChangeCallback={onKeywordsChange}
            >
              {keywordOptions}
            </IsolatedSelect>

            {selectedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-8 -mt-8">
                {selectedKeywords.map((keyword) => (
                  <Tag
                    key={keyword}
                    aria-label={`Remover ${keyword}`}
                    onClick={() => {
                      onRemoveKeyword(keyword);
                    }}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTemporalStartChange(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTemporalEndChange(e.target.value)}
              />
            </div>
          </div>

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
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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

          <div className="admin-page__actions flex justify-end mt-24">
            <Button
              type="button"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={onSaveMetadata}
              disabled={isSubmitting}
            >
              {isSubmitting ? "A guardar..." : "Guardar"}
            </Button>
          </div>

          <div className="dataset-edit-danger-actions">
            <StatusCard
              variant="warning"
              showIcon
              description={
                <>
                  <strong>
                    Um conjunto de dados arquivado deixa de estar indexado no portal, mas
                    permanece acessível através de um link direto.
                  </strong>
                  <br />
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={onToggleArchive}
                  >
                    {dataset.archived ? "Desarquivar o conjunto de dados" : "Arquivar o conjunto de dados"}
                  </Button>
                </>
              }
            />
            <StatusCard
              variant="danger"
              showIcon
              description={
                <>
                  <strong>Atenção esta ação é irreversível.</strong>
                  <br />
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={onOpenDeletePopup}
                    disabled={isSubmitting}
                  >
                    Eliminar o conjunto de dados
                  </Button>
                </>
              }
            />
          </div>
        </form>
      </div>

      <aside className="admin-page__auxiliar">
        <div className="admin-page__auxiliar-inner">
          <div className="admin-page__auxiliar-header">
            <AppIcon name="agora-line-question-mark" className="w-24 h-24" />
            <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
          </div>
          <AuxiliarList
            items={getDatasetAuxiliarItems({
              title: !!formErrors.title,
              description: !!formErrors.description,
            })}
          />
        </div>
      </aside>
    </div>
  );
}
