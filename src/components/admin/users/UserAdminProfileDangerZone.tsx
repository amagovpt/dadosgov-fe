"use client";

import React from "react";
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
  return (
    <div className="dataset-edit-danger-actions">
      <StatusCard
        variant="warning"
        showIcon
        description={
          <>
            <strong>
              {userActive
                ? "Uma conta desativada impede o utilizador de iniciar sessão no portal, mas os seus dados permanecem acessíveis."
                : "Esta conta está desativada. O utilizador não consegue iniciar sessão no portal."}
            </strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onToggleActive}
            >
              {userActive ? "Desativar conta" : "Ativar conta"}
            </Button>
          </>
        }
      />
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>Atenção esta ação é irreversível.</strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onOpenDeletePopup}
              disabled={isDeleting}
            >
              Eliminar o perfil
            </Button>
          </>
        }
      />
    </div>
  );
}
