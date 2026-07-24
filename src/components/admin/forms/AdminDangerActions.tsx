import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

type ActionCardVariant = "warning" | "informative" | "danger";

type AdminDangerActionsProps = {
  leadingVariant?: ActionCardVariant;
  leadingHeading?: React.ReactNode;
  leadingDescription?: React.ReactNode;
  leadingActionLabel?: React.ReactNode;
  onLeadingAction?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  primaryVariant?: ActionCardVariant;
  primaryHeading?: React.ReactNode;
  primaryDescription?: React.ReactNode;
  primaryActionLabel?: React.ReactNode;
  onPrimaryAction?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  dangerHeading?: React.ReactNode;
  dangerDescription?: React.ReactNode;
  dangerActionLabel?: React.ReactNode;
  onDangerAction?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
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
  leadingVariant = "informative",
  leadingHeading,
  leadingDescription,
  leadingActionLabel,
  onLeadingAction,
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
  const showLeading = Boolean(leadingHeading && leadingActionLabel && onLeadingAction);
  const showPrimary = Boolean(primaryHeading && primaryActionLabel && onPrimaryAction);
  const showDanger = Boolean(dangerActionLabel && onDangerAction);

  // Each card is gated by the backend permission upstream (the caller only
  // passes the action when allowed). When the user can do neither, render
  // nothing instead of an empty danger zone.
  if (!showLeading && !showPrimary && !showDanger) {
    return null;
  }

  return (
    <div className="dataset-edit-danger-actions">
      {showLeading ? (
        <ActionCard
          variant={leadingVariant}
          heading={leadingHeading}
          description={leadingDescription}
          actionLabel={leadingActionLabel}
          onAction={onLeadingAction!}
          disabled={disabled}
        />
      ) : null}

      {showPrimary ? (
        <ActionCard
          variant={primaryVariant}
          heading={primaryHeading}
          description={primaryDescription}
          actionLabel={primaryActionLabel}
          onAction={onPrimaryAction!}
          disabled={disabled}
        />
      ) : null}

      {showDanger ? (
        <ActionCard
          variant="danger"
          heading={dangerHeading}
          description={dangerDescription}
          actionLabel={dangerActionLabel}
          onAction={onDangerAction!}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
