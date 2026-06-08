"use client";

import React, { useMemo } from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
  InputText,
  InputTextArea,
  StatusCard,
  Switch,
} from "@ama-pt/agora-design-system";
import AppIcon from "@/components/Primitives/AppIcon";
import AuxiliarList from "@/components/admin/AuxiliarList";
import IsolatedInput from "@/components/admin/IsolatedInput";
import { HarvesterPreviewPanel } from "@/components/admin/harvesters/HarvesterPreviewPanel";
import type { HarvestBackend, HarvestPreviewJob } from "@/types/api";

const FILTER_KEY_LABELS: Record<string, string> = {
  Organization: "Organização",
  Tag: "Etiqueta",
  Publisher: "Editor",
  "Remote ID": "ID Remoto",
};

const localizeFilterLabel = (label: string) => FILTER_KEY_LABELS[label] ?? label;

// Schedule ("Planeamento") is a cron expression with exactly 5 fields
// (minuto hora dia mês dia-da-semana), each field being a number or "*".
// Mask: "* * * * *" (e.g. "0 12 * * *"). Max 14 characters (e.g. "59 59 59 59 59").
const SCHEDULE_MAX_LENGTH = 14;
const SCHEDULE_FIELD_COUNT = 5;
const SCHEDULE_FIELD_PATTERN = /^(\d+|\*)$/;
const SCHEDULE_ERROR_MESSAGE =
  "O planeamento tem de ter exatamente 5 campos separados por espaços, cada campo sendo um número ou * " +
  "(minuto  hora  dia-do-mês  mês  dia-da-semana).";

// Returns an error message when the value is a non-empty, invalid cron
// expression. An empty value is valid (it unschedules the harvester).
function validateSchedule(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fields = trimmed.split(/\s+/);
  if (fields.length !== SCHEDULE_FIELD_COUNT) return SCHEDULE_ERROR_MESSAGE;
  if (!fields.every((field) => SCHEDULE_FIELD_PATTERN.test(field))) return SCHEDULE_ERROR_MESSAGE;
  return null;
}

interface HarvesterConfigFormProps {
  harvesterName: string;
  setHarvesterName: (v: string) => void;
  harvesterDescription: string;
  setHarvesterDescription: (v: string) => void;
  harvesterUrl: string;
  setHarvesterUrl: (v: string) => void;
  isEnabled: boolean;
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isAutoArchive: boolean;
  setIsAutoArchive: React.Dispatch<React.SetStateAction<boolean>>;
  filters: { type: string; value: string; mode: string }[];
  loadedSchedule: string;
  selectedBackend: string;
  setSelectedBackend: (v: string) => void;
  backends: HarvestBackend[];
  activeBackendFilters: { key: string; label: string }[];
  formErrors: Record<string, boolean>;
  clearError: (field: string) => void;
  addFilter: () => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, field: string, value: string) => void;
  setHarvesterSchedule: (v: string) => void;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onSave: () => void;
  isPreviewing: boolean;
  previewJob: HarvestPreviewJob | null;
  previewError: string | null;
  onPreview: () => void;
  onDelete: () => void;
}

export function HarvesterConfigForm({
  harvesterName,
  setHarvesterName,
  harvesterDescription,
  setHarvesterDescription,
  harvesterUrl,
  setHarvesterUrl,
  isEnabled,
  setIsEnabled,
  isAutoArchive,
  setIsAutoArchive,
  filters,
  loadedSchedule,
  selectedBackend,
  setSelectedBackend,
  backends,
  activeBackendFilters,
  formErrors,
  clearError,
  addFilter,
  removeFilter,
  updateFilter,
  setHarvesterSchedule,
  isSaving,
  saveSuccess,
  saveError,
  onSave,
  isPreviewing,
  previewJob,
  previewError,
  onPreview,
  onDelete,
}: HarvesterConfigFormProps) {
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);

  const handleScheduleChange = (value: string) => {
    setHarvesterSchedule(value);
    setScheduleError(validateSchedule(value));
  };

  const typeOptions = useMemo(
    () => (
      <DropdownSection name="types">
        {backends.map((b) => (
          <DropdownOption key={b.id} value={b.id} selected={b.id === selectedBackend}>
            {b.label}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [backends, selectedBackend],
  );

  const auxiliarItems = [
    {
      title: "Dar um nome",
      content:
        "Dê um nome ao seu harvester. Esta é uma referência interna que o ajudará a identificá-lo caso crie vários harvesters. O nome do seu harvester não será público.",
      hasError: !!formErrors.harvesterName,
    },
    {
      title: "Descrever o seu harvester",
      content:
        "Adicione detalhes no campo de descrição para seu uso interno. A descrição é opcional.",
    },
    {
      title: "Adicionar o URL",
      content:
        "Insira aqui o URL do portal que deseja recolher. Normalmente, trata-se do URL da página inicial do seu portal de dados abertos. O URL permite que o harvester navegue e recupere todos os seus conjuntos de dados.",
      hasError: !!formErrors.harvesterUrl,
    },
    {
      title: "Identificar o tipo de implementação",
      content:
        "Escolha o formato dos metadados (por exemplo, DCAT, CKAN, etc.). Esse formato permite que o harvester saiba como ler e interpretar os seus metadados, para que possam ser transcritos corretamente em dados.gov.pt.",
    },
  ];

  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        <form
          className="admin-page__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (scheduleError) return;
            onSave();
          }}
        >
          <p className="text-neutral-900 text-base leading-7 pt-32">
            Os campos marcados com um asterisco ( <span className="text-red-600">*</span> ) são
            obrigatórios.
          </p>

          <h2 className="admin-page__section-title">Descrição</h2>

          <div className="admin-page__fields-group">
            <InputText
              label="Nome *"
              placeholder=""
              id="harvester-name"
              value={harvesterName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setHarvesterName(e.target.value);
                if (e.target.value.trim()) clearError("harvesterName");
              }}
              hasError={!!formErrors.harvesterName}
              hasFeedback={!!formErrors.harvesterName}
              feedbackState="danger"
              errorFeedbackText="Campo obrigatório"
            />

            <InputTextArea
              label="Descrição *"
              placeholder=""
              id="harvester-description"
              rows={6}
              value={harvesterDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setHarvesterDescription(e.target.value)
              }
            />

            <InputText
              label="URL *"
              placeholder=""
              id="harvester-url"
              value={harvesterUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setHarvesterUrl(e.target.value);
                if (e.target.value.trim()) clearError("harvesterUrl");
              }}
              hasError={!!formErrors.harvesterUrl}
              hasFeedback={!!formErrors.harvesterUrl}
              feedbackState="danger"
              errorFeedbackText="Campo obrigatório"
            />
          </div>

          <h2 className="admin-page__section-title">Implementação</h2>

          <div className="admin-page__fields-group">
            <InputSelect
              key={`harvester-type-${selectedBackend}`}
              label="Tipo *"
              placeholder=""
              id="harvester-type"
              defaultValue={selectedBackend}
              searchable
              searchInputPlaceholder="Escreva para pesquisar..."
              searchNoResultsText="Nenhum resultado encontrado"
              onChange={(options) => {
                if (options.length > 0) setSelectedBackend(options[0].value as string);
              }}
            >
              {typeOptions}
            </InputSelect>

            {activeBackendFilters.length > 0 && (
              <div>
                <p className="text-primary-900 text-base font-medium leading-7">Filtros</p>

                {filters.map((filter, index) => (
                  <div
                    key={index}
                    className={`mt-8 pb-16 mb-8 ${index < filters.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    <div className="flex items-center gap-8">
                      <InputSelect
                        key={`filter-mode-select-${index}`}
                        label="Modo"
                        placeholder=""
                        id={`filter-mode-${index}`}
                        defaultValue={filter.mode}
                        onChange={(opts) => {
                          if (opts.length > 0) updateFilter(index, "mode", opts[0].value as string);
                        }}
                      >
                        <DropdownSection name="mode">
                          <DropdownOption value="include" selected={filter.mode === "include"}>
                            Incluir
                          </DropdownOption>
                          <DropdownOption value="exclude" selected={filter.mode === "exclude"}>
                            Excluir
                          </DropdownOption>
                        </DropdownSection>
                      </InputSelect>
                      <InputSelect
                        key={`filter-type-select-${index}-${selectedBackend}`}
                        label="Chave do filtro"
                        placeholder="Selecione uma chave"
                        id={`filter-type-${index}`}
                        defaultValue={filter.type}
                        onChange={(opts) => {
                          if (opts.length > 0) updateFilter(index, "type", opts[0].value as string);
                        }}
                      >
                        <DropdownSection name="type">
                          {activeBackendFilters.map((f) => (
                            <DropdownOption key={f.key} value={f.key} selected={filter.type === f.key}>
                              {localizeFilterLabel(f.label)}
                            </DropdownOption>
                          ))}
                        </DropdownSection>
                      </InputSelect>
                    </div>
                    <div className="flex items-center gap-8 mt-8">
                      <div className="flex-1">
                        <InputText
                          key={`filter-value-${index}`}
                          label=""
                          hideLabel
                          placeholder=""
                          id={`filter-value-${index}`}
                          defaultValue={filter.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateFilter(index, "value", e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="danger"
                        hasIcon
                        iconOnly
                        leadingIcon="agora-line-trash"
                        leadingIconHover="agora-solid-trash"
                        onClick={() => removeFilter(index)}
                        aria-label="Excluir filtro"
                      >
                        {" "}
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  leadingIcon="agora-line-plus-circle"
                  leadingIconHover="agora-solid-plus-circle"
                  onClick={addFilter}
                >
                  Adicionar um filtro
                </Button>
              </div>
            )}

            <div className="flex gap-48">
              <Switch label="Ativado" checked={isEnabled} onChange={() => setIsEnabled((v) => !v)} />
              <Switch
                label="Arquivamento automático"
                checked={isAutoArchive}
                onChange={() => setIsAutoArchive((v) => !v)}
              />
            </div>
          </div>

          <h2 className="admin-page__section-title">Avançado</h2>

          <div className="admin-page__fields-group">
            <IsolatedInput
              label="Planeamento"
              placeholder="Máscara: * * * * * (exemplo: 0 12 * * *)"
              id="harvester-schedule"
              defaultValue={loadedSchedule}
              maxLength={SCHEDULE_MAX_LENGTH}
              onChange={handleScheduleChange}
              hasError={!!scheduleError}
              hasFeedback={!!scheduleError}
              feedbackState="danger"
              errorFeedbackText={scheduleError ?? undefined}
            />
          </div>

          {saveSuccess && (
            <p className="text-sm text-green-600 text-right">Guardado com sucesso.</p>
          )}
          {saveError && <p className="text-sm text-red-600 text-right">{saveError}</p>}

          <div className="admin-page__actions flex justify-end gap-16">
            <Button
              appearance="outline"
              variant="primary"
              type="button"
              disabled={isPreviewing || !!scheduleError}
              onClick={onPreview}
            >
              {isPreviewing ? "A pré-visualizar..." : "Pré-visualizar"}
            </Button>
            <Button
              variant="primary"
              type="submit"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              disabled={isSaving || !!scheduleError}
            >
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>

          <HarvesterPreviewPanel
            isPreviewing={isPreviewing}
            previewJob={previewJob}
            previewError={previewError}
          />
        </form>

        {/* Danger zone */}
        <div className="dataset-edit-danger-actions">
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
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  Eliminar o harvester
                </Button>
              </>
            }
          />
        </div>
      </div>

      {/* Auxiliar sidebar */}
      <aside className="admin-page__auxiliar">
        <div className="admin-page__auxiliar-inner">
          <div className="admin-page__auxiliar-header">
            <AppIcon name="agora-line-question-mark" className="w-24 h-24" />
            <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
          </div>
          <AuxiliarList items={auxiliarItems} />
        </div>
      </aside>
    </div>
  );
}
