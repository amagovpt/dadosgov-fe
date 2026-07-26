import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

type DatasetsEditDangerZoneProps = {
  datasetArchived: boolean;
  isSubmitting: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  transferCard?: AdminCard;
  archiveCard?: AdminCard;
  unarchiveCard?: AdminCard;
  deleteCard?: AdminCard;
  onOpenTransferPopup: (event: React.MouseEvent) => void;
  onToggleArchive: (event: React.MouseEvent) => void | Promise<void>;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function DatasetsEditDangerZone({
  datasetArchived,
  isSubmitting,
  canEdit = true,
  canDelete = true,
  transferCard,
  archiveCard,
  unarchiveCard,
  deleteCard,
  onOpenTransferPopup,
  onToggleArchive,
  onOpenDeletePopup,
}: DatasetsEditDangerZoneProps) {
  const archiveActionCard = datasetArchived ? unarchiveCard : archiveCard;

  return (
    <AdminDangerActions
      actions={[
        {
          variant: "informative",
          heading: canEdit ? transferCard?.title : undefined,
          description: canEdit ? formatHtmlParagraphs(transferCard?.description) : undefined,
          actionLabel: canEdit ? transferCard?.anchor?.children : undefined,
          onAction: canEdit && transferCard ? onOpenTransferPopup : undefined,
        },
        {
          variant: "warning",
          heading: canEdit ? archiveActionCard?.title : undefined,
          description: canEdit ? formatHtmlParagraphs(archiveActionCard?.description) : undefined,
          actionLabel: canEdit ? archiveActionCard?.anchor?.children : undefined,
          onAction: canEdit && archiveActionCard ? onToggleArchive : undefined,
        },
        {
          variant: "danger",
          heading: canDelete ? (deleteCard?.title ?? "") : undefined,
          description: canDelete ? formatHtmlParagraphs(deleteCard?.description) : undefined,
          actionLabel: canDelete ? deleteCard?.anchor?.children : undefined,
          onAction: canDelete ? onOpenDeletePopup : undefined,
        },
      ]}
      disabled={isSubmitting}
    />
  );
}
