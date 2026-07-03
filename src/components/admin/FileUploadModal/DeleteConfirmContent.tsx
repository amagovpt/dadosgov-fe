"use client";

import { Button, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";

interface DeleteConfirmContentProps {
  name: string;
  onConfirm: () => void;
}

export function DeleteConfirmContent({ name, onConfirm }: DeleteConfirmContentProps) {
  const { hide } = usePopupContext();
  return (
    <div className="flex flex-col p-2">
      <StatusCard variant="informative" showIcon description="Esta ação é irreversível." />
      <p className="text-sm text-neutral-900" style={{ marginTop: "24px" }}>
        Tem a certeza que pretende eliminar <span className="font-bold">{name}</span>?
      </p>
      <div className="flex justify-end gap-[18px]" style={{ marginTop: "32px" }}>
        <Button variant="primary" appearance="outline" onClick={hide}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          appearance="solid"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          onClick={() => {
            onConfirm();
            hide();
          }}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}
