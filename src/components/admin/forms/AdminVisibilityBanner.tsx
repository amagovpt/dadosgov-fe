import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

type AdminVisibilityBannerProps = {
  description: React.ReactNode;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void | Promise<void>;
};

export default function AdminVisibilityBanner({
  description,
  actionLabel,
  disabled = false,
  onAction,
}: AdminVisibilityBannerProps) {
  return (
    <div className="dataset-edit-visibility-banner">
      <StatusCard variant="informative" showIcon description={description} />
      <div>
        <Button variant="primary" appearance="outline" onClick={onAction} disabled={disabled}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
