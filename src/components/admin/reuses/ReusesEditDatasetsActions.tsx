import React from "react";
import { Button } from "@ama-pt/agora-design-system";

type ReusesEditDatasetsActionsProps = {
  isSubmitting: boolean;
  canSave: boolean;
  onAddDatasetLink: () => void;
  onSave: () => void | Promise<void>;
};

export default function ReusesEditDatasetsActions({
  isSubmitting,
  canSave,
  onAddDatasetLink,
  onSave,
}: ReusesEditDatasetsActionsProps) {
  return (
    <>
      <div className="flex justify-end">
        <Button
          appearance="outline"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={onAddDatasetLink}
        >
          Adicionar
        </Button>
      </div>

      <div className="admin-page__actions flex justify-end gap-[18px]">
        <Button
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
          onClick={onSave}
          disabled={!canSave || isSubmitting}
        >
          {isSubmitting ? "A guardar..." : "Guardar"}
        </Button>
      </div>
    </>
  );
}
