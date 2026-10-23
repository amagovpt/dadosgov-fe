"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminConfirmationDialog } from "@/components/admin/AdminConfirmationDialog";
import { useDatasetConfirmation } from "../DatasetContentProvider";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DatasetLifecycleConfirmationDialogProps {
  action: "delete" | "archive";
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function DatasetLifecycleConfirmationDialog({
  action,
  onClose,
  onConfirm,
}: DatasetLifecycleConfirmationDialogProps) {
  const { t } = useTranslation("admin-datasets");
  const isArchive = action === "archive";
  const content = useDatasetConfirmation(isArchive ? "archive-dataset" : "delete-dataset");
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const confirming = useRef(false);
  if (!content) return null;

  async function handleConfirm() {
    if (confirming.current) return;
    confirming.current = true;
    setIsConfirming(true);
    setHasError(false);
    try {
      await onConfirm();
      onClose();
    } catch {
      setHasError(true);
    } finally {
      confirming.current = false;
      setIsConfirming(false);
    }
  }

  return (
    <AdminConfirmationDialog
      title={content.title}
      description={formatHtmlParagraphs(content.description)}
      cancelLabel={content.cancelLabel}
      confirmLabel={
        isConfirming
          ? t(isArchive ? "datasetArchive.pending" : "edit.deleting")
          : content.confirmLabel
      }
      confirmVariant={isArchive ? "warning" : "danger"}
      isBusy={isConfirming}
      error={hasError ? t(isArchive ? "edit.archiveError" : "edit.deleteError") : undefined}
      onClose={onClose}
      onConfirm={() => {
        void handleConfirm();
      }}
    />
  );
}
