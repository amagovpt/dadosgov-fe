"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import HarvesterDescriptionSection from "@/components/admin/harvesters/form-sections/HarvesterDescriptionSection";
import IsolatedInput from "@/components/admin/IsolatedInput";
import HarvesterPreviewResult from "@/components/admin/harvesters/form-ui/HarvesterPreviewResult";
import type { HarvestBackend, HarvestPreviewJob } from "@/service/types/harvester";
import type { HarvesterFormField } from "@/components/admin/harvesters/form-state/harvesterFormModel";
import type { AdminAuxiliaryItem, AdminCard } from "@/service/types/admin/common";
import { getEditHarvesterAuxiliaryItems } from "@/components/admin/harvesters/config/harvesterAuxiliaryContent";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

const FILTER_KEY_LABELS: Record<string, string> = {
  Organization: "organization",
  Tag: "tag",
  Publisher: "publisher",
  "Remote ID": "remoteId",
};

// Schedule ("Planeamento") is a cron expression with exactly 5 fields
// (minuto hora dia mês dia-da-semana), each field being a number or "*".
// Mask: "* * * * *" (e.g. "0 12 * * *"). Max 14 characters (e.g. "59 59 59 59 59").
const SCHEDULE_MAX_LENGTH = 14;
const SCHEDULE_FIELD_COUNT = 5;
const SCHEDULE_FIELD_PATTERN = /^(\d+|\*)$/;
// Returns an error message when the value is a non-empty, invalid cron
// expression. An empty value is valid (it unschedules the harvester).
function validateSchedule(value: string, errorMessage: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fields = trimmed.split(/\s+/);
  if (fields.length !== SCHEDULE_FIELD_COUNT) return errorMessage;
  if (!fields.every((field) => SCHEDULE_FIELD_PATTERN.test(field))) return errorMessage;
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
  formErrors: Partial<Record<string, boolean | string>>;
  clearError: (field: HarvesterFormField) => void;
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
  // Backend-computed authorization (single source of truth). Editing/deleting a
  // harvest source needs org-admin (HarvestSourceAdminPermission); an editor may
  // only preview. Default true for the create flow (no source yet).
  canEdit?: boolean;
  canDelete?: boolean;
  deleteCard?: AdminCard;
  auxiliaryItems?: AdminAuxiliaryItem[];
  // Whether the "advanced" fields (URL, implementation type, schedule, toggles)
  // may be edited. In the organization context an org-admin may only edit the
  // basic fields (name, description, filters), so `canEditAdvanced` is false for
  // them while `canEdit` stays true. Defaults to `canEdit` (system context: an
  // editor with edit rights may change everything).
  canEditAdvanced?: boolean;
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
  canEdit = true,
  canDelete = true,
  deleteCard,
  auxiliaryItems,
  canEditAdvanced,
}: HarvesterConfigFormProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);
  const scheduleErrorMessage = t("admin-harvesters:form.scheduleError");
  const localizeFilterLabel = (label: string) => {
    const key = FILTER_KEY_LABELS[label];
    return key ? t(`admin-harvesters:form.filterLabels.${key}`) : label;
  };

  // Basic fields (name, description, filters) follow `canEdit`; advanced fields
  // (URL, implementation type, schedule, toggles) follow `canEditAdvanced`,
  // which defaults to `canEdit` when not provided.
  const basicDisabled = !canEdit;
  const advancedDisabled = !(canEditAdvanced ?? canEdit);

  const handleScheduleChange = (value: string) => {
    setHarvesterSchedule(value);
    setScheduleError(validateSchedule(value, scheduleErrorMessage));
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

  const auxiliarItems = getEditHarvesterAuxiliaryItems({
    items: auxiliaryItems,
  });

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
            {t("admin-harvesters:form.requiredFieldsRichPrefix")}{" "}
            <span className="text-red-600">*</span>
            {" "}
            {t("admin-harvesters:form.requiredFieldsRichSuffix")}
          </p>

          <HarvesterDescriptionSection
            harvesterName={harvesterName}
            harvesterDescription={harvesterDescription}
            harvesterUrl={harvesterUrl}
            hasHarvesterNameError={!!formErrors.harvesterName}
            hasHarvesterUrlError={!!formErrors.harvesterUrl}
            namePlaceholder=""
            descriptionLabel={t("admin-harvesters:fields.descriptionRequired")}
            descriptionPlaceholder=""
            urlPlaceholder=""
            nameDisabled={basicDisabled}
            descriptionDisabled={basicDisabled}
            urlDisabled={advancedDisabled}
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

          <h2 className="admin-page__section-title">
            {t("admin-harvesters:detail.fields.implementation")}
          </h2>

          <div className="admin-page__fields-group">
            <InputSelect
              key={`harvester-type-${selectedBackend}`}
              label={t("admin-harvesters:form.typeField")}
              placeholder=""
              id="harvester-type"
              defaultValue={selectedBackend}
              disabled={advancedDisabled}
              searchable
              searchInputPlaceholder={t("admin-harvesters:form.searchInputPlaceholder")}
              searchNoResultsText={t("admin-harvesters:form.noResults")}
              onChange={(options) => {
                if (options.length > 0) setSelectedBackend(options[0].value as string);
              }}
            >
              {typeOptions}
            </InputSelect>

            {(activeBackendFilters.length > 0 || orphanFilters.length > 0) && (
              <div>
                <p className="text-base font-medium leading-7 text-primary-900">
                  {t("admin-harvesters:form.filtersTitle")}
                </p>

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
                            label={t("admin-harvesters:form.filterModeField")}
                            placeholder=""
                            id={`filter-mode-${index}`}
                            defaultValue={filter.mode}
                            disabled={basicDisabled}
                            onChange={(opts) => {
                              if (opts.length > 0)
                                updateFilter(index, "mode", opts[0].value as string);
                            }}
                          >
                            <DropdownSection name="mode">
                              <DropdownOption value="include" selected={filter.mode === "include"}>
                                {t("admin-harvesters:form.filterModeInclude")}
                              </DropdownOption>
                              <DropdownOption value="exclude" selected={filter.mode === "exclude"}>
                                {t("admin-harvesters:form.filterModeExclude")}
                              </DropdownOption>
                            </DropdownSection>
                          </InputSelect>
                          <InputSelect
                            key={`filter-type-select-${index}-${selectedBackend}`}
                            label={t("admin-harvesters:form.filterKeyField")}
                            placeholder={t("admin-harvesters:form.filterKeyPlaceholder")}
                            id={`filter-type-${index}`}
                            defaultValue={filter.type}
                            disabled={basicDisabled}
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
                              disabled={basicDisabled}
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
                          aria-label={t("admin-harvesters:form.removeFilter")}
                          disabled={basicDisabled}
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
                    disabled={basicDisabled}
                  >
                    {t("admin-harvesters:form.addFilter")}
                  </Button>
                )}

                {orphanFilters.length > 0 && (
                  <div className="mt-16">
                    <StatusCard
                      variant="warning"
                      showIcon
                      description={t("admin-harvesters:form.orphanFiltersWarning")}
                    />
                    {orphanFilters.map((filter) => (
                      <div
                        key={`orphan-${filter.index}`}
                        className="rounded mt-8 flex items-center justify-between gap-8 bg-neutral-50 px-12 py-8"
                      >
                        <span className="text-sm text-neutral-800">
                          <strong>{filter.type}</strong>
                          {filter.value ? `: ${filter.value}` : ""}
                          {filter.mode === "exclude"
                            ? t("admin-harvesters:form.filterModeExcludeInline")
                            : t("admin-harvesters:form.filterModeIncludeInline")}
                        </span>
                        <Button
                          type="button"
                          variant="danger"
                          hasIcon
                          iconOnly
                          leadingIcon="agora-line-trash"
                          leadingIconHover="agora-solid-trash"
                          onClick={() => removeFilter(filter.index)}
                          aria-label={t("admin-harvesters:form.removeUnsupportedFilter")}
                          disabled={basicDisabled}
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
                label={t("admin-harvesters:form.enabled")}
                checked={isEnabled}
                onChange={() => setIsEnabled((v) => !v)}
                disabled={advancedDisabled}
              />
              <Switch
                label={t("admin-harvesters:form.autoArchive")}
                checked={isAutoArchive}
                onChange={() => setIsAutoArchive((v) => !v)}
                disabled={advancedDisabled}
              />
            </div>
          </div>

          <h2 className="admin-page__section-title">
            {t("admin-harvesters:form.advancedTitle")}
          </h2>

          <div className="admin-page__fields-group">
            <IsolatedInput
              label={t("admin-harvesters:detail.fields.schedule")}
              placeholder={t("admin-harvesters:form.schedulePlaceholder")}
              id="harvester-schedule"
              defaultValue={loadedSchedule}
              maxLength={SCHEDULE_MAX_LENGTH}
              disabled={advancedDisabled}
              onChange={handleScheduleChange}
              hasError={!!scheduleError}
              hasFeedback={!!scheduleError}
              feedbackState="danger"
              errorFeedbackText={scheduleError ?? undefined}
            />
          </div>

          {saveSuccess && (
            <p className="text-sm text-green-600 text-right">
              {t("admin-harvesters:form.saveSuccess")}
            </p>
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
              {isPreviewing
                ? t("admin-harvesters:actions.previewing")
                : t("admin-harvesters:actions.preview")}
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                type="submit"
                hasIcon
                trailingIcon="agora-line-check-circle"
                trailingIconHover="agora-solid-check-circle"
                disabled={isSaving || !!scheduleError}
              >
                {isSaving
                  ? t("admin-harvesters:actions.saving")
                  : t("admin-harvesters:actions.save")}
              </Button>
            )}
          </div>

          {isPreviewing || previewJob || previewError ? (
            <HarvesterPreviewResult
              isPreviewing={isPreviewing}
              previewJob={previewJob}
              previewError={previewError}
              title={t("admin-harvesters:form.previewResultTitle")}
              className="mt-24 flex flex-col gap-12"
            />
          ) : null}
        </form>

        <AdminDangerActions
          actions={[
            {
              variant: "danger",
              heading: canDelete ? (deleteCard?.title ?? "") : undefined,
              description: canDelete ? formatHtmlParagraphs(deleteCard?.description) : undefined,
              actionLabel: canDelete ? deleteCard?.anchor?.children : undefined,
              onAction: canDelete && deleteCard
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }
                : undefined,
            },
          ]}
        />
      </div>

      {/* Auxiliar sidebar */}
      {auxiliarItems.length > 0 ? <AdminAuxiliarySidebar items={auxiliarItems} /> : null}
    </div>
  );
}
