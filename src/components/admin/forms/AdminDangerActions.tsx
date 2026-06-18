import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

type ActionCardVariant = "warning" | "informative" | "danger";

type AdminDangerActionsProps = {
  primaryVariant?: ActionCardVariant;
  primaryHeading?: React.ReactNode;
  primaryDescription?: React.ReactNode;
  primaryActionLabel?: React.ReactNode;
  onPrimaryAction?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  dangerHeading?: React.ReactNode;
  dangerDescription?: React.ReactNode;
  dangerActionLabel: React.ReactNode;
  onDangerAction: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
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
  heading: React.ReactNode;
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
          <strong>{heading}</strong>
          {description ? (
            <>
              <br />
              {description}
            </>
          ) : null}
          <br />
          <Button
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
  primaryVariant = "warning",
  primaryHeading,
  primaryDescription,
  primaryActionLabel,
  onPrimaryAction,
  dangerHeading = "Atenção esta ação é irreversível.",
  dangerDescription,
  dangerActionLabel,
  onDangerAction,
  disabled = false,
}: AdminDangerActionsProps) {
  return (
    <div className="dataset-edit-danger-actions">
      {primaryHeading && primaryActionLabel && onPrimaryAction ? (
        <ActionCard
          variant={primaryVariant}
          heading={primaryHeading}
          description={primaryDescription}
          actionLabel={primaryActionLabel}
          onAction={onPrimaryAction}
          disabled={disabled}
        />
      ) : null}

      <ActionCard
        variant="danger"
        heading={dangerHeading}
        description={dangerDescription}
        actionLabel={dangerActionLabel}
        onAction={onDangerAction}
        disabled={disabled}
      />
    </div>
  );
}
