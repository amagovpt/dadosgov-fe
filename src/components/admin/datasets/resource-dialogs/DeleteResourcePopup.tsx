"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminConfirmationDialog } from "@/components/admin/AdminConfirmationDialog";
import { useDatasetConfirmation } from "../DatasetContentProvider";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DeleteResourcePopupProps {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function DeleteResourcePopup({ onClose, onConfirm }: DeleteResourcePopupProps) {
  const { t } = useTranslation("admin-datasets");
  const content = useDatasetConfirmation("delete-resource");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const deleting = useRef(false);
  if (!content) return null;

  async function handleDelete() {
    if (deleting.current) return;
    deleting.current = true;
    setIsDeleting(true);
    setHasError(false);
    try {
      await onConfirm();
      onClose();
    } catch {
      setHasError(true);
    } finally {
      deleting.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <AdminConfirmationDialog
      title={content.title}
      description={formatHtmlParagraphs(content.description)}
      cancelLabel={content.cancelLabel}
      confirmLabel={isDeleting ? t("edit.deleting") : content.confirmLabel}
      isBusy={isDeleting}
      error={hasError ? t("resourceEditing.deleteError") : undefined}
      onClose={onClose}
      onConfirm={() => {
        void handleDelete();
      }}
    />
  );
}
