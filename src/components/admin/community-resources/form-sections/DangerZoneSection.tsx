"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

interface DangerZoneSectionProps {
  isSubmitting: boolean;
  // Backend-computed authorization (single source of truth).
  canDelete?: boolean;
  onDelete: () => void;
}

export default function DangerZoneSection({
  isSubmitting,
  canDelete = true,
  onDelete,
}: DangerZoneSectionProps) {
  const { t } = useTranslation("admin-community-resources");

  return (
    <AdminDangerActions
      actions={[
        {
          variant: "danger",
          actionLabel: canDelete ? t("form.deleteResource") : undefined,
          onAction: canDelete ? () => onDelete() : undefined,
        },
      ]}
      disabled={isSubmitting}
    />
  );
}
