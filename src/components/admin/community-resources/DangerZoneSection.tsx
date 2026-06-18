"use client";

import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

interface DangerZoneSectionProps {
  isSubmitting: boolean;
  onDelete: () => void;
}

export default function DangerZoneSection({
  isSubmitting,
  onDelete,
}: DangerZoneSectionProps) {
  return (
    <AdminDangerActions
      dangerActionLabel="Eliminar o recurso comunitário"
      onDangerAction={() => onDelete()}
      disabled={isSubmitting}
    />
  );
}
