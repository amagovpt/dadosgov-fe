"use client";

import React, { useMemo } from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
  InputText,
  StatusCard,
  Switch,
} from "@ama-pt/agora-design-system";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import HarvesterDescriptionSection from "@/components/admin/harvesters/HarvesterDescriptionSection";
import IsolatedInput from "@/components/admin/IsolatedInput";
import HarvesterPreviewResult from "@/components/admin/harvesters/HarvesterPreviewResult";
import type { HarvestBackend, HarvestPreviewJob } from "@/service/types/harvester";

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
  formErrors: Partial<Record<string, boolean>>;
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

  const activeFilterKeys = useMemo(
    () => new Set(activeBackendFilters.map((f) => f.key)),
    [activeBackendFilters],
  );

  // Filters stored on the harvester whose key is not declared by the selected
  // backend (e.g. left over after switching backend type). They are surfaced
  // with a warning so the user can remove them, instead of being hidden and
  // silently dropped on save. Keep the original index for removeFilter.
  const orphanFilters = useMemo(
    () =>
      filters
        .map((f, index) => ({ ...f, index }))
        .filter((f) => f.type && !activeFilterKeys.has(f.type)),
    [filters, activeFilterKeys],
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
          <p className="pt-32 text-base leading-7 text-neutral-900">
            Os campos marcados com um asterisco ( <span className="text-red-600">*</span> ) são
            obrigatórios.
          </p>

          <HarvesterDescriptionSection
            harvesterName={harvesterName}
            harvesterDescription={harvesterDescription}
            harvesterUrl={harvesterUrl}
            hasHarvesterNameError={!!formErrors.harvesterName}
            hasHarvesterUrlError={!!formErrors.harvesterUrl}
            namePlaceholder=""
            descriptionLabel="Descrição *"
            descriptionPlaceholder=""
            urlPlaceholder=""
            onHarvesterNameChange={(e) => {
              setHarvesterName(e.target.value);
              if (e.target.value.trim()) clearError("harvesterName");
            }}
            onHarvesterDescriptionChange={(e) => setHarvesterDescription(e.target.value)}
            onHarvesterUrlChange={(e) => {
              setHarvesterUrl(e.target.value);
              if (e.target.value.trim()) clearError("harvesterUrl");
            }}
          />

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

            {(activeBackendFilters.length > 0 || orphanFilters.length > 0) && (
              <div>
                <p className="text-base font-medium leading-7 text-primary-900">Filtros</p>

                {activeBackendFilters.length > 0 &&
                  filters.map((filter, index) => {
                    // Orphan filters are shown separately in the warning below.
                    if (filter.type && !activeFilterKeys.has(filter.type)) return null;
                    return (
                      <div
                        key={index}
                        className={`mb-8 mt-8 pb-16 ${index < filters.length - 1 ? "border-b border-neutral-200" : ""}`}
                      >
                        <div className="flex items-center gap-8">
                          <InputSelect
                            key={`filter-mode-select-${index}`}
                            label="Modo"
                            placeholder=""
                            id={`filter-mode-${index}`}
                            defaultValue={filter.mode}
                            onChange={(opts) => {
                              if (opts.length > 0)
                                updateFilter(index, "mode", opts[0].value as string);
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
                              if (opts.length > 0)
                                updateFilter(index, "type", opts[0].value as string);
                            }}
                          >
                            <DropdownSection name="type">
                              {activeBackendFilters.map((f) => (
                                <DropdownOption
                                  key={f.key}
                                  value={f.key}
                                  selected={filter.type === f.key}
                                >
                                  {localizeFilterLabel(f.label)}
                                </DropdownOption>
                              ))}
                            </DropdownSection>
                          </InputSelect>
                        </div>
                        <div className="mt-8 flex items-center gap-8">
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
                            type="button"
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
                    );
                  })}

                {activeBackendFilters.length > 0 && (
                  <Button
                    type="button"
                    appearance="link"
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-plus-circle"
                    leadingIconHover="agora-solid-plus-circle"
                    onClick={addFilter}
                  >
                    Adicionar um filtro
                  </Button>
                )}

                {orphanFilters.length > 0 && (
                  <div className="mt-16">
                    <StatusCard
                      variant="warning"
                      showIcon
                      description="Os filtros abaixo não são suportados pela implementação selecionada e não serão guardados. Remova-os ou escolha uma implementação compatível."
                    />
                    {orphanFilters.map((filter) => (
                      <div
                        key={`orphan-${filter.index}`}
                        className="rounded mt-8 flex items-center justify-between gap-8 bg-neutral-50 px-12 py-8"
                      >
                        <span className="text-sm text-neutral-800">
                          <strong>{filter.type}</strong>
                          {filter.value ? `: ${filter.value}` : ""}
                          {filter.mode === "exclude" ? " (excluir)" : " (incluir)"}
                        </span>
                        <Button
                          type="button"
                          variant="danger"
                          hasIcon
                          iconOnly
                          leadingIcon="agora-line-trash"
                          leadingIconHover="agora-solid-trash"
                          onClick={() => removeFilter(filter.index)}
                          aria-label="Remover filtro não suportado"
                        >
                          {" "}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-48">
              <Switch
                label="Ativado"
                checked={isEnabled}
                onChange={() => setIsEnabled((v) => !v)}
              />
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

          {isPreviewing || previewJob || previewError ? (
            <HarvesterPreviewResult
              isPreviewing={isPreviewing}
              previewJob={previewJob}
              previewError={previewError}
              title="Resultado da pré-visualização"
              className="mt-24 flex flex-col gap-12"
            />
          ) : null}
        </form>

        <AdminDangerActions
          dangerActionLabel="Eliminar o harvester"
          onDangerAction={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        />
      </div>

      {/* Auxiliar sidebar */}
      <AdminAuxiliarySidebar items={auxiliarItems} />
    </div>
  );
}
