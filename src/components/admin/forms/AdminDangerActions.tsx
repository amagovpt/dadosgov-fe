"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

type ActionCardVariant = "warning" | "informative" | "danger";

export type AdminDangerAction = {
  variant: ActionCardVariant;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
};

type AdminDangerActionsProps = {
  actions: AdminDangerAction[];
  disabled?: boolean;
};

function ActionCard({
  variant,
  heading,
  description,
  actionLabel,
  onAction,
  disabled = false,
}: {
  variant: ActionCardVariant;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel: React.ReactNode;
  onAction: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <StatusCard
      variant={variant}
      showIcon
      description={
        <>
          {heading ? <strong>{heading}</strong> : null}
          {description ? (
            <>
              {heading ? <br /> : null}
              {description}
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
            onClick={onAction}
            disabled={disabled}
          >
            {actionLabel}
          </Button>
        </>
      }
    />
  );
}

export default function AdminDangerActions({
  actions,
  disabled = false,
}: AdminDangerActionsProps) {
  const { t } = useTranslation("admin-common");
  const visibleActions = actions
    .filter((action) => Boolean(action.actionLabel && action.onAction))
    .map((action) => ({
      ...action,
      heading:
        action.heading ?? (action.variant === "danger" ? t("danger.irreversible") : undefined),
    }));

  // Each card is gated by the backend permission upstream (the caller only
  // passes the action when allowed). When the user can do neither, render
  // nothing instead of an empty danger zone.
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="dataset-edit-danger-actions">
      {visibleActions.map((action, index) => (
        <ActionCard
          key={index}
          variant={action.variant}
          heading={action.heading}
          description={action.description}
          actionLabel={action.actionLabel}
          onAction={action.onAction!}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
