import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface ReusesEditMetadataDangerZoneProps {
  archived: boolean;
  isSubmitting: boolean;
  onArchiveReuse: () => void | Promise<void>;
  onUnarchiveReuse: () => void | Promise<void>;
  onOpenDeletePopup: () => void;
}

export default function ReusesEditMetadataDangerZone({
  archived,
  isSubmitting,
  onArchiveReuse,
  onUnarchiveReuse,
  onOpenDeletePopup,
}: ReusesEditMetadataDangerZoneProps) {
  return (
    <div className="dataset-edit-danger-actions">
      <StatusCard
        variant="warning"
        showIcon
        description={
          <>
            <strong>
              {archived
                ? "Esta reutilização está arquivada. Pode desarquivar para voltar a indexá-la no portal."
                : "Uma reutilização arquivada deixa de estar indexada no portal, mas permanece acessível através de um link direto."}
            </strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={archived ? onUnarchiveReuse : onArchiveReuse}
              disabled={isSubmitting}
            >
              {archived ? "Desarquivar a reutilização" : "Arquivar a reutilização"}
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
              Eliminar a reutilização
            </Button>
          </>
        }
      />
    </div>
  );
}
