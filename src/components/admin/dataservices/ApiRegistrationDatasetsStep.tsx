"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import DataserviceDatasetLinksSection from "@/components/admin/dataservices/DataserviceDatasetLinksSection";

interface ApiRegistrationDatasetsStepProps {
  datasetLinks: { url: string }[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
}

export default function ApiRegistrationDatasetsStep({
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
  onPreviousStep,
  onNextStep,
}: ApiRegistrationDatasetsStepProps) {
  return (
    <>
      <StatusCard
        variant="informative"
        showIcon
        description="É importante vincular todos os conjuntos de dados utilizados, pois isso ajuda a compreender as referências cruzadas necessárias e a melhorar a visibilidade da sua reutilização."
      />

      <form className="admin-page__form">
        <DataserviceDatasetLinksSection
          datasetLinks={datasetLinks}
          datasetLinkErrors={datasetLinkErrors}
          onDatasetUrlChange={onDatasetUrlChange}
          onRemoveDatasetLink={onRemoveDatasetLink}
          onAddDatasetLink={onAddDatasetLink}
        />

        <div className="admin-page__actions">
          <Button appearance="outline" variant="neutral" onClick={onPreviousStep}>
            Anterior
          </Button>
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            onClick={onNextStep}
          >
            Seguinte
          </Button>
        </div>
      </form>
    </>
  );
}
