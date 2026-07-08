"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface UserProfileAvatarDangerZoneProps {
  isDeletingAvatar: boolean;
  onDeleteAvatar: () => void;
}

export default function UserProfileAvatarDangerZone({
  isDeletingAvatar,
  onDeleteAvatar,
}: UserProfileAvatarDangerZoneProps) {
  const { t } = useTranslation("admin-profile");

  return (
    <div className="dataset-edit-danger-actions" style={{ marginTop: 16 }}>
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>{t("danger.irreversible")}</strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onDeleteAvatar}
              disabled={isDeletingAvatar}
            >
              {isDeletingAvatar
                ? t("form.deleteAvatarLoading")
                : t("form.deleteAvatarButton")}
            </Button>
          </>
        }
      />
    </div>
  );
}
