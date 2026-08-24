"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  StatusCard,
  Switch,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import {
  localizeExtraConfigLabel,
  localizeFeatureLabel,
  localizeFilterLabel,
} from "@/components/admin/harvesters/form-state/harvesterBackendConfig";
import type { HarvestBackend } from "@/service/types/harvester";

interface HarvesterFilter {
  mode: string;
  type: string;
  value: string;
}

interface HarvesterImplementationSectionProps {
  /** The enabled harvest backends, as returned by the API. */
  backends: HarvestBackend[];
  /**
   * The filters the selected backend declares. Both the visibility of the
   * filters block and the keys its select offers come from here: a hardcoded
   * list drifts from what the backend accepts, and `HarvestConfigField`
   * rejects any key the backend does not declare.
   */
  activeBackendFilters: HarvestBackend["filters"];
  /**
   * The features and extra configs the selected backend declares. Like the
   * filters, both the fields shown and the keys they submit come from here: the
   * GeoDCAT-AP switch used to be gated on `selectedType === "csw-dcat"`, which
   * is why the `inspire` feature of the OpenDataSoft PT backend could not be
   * set through the UI at all.
   */
  activeBackendFeatures: HarvestBackend["features"];
  activeBackendExtraConfigs: HarvestBackend["extra_configs"];
  featureValues: Record<string, boolean>;
  extraConfigValues: Record<string, string>;
  /** The extra configs whose input is revealed, by key. */
  visibleExtraConfigKeys: string[];
  /** Distinguishes "still loading" from "nothing matches the search". */
  typeNoResultsText: string;
  /** The backends endpoint answered with nothing to offer. */
  hasNoBackend: boolean;
  hasTypeError: boolean;
  selectedTypeRef: React.RefObject<string>;
  selectedType: string;
  filters: HarvesterFilter[];
  isEnabled: boolean;
  isAutoArchive: boolean;
  onTypeChange: (value: string) => void;
  onAddFilter: () => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (index: number, field: string, value: string) => void;
  onToggleFeature: (key: string) => void;
  onShowExtraConfig: (key: string) => void;
  onExtraConfigChange: (key: string, value: string) => void;
  onClearExtraConfig: (key: string) => void;
  onToggleEnabled: () => void;
  onToggleAutoArchive: () => void;
}

export default function HarvesterImplementationSection({
  backends,
  activeBackendFilters,
  activeBackendFeatures,
  activeBackendExtraConfigs,
  featureValues,
  extraConfigValues,
  visibleExtraConfigKeys,
  typeNoResultsText,
  hasNoBackend,
  hasTypeError,
  selectedTypeRef,
  selectedType,
  filters,
  isEnabled,
  isAutoArchive,
  onTypeChange,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onToggleFeature,
  onShowExtraConfig,
  onExtraConfigChange,
  onClearExtraConfig,
  onToggleEnabled,
  onToggleAutoArchive,
}: HarvesterImplementationSectionProps) {
  const { t } = useTranslation("admin-harvesters");

  return (
    <>
      <h2 className="admin-page__section-title">{t("detail.fields.implementation")}</h2>

      <div className="admin-page__fields-group">
        {hasNoBackend ? (
          <StatusCard variant="warning" showIcon description={t("form.typesUnavailable")} />
        ) : (
          <IsolatedSelect
            label={t("form.typeFieldPlain")}
            placeholder={t("form.typePlaceholder")}
            id="harvester-type"
            searchable
            searchInputPlaceholder={t("form.searchInputPlaceholder")}
            searchNoResultsText={typeNoResultsText}
            // The wizard remounts this subtree when the user steps back from
            // the preview, and IsolatedSelect only seeds its internal value
            // from defaultValue. Without it the control falls back to the
            // placeholder while selectedTypeRef still submits the chosen type.
            defaultValue={selectedType}
            hasError={hasTypeError}
            errorFeedbackText={t("form.validationErrors.type")}
            onChangeRef={selectedTypeRef}
            onChangeCallback={onTypeChange}
          >
            <DropdownSection name="types">
              {backends.map((backend) => (
                <DropdownOption key={backend.id} value={backend.id}>
                  {backend.label}
                </DropdownOption>
              ))}
            </DropdownSection>
          </IsolatedSelect>
        )}

        {activeBackendFilters.length > 0 && (
          <div>
            <p className="text-base font-medium leading-7 text-primary-900">
              {t("form.filtersTitle")}
            </p>

            {filters.map((filter, index) => (
              <div
                key={index}
                className={`mb-8 mt-8 pb-16 ${index < filters.length - 1 ? "border-b border-neutral-200" : ""}`}
              >
                <div className="flex items-center gap-8">
                  <IsolatedSelect
                    label=""
                    hideLabel
                    placeholder={t("form.filterModeInclude")}
                    id={`filter-mode-${index}`}
                    // Without it the control falls back to the placeholder when
                    // the wizard remounts this subtree on a step back, while the
                    // filter it submits still carries the value held in state.
                    defaultValue={filter.mode}
                    onChangeCallback={(value) => onUpdateFilter(index, "mode", value)}
                  >
                    <DropdownSection name={`filter-mode-${index}`}>
                      <DropdownOption value="include">
                        {t("form.filterModeInclude")}
                      </DropdownOption>
                      <DropdownOption value="exclude">
                        {t("form.filterModeExclude")}
                      </DropdownOption>
                    </DropdownSection>
                  </IsolatedSelect>
                  <IsolatedSelect
                    label=""
                    hideLabel
                    placeholder={t("form.filterKeyPlaceholder")}
                    id={`filter-type-${index}`}
                    defaultValue={filter.type}
                    onChangeCallback={(value) => onUpdateFilter(index, "type", value)}
                  >
                    <DropdownSection name={`filter-type-${index}`}>
                      {activeBackendFilters.map((backendFilter) => (
                        <DropdownOption key={backendFilter.key} value={backendFilter.key}>
                          {localizeFilterLabel(backendFilter, (subkey) =>
                            t(`form.filterLabels.${subkey}`),
                          )}
                        </DropdownOption>
                      ))}
                    </DropdownSection>
                  </IsolatedSelect>
                </div>
                <div className="mt-8 flex items-center gap-8">
                  <div className="flex-1">
                    <InputText
                      label=""
                      hideLabel
                      placeholder=""
                      id={`filter-value-${index}`}
                      value={filter.value}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        onUpdateFilter(index, "value", event.target.value)
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
                    onClick={() => onRemoveFilter(index)}
                    aria-label={t("form.removeFilter")}
                  >
                    {" "}
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              appearance="link"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              onClick={onAddFilter}
            >
              {t("form.addFilter")}
            </Button>
          </div>
        )}

        {activeBackendFeatures.length > 0 && (
          <div className="flex flex-col gap-16">
            {activeBackendFeatures.map((feature) => (
              <Switch
                key={feature.key}
                label={localizeFeatureLabel(feature, (subkey) => t(`form.featureLabels.${subkey}`))}
                checked={featureValues[feature.key] ?? feature.default ?? false}
                onChange={() => onToggleFeature(feature.key)}
              />
            ))}
          </div>
        )}

        {activeBackendExtraConfigs.map((extraConfig) => {
          const label = localizeExtraConfigLabel(extraConfig, (subkey) =>
            t(`form.extraConfigLabels.${subkey}`),
          );

          return visibleExtraConfigKeys.includes(extraConfig.key) ? (
            <div key={extraConfig.key}>
              <p className="text-base font-medium leading-7 text-primary-900">{label}</p>
              <div className="mt-8 flex items-center gap-8">
                <div className="flex-1">
                  <InputText
                    label=""
                    hideLabel
                    placeholder=""
                    id={`extra-config-${extraConfig.key}`}
                    value={extraConfigValues[extraConfig.key] ?? ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      onExtraConfigChange(extraConfig.key, event.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  appearance="outline"
                  variant="neutral"
                  hasIcon
                  leadingIcon="agora-line-trash"
                  leadingIconHover="agora-solid-trash"
                  onClick={() => onClearExtraConfig(extraConfig.key)}
                >
                  {t("actions.delete")}
                </Button>
              </div>
            </div>
          ) : (
            <div key={extraConfig.key} className="flex justify-start">
              <Button
                type="button"
                appearance="link"
                variant="primary"
                hasIcon
                leadingIcon="agora-line-plus-circle"
                leadingIconHover="agora-solid-plus-circle"
                onClick={() => onShowExtraConfig(extraConfig.key)}
              >
                {`${t("form.configure")} ${label}`}
              </Button>
            </div>
          );
        })}

        {selectedType && (
          <div className="flex gap-48">
            <Switch label={t("form.enabled")} checked={isEnabled} onChange={onToggleEnabled} />
            <Switch
              label={t("form.autoArchiveShort")}
              checked={isAutoArchive}
              onChange={onToggleAutoArchive}
            />
          </div>
        )}
      </div>
    </>
  );
}
