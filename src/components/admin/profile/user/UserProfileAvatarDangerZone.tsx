"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface UserProfileAvatarDangerZoneProps {
  isDeletingAvatar: boolean;
  onDeleteAvatar: () => void;
}

export default function UserProfileAvatarDangerZone({
  isDeletingAvatar,
  onDeleteAvatar,
}: UserProfileAvatarDangerZoneProps) {
  return (
    <div className="dataset-edit-danger-actions" style={{ marginTop: 16 }}>
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
              onClick={onDeleteAvatar}
              disabled={isDeletingAvatar}
            >
              {isDeletingAvatar ? "A eliminar..." : "Eliminar foto de perfil"}
            </Button>
          </>
        }
      />
    </div>
  );
}
