"use client";

import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

type UserAdminProfileDangerZoneProps = {
  userActive: boolean;
  isDeleting: boolean;
  onToggleActive: (event: React.MouseEvent) => void;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
  activateCard?: AdminCard;
  deactivateCard?: AdminCard;
  deleteCard?: AdminCard;
};

export default function UserAdminProfileDangerZone({
  userActive,
  isDeleting,
  onToggleActive,
  onOpenDeletePopup,
  activateCard,
  deactivateCard,
  deleteCard,
}: UserAdminProfileDangerZoneProps) {
  const accountStatusCard = userActive ? deactivateCard : activateCard;

  return (
    <AdminDangerActions
      actions={[
        {
          variant: "warning",
          heading: accountStatusCard?.title,
          description: formatHtmlParagraphs(accountStatusCard?.description),
          actionLabel: accountStatusCard?.anchor?.children,
          onAction: onToggleActive,
        },
        {
          variant: "danger",
          heading: deleteCard?.title ?? "",
          description: formatHtmlParagraphs(deleteCard?.description),
          actionLabel: deleteCard?.anchor?.children,
          onAction: onOpenDeletePopup,
        },
      ]}
      disabled={isDeleting}
    />
  );
}
