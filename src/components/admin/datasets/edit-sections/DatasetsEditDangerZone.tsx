import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

type DatasetsEditDangerZoneProps = {
  datasetArchived: boolean;
  isSubmitting: boolean;
  // Backend-computed authorization. Archiving is an edit; deleting needs delete.
  canEdit?: boolean;
  canDelete?: boolean;
  onOpenTransferPopup: (event: React.MouseEvent) => void;
  onToggleArchive: (event: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function DatasetsEditDangerZone({
  datasetArchived,
  isSubmitting,
  canEdit = true,
  canDelete = true,
  onOpenTransferPopup,
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditDangerZoneProps) {
  return (
    <AdminDangerActions
      leadingHeading={canEdit ? "Atenção esta ação é irreversível." : undefined}
      leadingActionLabel={canEdit ? "Transferir o conjunto de dados" : undefined}
      onLeadingAction={canEdit ? onOpenTransferPopup : undefined}
      primaryHeading={
        canEdit
          ? "Um conjunto de dados arquivado deixa de estar indexado no portal, mas permanece acessível através de um link direto."
          : undefined
      }
      primaryActionLabel={
        canEdit
          ? datasetArchived
            ? "Desarquivar o conjunto de dados"
            : "Arquivar o conjunto de dados"
          : undefined
      }
      onPrimaryAction={canEdit ? onToggleArchive : undefined}
      dangerActionLabel={canDelete ? "Eliminar o conjunto de dados" : undefined}
      onDangerAction={canDelete ? onOpenDeletePopup : undefined}
      disabled={isSubmitting}
    />
  );
}
