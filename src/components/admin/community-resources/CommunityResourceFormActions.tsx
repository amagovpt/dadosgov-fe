"use client";

import React from "react";
import { Button } from "@ama-pt/agora-design-system";

interface CommunityResourceFormActionsProps {
  previousLabel: string;
  onPrevious: () => void;
  submitLabel: string;
  loadingSubmitLabel: string;
  isSubmitting: boolean;
  previousIcon: string;
  previousIconHover: string;
  submitIcon: string;
  submitIconHover: string;
  className?: string;
}

export default function CommunityResourceFormActions({
  previousLabel,
  onPrevious,
  submitLabel,
  loadingSubmitLabel,
  isSubmitting,
  previousIcon,
  previousIconHover,
  submitIcon,
  submitIconHover,
  className = "admin-page__actions flex gap-[18px]",
}: CommunityResourceFormActionsProps) {
  return (
    <div className={className}>
      <Button
        variant="primary"
        appearance="outline"
        hasIcon
        leadingIcon={previousIcon}
        leadingIconHover={previousIconHover}
        onClick={onPrevious}
      >
        {previousLabel}
      </Button>
      <Button
        type="submit"
        variant="primary"
        hasIcon
        trailingIcon={submitIcon}
        trailingIconHover={submitIconHover}
        disabled={isSubmitting}
      >
        {isSubmitting ? loadingSubmitLabel : submitLabel}
      </Button>
    </div>
  );
}
