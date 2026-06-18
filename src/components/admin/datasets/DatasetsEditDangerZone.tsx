import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

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
    <AdminDangerActions
      warningDescription="Um conjunto de dados arquivado deixa de estar indexado no portal, mas permanece acessível através de um link direto."
      warningActionLabel={
        datasetArchived
          ? "Desarquivar o conjunto de dados"
          : "Arquivar o conjunto de dados"
      }
      onWarningAction={onToggleArchive}
      dangerActionLabel="Eliminar o conjunto de dados"
      onDangerAction={onOpenDeletePopup}
      disabled={isSubmitting}
    />
  );
}
