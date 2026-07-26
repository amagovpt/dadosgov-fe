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
  const primaryCard = isPublished ? unpublishCard : republishCard;

  const primaryActionLabel = isSaving
    ? isPublished
      ? t("danger.unpublishing")
      : t("danger.republishing")
    : primaryCard?.anchor?.children;

  return (
    <AdminDangerActions
      primaryVariant={isPublished ? "warning" : "informative"}
      primaryHeading={primaryCard?.title}
      primaryDescription={formatHtmlParagraphs(primaryCard?.description)}
      primaryActionLabel={primaryActionLabel}
      onPrimaryAction={primaryCard ? () => (isPublished ? onUnpublish() : onRepublish()) : undefined}
      dangerHeading={deleteCard?.title ?? ""}
      dangerDescription={formatHtmlParagraphs(deleteCard?.description)}
      dangerActionLabel={deleteCard?.anchor?.children}
      onDangerAction={() => onOpenDeletePopup()}
      disabled={isSaving}
    />
  );
}
