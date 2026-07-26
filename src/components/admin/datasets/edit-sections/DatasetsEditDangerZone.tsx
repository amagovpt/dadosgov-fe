import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

type DatasetsEditDangerZoneProps = {
  datasetArchived: boolean;
  isSubmitting: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  archiveCard?: AdminCard;
  unarchiveCard?: AdminCard;
  deleteCard?: AdminCard;
  onToggleArchive: (event: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function DatasetsEditDangerZone({
  datasetArchived,
  isSubmitting,
  canEdit = true,
  canDelete = true,
  archiveCard,
  unarchiveCard,
  deleteCard,
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditDangerZoneProps) {
  const primaryCard = datasetArchived ? unarchiveCard : archiveCard;

  return (
    <AdminDangerActions
      primaryHeading={canEdit ? primaryCard?.title : undefined}
      primaryDescription={
        canEdit ? formatHtmlParagraphs(primaryCard?.description) : undefined
      }
      primaryActionLabel={canEdit ? primaryCard?.anchor?.children : undefined}
      onPrimaryAction={canEdit && primaryCard ? onToggleArchive : undefined}
      dangerHeading={canDelete ? (deleteCard?.title ?? "") : undefined}
      dangerDescription={canDelete ? formatHtmlParagraphs(deleteCard?.description) : undefined}
      dangerActionLabel={canDelete ? deleteCard?.anchor?.children : undefined}
      onDangerAction={canDelete ? onOpenDeletePopup : undefined}
      disabled={isSubmitting}
    />
  );
}
