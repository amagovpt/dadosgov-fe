"use client";

import React from "react";
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
  const supportsCkanFilters = selectedType === "ckan" || selectedType === "ckanpt";
  const supportsRemoteUrlPrefix =
    selectedType === "csw-dcat" || selectedType === "csw-iso-19139";

  return (
    <>
      <h2 className="admin-page__section-title">Implementação</h2>

      <div className="admin-page__fields-group">
        <IsolatedSelect
          label="Tipo"
          placeholder="Selecione um tipo..."
          id="harvester-type"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          searchNoResultsText="Nenhum resultado encontrado"
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
            <p className="text-base font-medium leading-7 text-primary-900">Filtros</p>

            {filters.map((filter, index) => (
              <div
                key={index}
                className={`mb-8 mt-8 pb-16 ${index < filters.length - 1 ? "border-b border-neutral-200" : ""}`}
              >
                <div className="flex items-center gap-8">
                  <IsolatedSelect
                    label=""
                    hideLabel
                    placeholder="Incluir"
                    id={`filter-mode-${index}`}
                    onChangeCallback={(value) => onUpdateFilter(index, "mode", value)}
                  >
                    <DropdownSection name={`filter-mode-${index}`}>
                      <DropdownOption value="include">Incluir</DropdownOption>
                      <DropdownOption value="exclude">Excluir</DropdownOption>
                    </DropdownSection>
                  </IsolatedSelect>
                  <IsolatedSelect
                    label=""
                    hideLabel
                    placeholder="Organização"
                    id={`filter-type-${index}`}
                    onChangeCallback={(value) => onUpdateFilter(index, "type", value)}
                  >
                    <DropdownSection name={`filter-type-${index}`}>
                      <DropdownOption value="organization">Organização</DropdownOption>
                      <DropdownOption value="tag">Marcação</DropdownOption>
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
                    variant="danger"
                    hasIcon
                    iconOnly
                    leadingIcon="agora-line-trash"
                    leadingIconHover="agora-solid-trash"
                    onClick={() => onRemoveFilter(index)}
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
              onClick={onAddFilter}
            >
              Adicionar um filtro
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
                  appearance="link"
                  variant="primary"
                  hasIcon
                  leadingIcon="agora-line-plus-circle"
                  leadingIconHover="agora-solid-plus-circle"
                  onClick={onShowRemoteUrlPrefix}
                >
                  Configurar prefixo de URL remoto
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-base font-medium leading-7 text-primary-900">
                  Prefixo de URL remoto
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
                    appearance="outline"
                    variant="neutral"
                    hasIcon
                    leadingIcon="agora-line-trash"
                    leadingIconHover="agora-solid-trash"
                    onClick={onClearRemoteUrlPrefix}
                  >
                    EXCLUIR
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {selectedType && (
          <div className="flex gap-48">
            <Switch label="Ativado" checked={isEnabled} onChange={onToggleEnabled} />
            <Switch
              label="Arquivo automático"
              checked={isAutoArchive}
              onChange={onToggleAutoArchive}
            />
          </div>
        )}
      </div>
    </>
  );
}
