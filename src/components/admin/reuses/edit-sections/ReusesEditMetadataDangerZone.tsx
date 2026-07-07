import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

interface ReusesEditMetadataDangerZoneProps {
  archived: boolean;
  isSubmitting: boolean;
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
  const { t } = useTranslation("admin-reuses");

  return (
    <AdminDangerActions
      primaryHeading={
        !canEdit
          ? undefined
          : archived
            ? t("edit.archiveInfoArchived")
            : t("edit.archiveInfoActive")
      }
      primaryActionLabel={
        canEdit
          ? archived
            ? t("edit.unarchiveAction")
            : t("edit.archiveAction")
          : undefined
      }
      onPrimaryAction={
        canEdit ? () => (archived ? onUnarchiveReuse() : onArchiveReuse()) : undefined
      }
      dangerActionLabel={canDelete ? t("edit.deleteAction") : undefined}
      onDangerAction={canDelete ? () => onOpenDeletePopup() : undefined}
      disabled={isSubmitting}
    />
  );
}
