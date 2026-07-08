import { Button } from "@ama-pt/agora-design-system";

export function DeleteBlockPopupContent({
  onClose,
  onConfirm,
  message = "Essa ação é irreversível. Tem a certeza que quer eliminar este bloco?",
}: {
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>{message}</p>
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
