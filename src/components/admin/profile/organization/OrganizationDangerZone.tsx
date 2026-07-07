"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface OrganizationDangerZoneProps {
  canDelete: boolean;
  isDeleting: boolean;
  deleteError: boolean;
  onDeleteClick: (event: React.MouseEvent) => void;
}

export default function OrganizationDangerZone({
  canDelete,
  isDeleting,
  deleteError,
  onDeleteClick,
}: OrganizationDangerZoneProps) {
  const { t } = useTranslation("admin-profile");

  if (!canDelete) {
    return null;
  }

  return (
    <div className="dataset-edit-danger-actions">
      {deleteError && (
        <StatusCard
          variant="danger"
          showIcon
          description={t("organization.deleteError")}
        />
      )}
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
              onClick={onDeleteClick}
              disabled={isDeleting}
            >
              {t("organization.danger.deleteAction")}
            </Button>
          </>
        }
      />
    </div>
  );
}
