import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

interface ReusesEditMetadataDangerZoneProps {
  archived: boolean;
  isSubmitting: boolean;
  // Backend-computed authorization. Archiving is an edit; deleting needs delete.
  canEdit?: boolean;
  canDelete?: boolean;
  onArchiveReuse: () => void | Promise<void>;
  onUnarchiveReuse: () => void | Promise<void>;
  onOpenDeletePopup: () => void;
}

export default function ReusesEditMetadataDangerZone({
  archived,
  isSubmitting,
  canEdit = true,
  canDelete = true,
  onArchiveReuse,
  onUnarchiveReuse,
  onOpenDeletePopup,
}: ReusesEditMetadataDangerZoneProps) {
  return (
    <AdminDangerActions
      primaryHeading={
        !canEdit
          ? undefined
          : archived
            ? "Esta reutilização está arquivada. Pode desarquivar para voltar a indexá-la no portal."
            : "Uma reutilização arquivada deixa de estar indexada no portal, mas permanece acessível através de um link direto."
      }
      primaryActionLabel={
        canEdit ? (archived ? "Desarquivar a reutilização" : "Arquivar a reutilização") : undefined
      }
      onPrimaryAction={
        canEdit ? () => (archived ? onUnarchiveReuse() : onArchiveReuse()) : undefined
      }
      dangerActionLabel={canDelete ? "Eliminar a reutilização" : undefined}
      onDangerAction={canDelete ? () => onOpenDeletePopup() : undefined}
      disabled={isSubmitting}
    />
  );
}
