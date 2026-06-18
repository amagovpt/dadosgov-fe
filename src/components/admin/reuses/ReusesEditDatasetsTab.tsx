import React from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
  InputText,
  InputTextArea,
  StatusCard,
  Tag,
} from "@ama-pt/agora-design-system";
import ReusesEditAssociatedDatasetsSection from "@/components/admin/reuses/ReusesEditAssociatedDatasetsSection";
import ReusesEditDatasetsActions from "@/components/admin/reuses/ReusesEditDatasetsActions";
import type { Dataset } from "@/service/types/dataset";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";

type ReusesEditDatasetsTabProps = {
  associatedDatasets: Dataset[];
  selectedDatasets: Dataset[];
  datasetSearchResults: Dataset[];
  myDatasets: Dataset[];
  datasetLinks: RemoteDatasetEntry[];
  datasetLinkErrors: Record<number, string>;
  isSubmitting: boolean;
  onDatasetSearchChange: (value: string) => void;
  onDatasetSelectChange: (selectedIds: string[]) => void;
  onRemoveSelectedDataset: (datasetId: string) => void;
  onRemoveAssociatedDataset: (datasetId: string) => void;
  onRemoveAllAssociatedDatasets: () => void;
  onDatasetLinkChange: (index: number, value: string) => void;
  // LEDG-1748 PR 2: per-URL metadata inputs.
  onDatasetTitleChange: (index: number, value: string) => void;
  onDatasetDescriptionChange: (index: number, value: string) => void;
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
  onRemoveAssociatedDataset,
  onRemoveAllAssociatedDatasets,
  onDatasetLinkChange,
  onDatasetTitleChange,
  onDatasetDescriptionChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
  onSave,
}: ReusesEditDatasetsTabProps) {
  const availableDatasets = (() => {
    const combined: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
    const associatedIds = new Set(associatedDatasets.map((dataset) => dataset.id));
    const seen = new Set<string>();
    return combined.filter((dataset) => {
      if (seen.has(dataset.id)) return false;
      if (associatedIds.has(dataset.id)) return false;
      if (dataset.archived) return false;
      if (dataset.deleted) return false;
      seen.add(dataset.id);
      return true;
    });
  })();

  return (
    <div className="mt-24 flex flex-col gap-24">
      <ReusesEditAssociatedDatasetsSection
        associatedDatasets={associatedDatasets}
        isSubmitting={isSubmitting}
        onRemoveAssociatedDataset={onRemoveAssociatedDataset}
        onRemoveAllAssociatedDatasets={onRemoveAllAssociatedDatasets}
      />

      <div className="admin-page__form-area">
        <form className="admin-page__form" onSubmit={(event) => event.preventDefault()}>
          <div className="mb-24">
            <StatusCard
              variant="warning"
              showIcon
              description="Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
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
            <div className="mt-16 flex flex-wrap gap-8">
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
            <div key={`dataset-${index}`} className="flex flex-col gap-16">
              <InputText
                label="Link para o conjunto de dados"
                placeholder="Insira o URL aqui"
                id={`edit-dataset-url-${index}`}
                value={link.url}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onDatasetLinkChange(index, event.target.value)
                }
                hasError={!!datasetLinkErrors[index]}
                hasFeedback={!!datasetLinkErrors[index]}
                feedbackState="danger"
                errorFeedbackText={datasetLinkErrors[index]}
              />
              <InputText
                label="Título (opcional)"
                placeholder="Nome do conjunto de dados externo"
                id={`edit-dataset-title-${index}`}
                value={link.title ?? ""}
                required={false}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onDatasetTitleChange(index, event.target.value)
                }
              />
              <InputTextArea
                label="Descrição (opcional)"
                placeholder="Pequena descrição do conjunto de dados"
                id={`edit-dataset-description-${index}`}
                value={link.description ?? ""}
                required={false}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onDatasetDescriptionChange(index, event.target.value)
                }
              />
              {link.url.trim() && (
                <div className="mt-8 flex justify-end">
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

          <ReusesEditDatasetsActions
            isSubmitting={isSubmitting}
            canSave={
              selectedDatasets.length > 0 || datasetLinks.some((link) => link.url.trim())
            }
            onAddDatasetLink={onAddDatasetLink}
            onSave={onSave}
          />
        </form>
      </div>
    </div>
  );
}
