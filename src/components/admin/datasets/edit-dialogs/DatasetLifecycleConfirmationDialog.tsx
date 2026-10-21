"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminConfirmationDialog } from "@/components/admin/AdminConfirmationDialog";

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
  const translationKey = isArchive ? "datasetArchive" : "datasetDeletion";
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const confirming = useRef(false);

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
      title={t(`${translationKey}.title`)}
      description={t(`${translationKey}.description`)}
      cancelLabel={t("edit.cancel")}
      confirmLabel={t(
        isConfirming
          ? isArchive
            ? "datasetArchive.pending"
            : "edit.deleting"
          : `${translationKey}.confirm`
      )}
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
