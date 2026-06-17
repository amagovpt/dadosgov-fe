"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface OrganizationSuccessStepProps {
  onPrevious: () => void;
  onFinish: () => void;
}

export default function OrganizationSuccessStep({
  onPrevious,
  onFinish,
}: OrganizationSuccessStepProps) {
  return (
    <div className="admin-page__form">
      <StatusCard
        variant="success"
        showIcon
        description={
          <>
            <strong>A sua organização foi criada!</strong>
            <br />
            Agora pode gerir a sua organização.
          </>
        }
      />

      <div className="admin-page__actions">
        <Button appearance="outline" variant="neutral" onClick={onPrevious}>
          Anterior
        </Button>
        <Button
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
          onClick={onFinish}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
