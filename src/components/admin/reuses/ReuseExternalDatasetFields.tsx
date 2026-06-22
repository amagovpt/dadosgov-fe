"use client";

import type { ChangeEvent } from "react";
import { Button, InputText, InputTextArea } from "@ama-pt/agora-design-system";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";

interface ReuseExternalDatasetFieldsProps {
  datasetLinks: RemoteDatasetEntry[];
  datasetLinkErrors: Record<number, string>;
  idPrefix: string;
  itemClassName?: string;
  onDatasetUrlChange: (index: number, value: string) => void;
  onDatasetTitleChange: (index: number, value: string) => void;
  onDatasetDescriptionChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
}

export default function ReuseExternalDatasetFields({
  datasetLinks,
  datasetLinkErrors,
  idPrefix,
  itemClassName = "flex flex-col gap-16",
  onDatasetUrlChange,
  onDatasetTitleChange,
  onDatasetDescriptionChange,
  onRemoveDatasetLink,
}: ReuseExternalDatasetFieldsProps) {
  return (
    <>
      {datasetLinks.map((link, index) => (
        <div key={`dataset-${index}`} className={itemClassName}>
          <InputText
            label="Link para o conjunto de dados"
            placeholder="Insira o URL aqui"
            id={`${idPrefix}-dataset-url-${index}`}
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
            id={`${idPrefix}-dataset-title-${index}`}
            value={link.title ?? ""}
            required={false}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onDatasetTitleChange(index, event.target.value)
            }
          />
          <InputTextArea
            label="Descrição (opcional)"
            placeholder="Pequena descrição do conjunto de dados"
            id={`${idPrefix}-dataset-description-${index}`}
            value={link.description ?? ""}
            required={false}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onDatasetDescriptionChange(index, event.target.value)
            }
          />
          {link.url.trim() && (
            <div className="mt-8 flex justify-end">
              <Button
                type="button"
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
    </>
  );
}
