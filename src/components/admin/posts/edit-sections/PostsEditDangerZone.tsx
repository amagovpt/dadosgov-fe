"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

interface PostsEditDangerZoneProps {
  isPublished: boolean;
  isSaving: boolean;
  onUnpublish: () => void;
  onRepublish: () => void;
  onOpenDeletePopup: () => void;
}

export default function PostsEditDangerZone({
  isPublished,
  isSaving,
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
      primaryHeading={isPublished ? t("danger.unpublishHeading") : t("danger.unpublishedHeading")}
      primaryDescription={
        isPublished ? t("danger.unpublishDescription") : t("danger.unpublishedDescription")
      }
      primaryActionLabel={primaryActionLabel}
      onPrimaryAction={() => (isPublished ? onUnpublish() : onRepublish())}
      dangerHeading={t("danger.deleteHeading")}
      dangerActionLabel={t("danger.deleteAction")}
      onDangerAction={() => onOpenDeletePopup()}
      disabled={isSaving}
    />
  );
}
