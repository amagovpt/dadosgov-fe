import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

type AdminDangerActionsProps = {
  warningDescription: React.ReactNode;
  warningActionLabel: string;
  onWarningAction: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  dangerActionLabel: string;
  onDangerAction: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  disabled?: boolean;
};

export default function AdminDangerActions({
  warningDescription,
  warningActionLabel,
  onWarningAction,
  dangerActionLabel,
  onDangerAction,
  disabled = false,
}: AdminDangerActionsProps) {
  return (
    <div className="dataset-edit-danger-actions">
      <StatusCard
        variant="warning"
        showIcon
        description={
          <>
            <strong>{warningDescription}</strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onWarningAction}
              disabled={disabled}
            >
              {warningActionLabel}
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
              onClick={onDangerAction}
              disabled={disabled}
            >
              {dangerActionLabel}
            </Button>
          </>
        }
      />
    </div>
  );
}
