"use client";

import type { ChangeEvent, ReactElement } from "react";
import {
  Button,
  type DropdownSectionProps,
  InputSelect,
  InputText,
  InputTextArea,
  StatusCard,
  Tag,
} from "@ama-pt/agora-design-system";
import type { Dataset } from "@/service/types/dataset";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";

interface ReusesFormDatasetsStepProps {
  apiError: string | null;
  producerId: string;
  datasetOptions:
    | ReactElement<DropdownSectionProps>
    | ReactElement<DropdownSectionProps>[];
  selectedDatasets: Dataset[];
  datasetSearchResults: Dataset[];
  myDatasets: Dataset[];
  onDatasetSearch: (value: string) => void;
  onSelectedDatasetsChange: (datasets: Dataset[]) => void;
  onSelectedDatasetRemove: (datasetId: string) => void;
  datasetLinks: RemoteDatasetEntry[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onDatasetTitleChange: (index: number, value: string) => void;
  onDatasetDescriptionChange: (index: number, value: string) => void;
  onDatasetLinkRemove: (index: number) => void;
  onDatasetLinkAdd: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  isSubmitting: boolean;
}

export default function ReusesFormDatasetsStep({
  apiError,
  producerId,
  datasetOptions,
  selectedDatasets,
  datasetSearchResults,
  myDatasets,
  onDatasetSearch,
  onSelectedDatasetsChange,
  onSelectedDatasetRemove,
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onDatasetTitleChange,
  onDatasetDescriptionChange,
  onDatasetLinkRemove,
  onDatasetLinkAdd,
  onPreviousStep,
  onNextStep,
  isSubmitting,
}: ReusesFormDatasetsStepProps) {
  return (
    <>
      <div className="mb-24">
        <StatusCard
          variant="informative"
          showIcon
          description="É importante associar todos os conjuntos de dados, pois ajuda a compreender as referências cruzadas e a melhorar a visibilidade da sua reutilização. Escolha uma das formas de associar os conjuntos de dados: ou publicados neste portal; ou em alternativa indicar links para conjuntos de dados publicados noutros portais."
        />
      </div>
      <div className="mb-24">
        <StatusCard
          variant="warning"
          showIcon
          description="Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
        />
      </div>
      {apiError && (
        <div className="mb-16 mt-32">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}

      <form className="admin-page__form" onSubmit={(event) => event.preventDefault()}>
        <InputSelect
          key={`dataset-select-${producerId}`}
          label="Pesquisar um conjunto de dados"
          placeholder="Selecione conjuntos de dados..."
          id="reuse-dataset-search"
          type="checkbox"
          searchable
          searchInputPlaceholder="Escreva para pesquisar em todos os conjuntos de dados..."
          searchNoResultsText="Nenhum resultado encontrado"
          onSearchInputChange={onDatasetSearch}
          onChange={(options) => {
            const selectedIds = new Set(options.map((option) => option.value as string));
            const pool: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
            const seen = new Set<string>();
            const next: Dataset[] = [];

            for (const dataset of pool) {
              if (selectedIds.has(dataset.id) && !seen.has(dataset.id)) {
                seen.add(dataset.id);
                next.push(dataset);
              }
            }

            onSelectedDatasetsChange(next);
          }}
        >
          {datasetOptions}
        </InputSelect>

        {selectedDatasets.length > 0 && (
          <div className="mt-16 flex flex-wrap gap-8">
            {selectedDatasets.map((dataset) => (
              <Tag
                key={dataset.id}
                aria-label={`Remover ${dataset.title}`}
                onClick={() => onSelectedDatasetRemove(dataset.id)}
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
          <div key={`dataset-${index}`} className="mt-16 flex flex-col gap-16">
            <InputText
              label="Link para o conjunto de dados"
              placeholder="Insira o URL aqui"
              id={`reuse-dataset-url-${index}`}
              value={link.url}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDatasetUrlChange(index, event.target.value)
              }
              hasError={!!datasetLinkErrors[index]}
              hasFeedback={!!datasetLinkErrors[index]}
              feedbackState="danger"
              errorFeedbackText={datasetLinkErrors[index]}
            />
            <InputText
              label="Título (opcional)"
              placeholder="Nome do conjunto de dados externo"
              id={`reuse-dataset-title-${index}`}
              value={link.title ?? ""}
              required={false}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDatasetTitleChange(index, event.target.value)
              }
            />
            <InputTextArea
              label="Descrição (opcional)"
              placeholder="Pequena descrição do conjunto de dados"
              id={`reuse-dataset-description-${index}`}
              value={link.description ?? ""}
              required={false}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
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
                  onClick={() => onDatasetLinkRemove(index)}
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
            onClick={onDatasetLinkAdd}
          >
            Adicionar
          </Button>
        </div>

        <div className="admin-page__actions flex justify-between gap-[18px]">
          <Button
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
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            disabled={isSubmitting}
            onClick={onNextStep}
          >
            {isSubmitting ? "A associar..." : "Seguinte"}
          </Button>
        </div>
      </form>
    </>
  );
}
