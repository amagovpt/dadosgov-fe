"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";

interface PostsEditDangerZoneProps {
  isPublished: boolean;
  isSaving: boolean;
  unpublishCard?: AdminCard;
  deleteCard?: AdminCard;
  onUnpublish: () => void;
  onRepublish: () => void;
  onOpenDeletePopup: () => void;
}

export default function PostsEditDangerZone({
  isPublished,
  isSaving,
  unpublishCard,
  deleteCard,
  onUnpublish,
  onRepublish,
  onOpenDeletePopup,
}: PostsEditDangerZoneProps) {
  const { t } = useTranslation("admin-posts");

  const primaryActionLabel = isSaving
    ? isPublished
      ? t("danger.unpublishing")
      : t("danger.republishing")
    : isPublished
      ? t("danger.unpublish")
      : t("danger.republish");

  return (
    <AdminDangerActions
      primaryVariant={isPublished ? "warning" : "informative"}
      primaryHeading={
        isPublished ? (unpublishCard?.title ?? "") : t("danger.unpublishedHeading")
      }
      primaryDescription={
        isPublished ? (unpublishCard?.description ?? "") : t("danger.unpublishedDescription")
      }
      primaryActionLabel={primaryActionLabel}
      onPrimaryAction={() => (isPublished ? onUnpublish() : onRepublish())}
      dangerHeading={deleteCard?.title ?? ""}
      dangerDescription={deleteCard?.description}
      dangerActionLabel={t("danger.deleteAction")}
      onDangerAction={() => onOpenDeletePopup()}
      disabled={isSaving}
    />
  );
}
