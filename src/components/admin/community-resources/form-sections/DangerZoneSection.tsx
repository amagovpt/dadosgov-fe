"use client";

import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DangerZoneSectionProps {
  isSubmitting: boolean;
  // Backend-computed authorization (single source of truth).
  canDelete?: boolean;
  deleteCard?: AdminCard;
  onDelete: () => void;
}

export default function DangerZoneSection({
  isSubmitting,
  canDelete = true,
  deleteCard,
  onDelete,
}: DangerZoneSectionProps) {
  return (
    <AdminDangerActions
      actions={[
        {
          variant: "danger",
          heading: canDelete ? (deleteCard?.title ?? "") : undefined,
          description: canDelete ? formatHtmlParagraphs(deleteCard?.description) : undefined,
          actionLabel: canDelete ? deleteCard?.anchor?.children : undefined,
          onAction: canDelete && deleteCard ? () => onDelete() : undefined,
        },
      ]}
      disabled={isSubmitting}
    />
  );
}
