"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import type { AdminCard } from "@/service/types/admin/common";

type UserAdminProfileDangerZoneProps = {
  userActive: boolean;
  isDeleting: boolean;
  onToggleActive: (event: React.MouseEvent) => void;
  onOpenDeletePopup: (event: React.MouseEvent) => void;
  deactivateCard?: AdminCard;
  deleteCard?: AdminCard;
};

export default function UserAdminProfileDangerZone({
  userActive,
  isDeleting,
  onToggleActive,
  onOpenDeletePopup,
  deactivateCard,
  deleteCard,
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
                ? deactivateCard?.title || deactivateCard?.description || ""
                : t("dangerZone.inactiveDescription")}
            </strong>
            <br />
            {userActive && deactivateCard?.title && deactivateCard.description ? (
              <>
                {deactivateCard.description}
                <br />
              </>
            ) : null}
            <Button
              type="button"
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onToggleActive}
            >
              {userActive
                ? deactivateCard?.anchor?.children || t("dangerZone.deactivateAction")
                : t("dangerZone.activateAction")}
            </Button>
          </>
        }
      />
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>{deleteCard?.title ?? ""}</strong>
            {deleteCard?.description ? (
              <>
                <br />
                {deleteCard.description}
              </>
            ) : null}
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
              {deleteCard?.anchor?.children || t("dangerZone.deleteAction")}
            </Button>
          </>
        }
      />
    </div>
  );
}
