import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

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
    <AdminDangerActions
      primaryHeading={
        archived
          ? "Esta reutilização está arquivada. Pode desarquivar para voltar a indexá-la no portal."
          : "Uma reutilização arquivada deixa de estar indexada no portal, mas permanece acessível através de um link direto."
      }
      primaryActionLabel={archived ? "Desarquivar a reutilização" : "Arquivar a reutilização"}
      onPrimaryAction={() => (archived ? onUnarchiveReuse() : onArchiveReuse())}
      dangerActionLabel="Eliminar a reutilização"
      onDangerAction={() => onOpenDeletePopup()}
      disabled={isSubmitting}
    />
  );
}
