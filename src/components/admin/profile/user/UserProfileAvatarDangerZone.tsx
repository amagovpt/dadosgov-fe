"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface UserProfileAvatarDangerZoneProps {
  isDeletingAvatar: boolean;
  deleteAvatarCard?: AdminCard;
  onDeleteAvatar: () => void;
}

export default function UserProfileAvatarDangerZone({
  isDeletingAvatar,
  deleteAvatarCard,
  onDeleteAvatar,
}: UserProfileAvatarDangerZoneProps) {
  const { t } = useTranslation("admin-profile");

  return (
    <div style={{ marginTop: 16 }}>
      <AdminDangerActions
        actions={[
          {
            variant: "danger",
            heading: deleteAvatarCard?.title,
            description: formatHtmlParagraphs(deleteAvatarCard?.description),
            actionLabel: isDeletingAvatar
              ? t("form.deleteAvatarLoading")
              : deleteAvatarCard?.anchor?.children,
            onAction: onDeleteAvatar,
          },
        ]}
        disabled={isDeletingAvatar}
      />
    </div>
  );
}
