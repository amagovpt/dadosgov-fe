import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ReusesEditMetadataDangerZoneProps {
  archived: boolean;
  isSubmitting: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  archiveCard?: AdminCard;
  unarchiveCard?: AdminCard;
  deleteCard?: AdminCard;
  onArchiveReuse: () => void | Promise<void>;
  onUnarchiveReuse: () => void | Promise<void>;
  onOpenDeletePopup: () => void;
}

export default function ReusesEditMetadataDangerZone({
  archived,
  isSubmitting,
  canEdit = true,
  canDelete = true,
  archiveCard,
  unarchiveCard,
  deleteCard,
  onArchiveReuse,
  onUnarchiveReuse,
  onOpenDeletePopup,
}: ReusesEditMetadataDangerZoneProps) {
  const primaryCard = archived ? unarchiveCard : archiveCard;

  return (
    <AdminDangerActions
      primaryHeading={canEdit ? primaryCard?.title : undefined}
      primaryDescription={
        canEdit ? formatHtmlParagraphs(primaryCard?.description) : undefined
      }
      primaryActionLabel={canEdit ? primaryCard?.anchor?.children : undefined}
      onPrimaryAction={
        canEdit && primaryCard
          ? () => (archived ? onUnarchiveReuse() : onArchiveReuse())
          : undefined
      }
      dangerHeading={canDelete ? (deleteCard?.title ?? "") : undefined}
      dangerDescription={canDelete ? formatHtmlParagraphs(deleteCard?.description) : undefined}
      dangerActionLabel={canDelete ? deleteCard?.anchor?.children : undefined}
      onDangerAction={canDelete ? () => onOpenDeletePopup() : undefined}
      disabled={isSubmitting}
    />
  );
}
