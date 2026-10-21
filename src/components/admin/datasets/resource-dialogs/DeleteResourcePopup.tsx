"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminConfirmationDialog } from "@/components/admin/AdminConfirmationDialog";

interface DeleteResourcePopupProps {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function DeleteResourcePopup({ onClose, onConfirm }: DeleteResourcePopupProps) {
  const { t } = useTranslation("admin-datasets");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const deleting = useRef(false);

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
      title={t("resourceDeletion.title")}
      description={t("resourceDeletion.description")}
      cancelLabel={t("edit.cancel")}
      confirmLabel={t(isDeleting ? "edit.deleting" : "resourceDeletion.confirm")}
      isBusy={isDeleting}
      error={hasError ? t("resourceEditing.deleteError") : undefined}
      onClose={onClose}
      onConfirm={() => {
        void handleDelete();
      }}
    />
  );
}
