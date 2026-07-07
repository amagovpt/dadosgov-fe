import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

type DatasetsEditDangerZoneProps = {
  datasetArchived: boolean;
  isSubmitting: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onToggleArchive: (event: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function DatasetsEditDangerZone({
  datasetArchived,
  isSubmitting,
  canEdit = true,
  canDelete = true,
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditDangerZoneProps) {
  const { t } = useTranslation("admin-datasets");

  return (
    <AdminDangerActions
      primaryHeading={canEdit ? t("edit.archiveInfo") : undefined}
      primaryActionLabel={
        canEdit
          ? datasetArchived
            ? t("edit.unarchiveAction")
            : t("edit.archiveAction")
          : undefined
      }
      onPrimaryAction={canEdit ? onToggleArchive : undefined}
      dangerActionLabel={canDelete ? t("edit.deleteAction") : undefined}
      onDangerAction={canDelete ? onOpenDeletePopup : undefined}
      disabled={isSubmitting}
    />
  );
}
