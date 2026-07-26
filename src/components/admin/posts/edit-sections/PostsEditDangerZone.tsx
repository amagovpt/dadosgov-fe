"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface PostsEditDangerZoneProps {
  isPublished: boolean;
  isSaving: boolean;
  unpublishCard?: AdminCard;
  republishCard?: AdminCard;
  deleteCard?: AdminCard;
  onUnpublish: () => void;
  onRepublish: () => void;
  onOpenDeletePopup: () => void;
}

export default function PostsEditDangerZone({
  isPublished,
  isSaving,
  unpublishCard,
  republishCard,
  deleteCard,
  onUnpublish,
  onRepublish,
  onOpenDeletePopup,
}: PostsEditDangerZoneProps) {
  const { t } = useTranslation("admin-posts");
  const publicationActionCard = isPublished ? unpublishCard : republishCard;

  const publicationActionLabel = isSaving
    ? isPublished
      ? t("danger.unpublishing")
      : t("danger.republishing")
    : publicationActionCard?.anchor?.children;

  return (
    <AdminDangerActions
      actions={[
        {
          variant: isPublished ? "warning" : "informative",
          heading: publicationActionCard?.title,
          description: formatHtmlParagraphs(publicationActionCard?.description),
          actionLabel: publicationActionLabel,
          onAction: publicationActionCard
            ? () => (isPublished ? onUnpublish() : onRepublish())
            : undefined,
        },
        {
          variant: "danger",
          heading: deleteCard?.title ?? "",
          description: formatHtmlParagraphs(deleteCard?.description),
          actionLabel: deleteCard?.anchor?.children,
          onAction: () => onOpenDeletePopup(),
        },
      ]}
      disabled={isSaving}
    />
  );
}
