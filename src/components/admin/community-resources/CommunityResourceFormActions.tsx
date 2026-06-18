"use client";

import React from "react";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";

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
    <AdminStepActions
      className={className}
      previousAction={{
        label: previousLabel,
        appearance: "outline",
        variant: "primary",
        hasIcon: true,
        leadingIcon: previousIcon,
        leadingIconHover: previousIconHover,
        onClick: onPrevious,
      }}
      primaryAction={{
        label: isSubmitting ? loadingSubmitLabel : submitLabel,
        type: "submit",
        hasIcon: true,
        trailingIcon: submitIcon,
        trailingIconHover: submitIconHover,
        disabled: isSubmitting,
      }}
    />
  );
}
