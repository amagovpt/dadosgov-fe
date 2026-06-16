"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface DangerZoneSectionProps {
  isSubmitting: boolean;
  onDelete: () => void;
}

export default function DangerZoneSection({
  isSubmitting,
  onDelete,
}: DangerZoneSectionProps) {
  return (
    <div className="dataset-edit-danger-actions">
      <StatusCard
        variant="danger"
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
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Eliminar o recurso comunitário
            </Button>
          </>
        }
      />
    </div>
  );
}
