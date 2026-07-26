"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface OrganizationDangerZoneProps {
  canDelete: boolean;
  isDeleting: boolean;
  deleteError: boolean;
  deleteCard?: AdminCard;
  onDeleteClick: (event: React.MouseEvent) => void;
}

export default function OrganizationDangerZone({
  canDelete,
  isDeleting,
  deleteError,
  deleteCard,
  onDeleteClick,
}: OrganizationDangerZoneProps) {
  const { t } = useTranslation("admin-profile");

  if (!canDelete) {
    return null;
  }

  return (
    <>
      {deleteError && (
        <StatusCard
          variant="danger"
          showIcon
          description={t("organization.deleteError")}
        />
      )}
      <AdminDangerActions
        actions={[
          {
            variant: "danger",
            heading: deleteCard?.title,
            description: formatHtmlParagraphs(deleteCard?.description),
            actionLabel: deleteCard?.anchor?.children,
            onAction: onDeleteClick,
          },
        ]}
        disabled={isDeleting}
      />
    </>
  );
}
