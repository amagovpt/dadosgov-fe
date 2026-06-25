"use client";

import React from "react";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";

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

      <AdminStepActions
        previousAction={{
          label: "Anterior",
          appearance: "outline",
          variant: "neutral",
          onClick: onPrevious,
        }}
        primaryAction={{
          label: "Guardar",
          hasIcon: true,
          trailingIcon: "agora-line-check-circle",
          trailingIconHover: "agora-solid-check-circle",
          onClick: onFinish,
        }}
      />
    </div>
  );
}
