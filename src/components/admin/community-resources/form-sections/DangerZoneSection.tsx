"use client";

import React from "react";
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
  return (
    <AdminDangerActions
      dangerActionLabel={canDelete ? "Eliminar o recurso comunitário" : undefined}
      onDangerAction={canDelete ? () => onDelete() : undefined}
      disabled={isSubmitting}
    />
  );
}
