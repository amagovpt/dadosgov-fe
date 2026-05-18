import React from "react";
import { Button } from "@ama-pt/agora-design-system";

type DatasetsEditDeletePopupProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function DatasetsEditDeletePopup({
  onClose,
  onConfirm,
}: DatasetsEditDeletePopupProps) {
  return (
    <div className="flex flex-col gap-16">
      <p>Essa ação é irreversível. Tem a certeza que quer eliminar este conjunto de dados?</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}
