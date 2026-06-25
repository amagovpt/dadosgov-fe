"use client";

import React from "react";
import { Button } from "@ama-pt/agora-design-system";

type AdminStepAction = {
  label: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  appearance?: "solid" | "outline" | "link";
  variant?: "primary" | "neutral" | "danger";
  hasIcon?: boolean;
  leadingIcon?: string;
  leadingIconHover?: string;
  trailingIcon?: string;
  trailingIconHover?: string;
  disabled?: boolean;
};

interface AdminStepActionsProps {
  previousAction?: AdminStepAction;
  secondaryAction?: AdminStepAction;
  primaryAction: AdminStepAction;
  className?: string;
}

function renderAction(action: AdminStepAction, key: string) {
  return (
    <Button
      key={key}
      type={action.type ?? "button"}
      appearance={action.appearance}
      variant={action.variant ?? "primary"}
      hasIcon={action.hasIcon}
      leadingIcon={action.leadingIcon}
      leadingIconHover={action.leadingIconHover}
      trailingIcon={action.trailingIcon}
      trailingIconHover={action.trailingIconHover}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}

export default function AdminStepActions({
  previousAction,
  secondaryAction,
  primaryAction,
  className = "admin-page__actions",
}: AdminStepActionsProps) {
  return (
    <div className={className}>
      {previousAction ? renderAction(previousAction, "previous") : null}
      {secondaryAction ? renderAction(secondaryAction, "secondary") : null}
      {renderAction(primaryAction, "primary")}
    </div>
  );
}
