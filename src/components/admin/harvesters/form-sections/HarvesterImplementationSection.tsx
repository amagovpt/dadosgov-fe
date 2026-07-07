"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  Switch,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

interface HarvesterFilter {
  mode: string;
  type: string;
  value: string;
}

interface HarvesterImplementationSectionProps {
  selectedTypeRef: React.RefObject<string>;
  selectedType: string;
  filters: HarvesterFilter[];
  isGeoDcat: boolean;
  showRemoteUrlPrefix: boolean;
  remoteUrlPrefix: string;
  isEnabled: boolean;
  isAutoArchive: boolean;
  onTypeChange: (value: string) => void;
  onAddFilter: () => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (index: number, field: string, value: string) => void;
  onToggleGeoDcat: () => void;
  onShowRemoteUrlPrefix: () => void;
  onRemoteUrlPrefixChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearRemoteUrlPrefix: () => void;
  onToggleEnabled: () => void;
  onToggleAutoArchive: () => void;
}

export default function HarvesterImplementationSection({
  selectedTypeRef,
  selectedType,
  filters,
  isGeoDcat,
  showRemoteUrlPrefix,
  remoteUrlPrefix,
  isEnabled,
  isAutoArchive,
  onTypeChange,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onToggleGeoDcat,
  onShowRemoteUrlPrefix,
  onRemoteUrlPrefixChange,
  onClearRemoteUrlPrefix,
  onToggleEnabled,
  onToggleAutoArchive,
}: HarvesterImplementationSectionProps) {
  const { t } = useTranslation("admin-harvesters");
  const supportsCkanFilters = selectedType === "ckan" || selectedType === "ckanpt";
  const supportsRemoteUrlPrefix =
    selectedType === "csw-dcat" || selectedType === "csw-iso-19139";

  return (
    <>
      <h2 className="admin-page__section-title">{t("detail.fields.implementation")}</h2>

      <div className="admin-page__fields-group">
        <IsolatedSelect
          label={t("form.typeFieldPlain")}
          placeholder={t("form.typePlaceholder")}
          id="harvester-type"
          searchable
          searchInputPlaceholder={t("form.searchInputPlaceholder")}
          searchNoResultsText={t("form.noResults")}
          onChangeRef={selectedTypeRef}
          onChangeCallback={onTypeChange}
        >
          <DropdownSection name="types">
            <DropdownOption value="dcat">DCAT</DropdownOption>
            <DropdownOption value="csw-dcat">CSW-DCAT</DropdownOption>
            <DropdownOption value="csw-iso-19139">CSW-ISO-19139</DropdownOption>
            <DropdownOption value="ckan">CKAN</DropdownOption>
            <DropdownOption value="ckanpt">CKAN PT</DropdownOption>
            <DropdownOption value="dkan">DKAN</DropdownOption>
            <DropdownOption value="cswudata">CSW</DropdownOption>
            <DropdownOption value="odspt">OpenDataSoft PT</DropdownOption>
            <DropdownOption value="maaf">MAAF</DropdownOption>
            <DropdownOption value="ogc">OGC</DropdownOption>
          </DropdownSection>
        </IsolatedSelect>

        {supportsCkanFilters && (
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
                    placeholder={t("form.filterLabels.organization")}
                    id={`filter-type-${index}`}
                    onChangeCallback={(value) => onUpdateFilter(index, "type", value)}
                  >
                    <DropdownSection name={`filter-type-${index}`}>
                      <DropdownOption value="organization">
                        {t("form.filterLabels.organization")}
                      </DropdownOption>
                      <DropdownOption value="tag">{t("form.filterLabels.tag")}</DropdownOption>
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

        {selectedType === "csw-dcat" && (
          <Switch label="GeoDCAT-AP" checked={isGeoDcat} onChange={onToggleGeoDcat} />
        )}

        {supportsRemoteUrlPrefix && (
          <>
            {!showRemoteUrlPrefix ? (
              <div className="flex justify-start">
                <Button
                  type="button"
                  appearance="link"
                  variant="primary"
                  hasIcon
                  leadingIcon="agora-line-plus-circle"
                  leadingIconHover="agora-solid-plus-circle"
                  onClick={onShowRemoteUrlPrefix}
                >
                  {t("form.configureRemoteUrlPrefix")}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-base font-medium leading-7 text-primary-900">
                  {t("form.remoteUrlPrefix")}
                </p>
                <div className="mt-8 flex items-center gap-8">
                  <div className="flex-1">
                    <InputText
                      label=""
                      hideLabel
                      placeholder=""
                      id="remote-url-prefix"
                      value={remoteUrlPrefix}
                      onChange={onRemoteUrlPrefixChange}
                    />
                  </div>
                  <Button
                    type="button"
                    appearance="outline"
                    variant="neutral"
                    hasIcon
                    leadingIcon="agora-line-trash"
                    leadingIconHover="agora-solid-trash"
                    onClick={onClearRemoteUrlPrefix}
                  >
                    {t("actions.delete")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

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
