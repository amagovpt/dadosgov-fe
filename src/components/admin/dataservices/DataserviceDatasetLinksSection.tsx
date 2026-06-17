"use client";

import React from "react";
import { Button, DropdownOption, DropdownSection, InputSelect, InputText } from "@ama-pt/agora-design-system";

interface DataserviceDatasetLink {
  url: string;
}

interface DataserviceDatasetLinksSectionProps {
  datasetLinks: DataserviceDatasetLink[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
}

export default function DataserviceDatasetLinksSection({
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
}: DataserviceDatasetLinksSectionProps) {
  return (
    <>
      <InputSelect
        label="Pesquisar um conjunto de dados"
        placeholder="Procurando um conjunto de dados..."
        id="dataset-search"
      >
        <DropdownSection name="datasets">
          <DropdownOption value="dataset1">Conjunto de dados 1</DropdownOption>
        </DropdownSection>
      </InputSelect>

      {datasetLinks.map((link, index) => (
        <div key={index} className="mt-16">
          <div>
            <InputText
              label="Link para o conjunto de dados"
              placeholder="Insira o URL aqui"
              id={`dataset-url-${index}`}
              value={link.url}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onDatasetUrlChange(index, event.target.value)
              }
              hasError={!!datasetLinkErrors[index]}
              hasFeedback={!!datasetLinkErrors[index]}
              feedbackState="danger"
              errorFeedbackText={datasetLinkErrors[index]}
            />
            {link.url.trim() && (
              <div className="mt-8 flex justify-end">
                <Button
                  appearance="link"
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
    </>
  );
}
