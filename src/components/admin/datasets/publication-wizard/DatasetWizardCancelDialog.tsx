"use client";

import { useTranslation } from "react-i18next";
import { AdminConfirmationDialog } from "@/components/admin/AdminConfirmationDialog";

interface DatasetWizardCancelDialogProps {
  variant?: "creation" | "resource" | "resourceEdit";
  onClose: () => void;
  onConfirm: () => void;
}

export function DatasetWizardCancelDialog({
  variant = "creation",
  onClose,
  onConfirm,
}: DatasetWizardCancelDialogProps) {
  const { t } = useTranslation("admin-datasets");
  const translationKey = variant === "creation" ? "cancelCreation" : "resourceEditor.cancel";
  const descriptionKey = variant === "resourceEdit" ? "editDescription" : "description";
  return (
    <AdminConfirmationDialog
      title={t(`${translationKey}.title`)}
      description={t(`${translationKey}.${descriptionKey}`)}
      cancelLabel={t(`${translationKey}.back`)}
      confirmLabel={t(`${translationKey}.confirm`)}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
