"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

type UserAdminProfileDangerZoneProps = {
  userActive: boolean;
  isDeleting: boolean;
  onToggleActive: (event: React.MouseEvent) => void;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
};

export default function UserAdminProfileDangerZone({
  userActive,
  isDeleting,
  onToggleActive,
  onOpenDeletePopup,
}: UserAdminProfileDangerZoneProps) {
  const { t } = useTranslation("admin-users");

  return (
    <div className="dataset-edit-danger-actions">
      <StatusCard
        variant="warning"
        showIcon
        description={
          <>
            <strong>
              {userActive
                ? t("dangerZone.deactivateDescription")
                : t("dangerZone.inactiveDescription")}
            </strong>
            <br />
            <Button
              type="button"
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onToggleActive}
            >
              {userActive ? t("dangerZone.deactivateAction") : t("dangerZone.activateAction")}
            </Button>
          </>
        }
      />
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>{t("dangerZone.deleteWarning")}</strong>
            <br />
            <Button
              type="button"
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onOpenDeletePopup}
              disabled={isDeleting}
            >
              {t("dangerZone.deleteAction")}
            </Button>
          </>
        }
      />
    </div>
  );
}
