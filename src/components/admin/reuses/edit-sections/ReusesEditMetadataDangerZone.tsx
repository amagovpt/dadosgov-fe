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
  const archiveActionCard = archived ? unarchiveCard : archiveCard;

  return (
    <AdminDangerActions
      actions={[
        {
          variant: "warning",
          heading: canEdit ? archiveActionCard?.title : undefined,
          description: canEdit ? formatHtmlParagraphs(archiveActionCard?.description) : undefined,
          actionLabel: canEdit ? archiveActionCard?.anchor?.children : undefined,
          onAction:
            canEdit && archiveActionCard
              ? () => (archived ? onUnarchiveReuse() : onArchiveReuse())
              : undefined,
        },
        {
          variant: "danger",
          heading: canDelete ? (deleteCard?.title ?? "") : undefined,
          description: canDelete ? formatHtmlParagraphs(deleteCard?.description) : undefined,
          actionLabel: canDelete ? deleteCard?.anchor?.children : undefined,
          onAction: canDelete ? () => onOpenDeletePopup() : undefined,
        },
      ]}
      disabled={isSubmitting}
    />
  );
}
