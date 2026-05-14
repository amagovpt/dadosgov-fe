"use client";

import { Button, usePopupContext } from "@ama-pt/agora-design-system";

interface DeleteAvatarPopupContentProps {
  onConfirm: () => Promise<void>;
}

export function DeleteAvatarPopupContent({ onConfirm }: DeleteAvatarPopupContentProps) {
  const { hide } = usePopupContext();

  const handleConfirm = async () => {
    hide();
    await onConfirm();
  };

  return (
    <div className="flex flex-col gap-24">
      <p>Tem a certeza que deseja eliminar a foto de perfil?</p>
      <div className="flex gap-16">
        <Button appearance="outline" variant="neutral" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button appearance="solid" variant="danger" onClick={handleConfirm}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}
