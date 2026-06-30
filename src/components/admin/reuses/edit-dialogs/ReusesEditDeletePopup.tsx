import React from "react";
import { Button } from "@ama-pt/agora-design-system";

type ReusesEditDeletePopupProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function ReusesEditDeletePopup({
  onClose,
  onConfirm,
}: ReusesEditDeletePopupProps) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível. Tem a certeza que quer eliminar esta reutilização?</p>
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
