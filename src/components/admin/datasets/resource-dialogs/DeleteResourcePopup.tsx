"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { Resource } from "@/service/types/dataset";
import { deleteResource } from "@/service/api/datasets";

interface DeleteResourcePopupProps {
  datasetId: string;
  resource: Resource;
  onDeleted: () => void;
}

export default function DeleteResourcePopup({
  datasetId,
  resource,
  onDeleted,
}: DeleteResourcePopupProps) {
  const { t } = useTranslation("admin-datasets");
  const { hide } = usePopupContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteResource(datasetId, resource.id);
      onDeleted();
      hide();
    } catch (error) {
      console.error("Error deleting resource:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <p className="text-sm text-neutral-700">
        {t("edit.resourceDeleteConfirm", { title: resource.title })}
      </p>
      <StatusCard variant="warning" showIcon description={t("edit.resourceDeleteWarning")} />
      <div className="flex justify-end gap-16">
        <Button variant="primary" appearance="outline" onClick={hide} disabled={isDeleting}>
          {t("edit.cancel")}
        </Button>
        <Button
          variant="danger"
          appearance="solid"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? t("edit.deleting") : t("edit.confirmDelete")}
        </Button>
      </div>
    </div>
  );
}
