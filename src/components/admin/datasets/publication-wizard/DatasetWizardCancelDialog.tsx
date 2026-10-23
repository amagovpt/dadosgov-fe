"use client";

import { AdminConfirmationDialog } from "@/components/admin/AdminConfirmationDialog";
import { useDatasetConfirmation } from "../DatasetContentProvider";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

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
  const content = useDatasetConfirmation(
    variant === "creation"
      ? "cancel-creation"
      : variant === "resourceEdit"
        ? "discard-resource-changes"
        : "discard-new-resource"
  );
  if (!content) return null;
  return (
    <AdminConfirmationDialog
      title={content.title}
      description={formatHtmlParagraphs(content.description)}
      cancelLabel={content.cancelLabel}
      confirmLabel={content.confirmLabel}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
