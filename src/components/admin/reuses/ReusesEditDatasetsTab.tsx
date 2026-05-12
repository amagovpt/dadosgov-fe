import React from "react";
import Link from "next/link";
import {
  Button,
  CardLinks,
  DropdownOption,
  DropdownSection,
  Icon,
  InputSelect,
  InputText,
  StatusCard,
  Tag,
} from "@ama-pt/agora-design-system";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import type { Dataset } from "@/types/api";

type DatasetLink = { url: string };

type ReusesEditDatasetsTabProps = {
  associatedDatasets: Dataset[];
  selectedDatasets: Dataset[];
  datasetSearchResults: Dataset[];
  myDatasets: Dataset[];
  datasetLinks: DatasetLink[];
  datasetLinkErrors: Record<number, string>;
  isSubmitting: boolean;
  onDatasetSearchChange: (value: string) => void;
  onDatasetSelectChange: (selectedIds: string[]) => void;
  onRemoveSelectedDataset: (datasetId: string) => void;
  onDatasetLinkChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
  onSave: () => void | Promise<void>;
};

export default function ReusesEditDatasetsTab({
  associatedDatasets,
  selectedDatasets,
  datasetSearchResults,
  myDatasets,
  datasetLinks,
  datasetLinkErrors,
  isSubmitting,
  onDatasetSearchChange,
  onDatasetSelectChange,
  onRemoveSelectedDataset,
  onDatasetLinkChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
  onSave,
}: ReusesEditDatasetsTabProps) {
  const availableDatasets = (() => {
    const combined: Dataset[] = [
      ...selectedDatasets,
      ...datasetSearchResults,
      ...myDatasets,
    ];
    const associatedIds = new Set(associatedDatasets.map((dataset) => dataset.id));
    const seen = new Set<string>();
    return combined.filter((dataset) => {
      if (seen.has(dataset.id)) return false;
      if (associatedIds.has(dataset.id)) return false;
      seen.add(dataset.id);
      return true;
    });
  })();

  return (
    <div className="admin-page__body mt-24">
      <div className="admin-page__form-area">
        {associatedDatasets.length > 0 && (
          <div className="agora-card-links-datasets-px0 mb-24">
            {associatedDatasets.map((dataset) => (
              <CardLinks
                key={dataset.id}
                onClick={() => {}}
                className="cursor-pointer text-neutral-900"
                variant="transparent"
                image={{
                  src:
                    dataset.organization?.logo ||
                    "/images/placeholders/organization.png",
                  alt: dataset.organization?.name || "OrganizaÃ§Ã£o sem logo",
                }}
                category={dataset.organization?.name}
                title={dataset.title}
                description={
                  <div className="flex flex-col gap-12">
                    <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                      {dataset.description}
                    </p>
                    <div className="flex flex-wrap gap-8 items-center mt-8">
                      <span className="text-sm font-medium text-neutral-900">
                        Metadados:{" "}
                        {dataset.quality?.score != null
                          ? Math.round(dataset.quality.score * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-32 text-xs mt-32 text-[#034AD8] mb-32">
                      <div className="flex items-center gap-8" title="VisualizaÃ§Ãµes">
                        <Icon name="agora-line-eye" aria-hidden="true" />
                        <span>
                          {dataset.metrics?.views
                            ? dataset.metrics.views >= 1000
                              ? (dataset.metrics.views / 1000).toFixed(0) + " mil"
                              : dataset.metrics.views
                            : "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-8" title="Downloads">
                        <Icon name="agora-line-download" aria-hidden="true" />
                        <span>
                          {dataset.metrics?.resources_downloads
                            ? dataset.metrics.resources_downloads >= 1000
                              ? (dataset.metrics.resources_downloads / 1000).toFixed(0) + " mil"
                              : dataset.metrics.resources_downloads
                            : "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-8" title="ReutilizaÃ§Ãµes">
                        <img src="/Icons/bar_chart_primary.svg" alt="" aria-hidden="true" />
                        <span>{dataset.metrics?.reuses || 0}</span>
                      </div>
                      <div className="flex items-center gap-8" title="Favoritos">
                        <img src="/Icons/favorite.svg" alt="" aria-hidden="true" />
                        <span>{dataset.metrics?.followers || 0}</span>
                      </div>
                    </div>
                  </div>
                }
                date={
                  <span className="font-[300]">
                    {`Atualizado hÃ¡ ${formatDistanceToNow(new Date(dataset.last_modified), { locale: pt }).replace("aproximadamente ", "").replace("quase ", "").replace("menos de ", "").replace("cerca de ", "")}`}
                  </span>
                }
                mainLink={
                  <Link href={`/pages/datasets/${dataset.slug}`}>
                    <span className="underline">{dataset.title}</span>
                  </Link>
                }
                blockedLink={true}
              />
            ))}
          </div>
        )}

        <form className="admin-page__form" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-24">
            <StatusCard
              variant="warning"
              showIcon
              description="Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas nÃ£o as duas opÃ§Ãµes na mesma reutilizaÃ§Ã£o."
            />
          </div>

          <InputSelect
            label="Pesquisar um conjunto de dados"
            placeholder="Selecione conjuntos de dados..."
            id="edit-dataset-search"
            type="checkbox"
            searchable
            searchInputPlaceholder="Escreva para pesquisar em todos os conjuntos de dados..."
            searchNoResultsText="Nenhum resultado encontrado"
            onSearchInputChange={onDatasetSearchChange}
            onChange={(options) => {
              const selectedIds = options.map((option) => String(option.value));
              onDatasetSelectChange(selectedIds);
            }}
          >
            <DropdownSection name="datasets">
              {availableDatasets.map((dataset) => (
                <DropdownOption
                  key={dataset.id}
                  value={dataset.id}
                  selected={selectedDatasets.some((selected) => selected.id === dataset.id)}
                >
                  {dataset.title}
                </DropdownOption>
              ))}
            </DropdownSection>
          </InputSelect>

          {selectedDatasets.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-16">
              {selectedDatasets.map((dataset) => (
                <Tag
                  key={dataset.id}
                  aria-label={`Remover ${dataset.title}`}
                  onClick={() => onRemoveSelectedDataset(dataset.id)}
                >
                  {dataset.title}
                </Tag>
              ))}
            </div>
          )}

          <div className="admin-page__divider-or">
            <span className="admin-page__divider-or-text">ou</span>
          </div>

          {datasetLinks.map((link, index) => (
            <div key={`dataset-${index}`}>
              <InputText
                label="Link para o conjunto de dados"
                placeholder="Insira o URL aqui"
                id={`edit-dataset-url-${index}`}
                value={link.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onDatasetLinkChange(index, e.target.value)
                }
                hasError={!!datasetLinkErrors[index]}
                hasFeedback={!!datasetLinkErrors[index]}
                feedbackState="danger"
                errorFeedbackText={datasetLinkErrors[index]}
              />
              {link.url.trim() && (
                <div className="flex justify-end mt-24">
                  <Button
                    appearance="solid"
                    variant="danger"
                    hasIcon
                    leadingIcon="agora-line-trash"
                    leadingIconHover="agora-solid-trash"
                    onClick={() => onRemoveDatasetLink(index)}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              onClick={onAddDatasetLink}
            >
              Adicionar
            </Button>
          </div>

          <div className="admin-page__actions flex justify-end gap-[18px]">
            <Button
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={onSave}
              disabled={
                isSubmitting ||
                (selectedDatasets.length === 0 &&
                  !datasetLinks.some((link) => link.url.trim()))
              }
            >
              {isSubmitting ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
