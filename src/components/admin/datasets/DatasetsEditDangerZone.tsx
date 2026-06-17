import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

type DatasetsEditDangerZoneProps = {
  datasetArchived: boolean;
  isSubmitting: boolean;
  onToggleArchive: (event: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function DatasetsEditDangerZone({
  datasetArchived,
  isSubmitting,
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditDangerZoneProps) {
  return (
    <div className="dataset-edit-danger-actions">
      <StatusCard
        variant="warning"
        showIcon
        description={
          <>
            <strong>
              Um conjunto de dados arquivado deixa de estar indexado no portal, mas permanece
              acessível através de um link direto.
            </strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onToggleArchive}
            >
              {datasetArchived
                ? "Desarquivar o conjunto de dados"
                : "Arquivar o conjunto de dados"}
            </Button>
          </>
        }
      />
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>Atenção esta ação é irreversível.</strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onOpenDeletePopup}
              disabled={isSubmitting}
            >
              Eliminar o conjunto de dados
            </Button>
          </>
        }
      />
    </div>
  );
}
