"use client";

import React from "react";
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
  if (!canDelete) {
    return null;
  }

  return (
    <div className="dataset-edit-danger-actions">
      {deleteError && (
        <StatusCard
          variant="danger"
          showIcon
          description="Ocorreu um erro ao eliminar a organização. Por favor, tente novamente."
        />
      )}
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>Atenção Esta ação é irreversível.</strong>
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
              Eliminar a organização
            </Button>
          </>
        }
      />
    </div>
  );
}
