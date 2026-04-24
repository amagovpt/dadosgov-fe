"use client";

import { useState } from "react";
import { Button, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { Resource } from "@/types/api";
import { deleteResource } from "@/services/api";

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
      <p className="text-neutral-700 text-sm">
        Tem a certeza que deseja eliminar o ficheiro{" "}
        <strong className="text-neutral-900">&quot;{resource.title}&quot;</strong>?
      </p>
      <StatusCard
        type="warning"
        description="Esta ação é irreversível e não pode ser desfeita."
      />
      <div className="flex justify-end gap-16">
        <Button
          variant="primary"
          appearance="outline"
          onClick={hide}
          disabled={isDeleting}
        >
          Cancelar
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
          {isDeleting ? "A eliminar..." : "Eliminar"}
        </Button>
      </div>
    </div>
  );
}
