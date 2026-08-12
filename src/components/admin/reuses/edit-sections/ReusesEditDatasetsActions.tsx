import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";

type ReusesEditDatasetsActionsProps = {
  isSubmitting: boolean;
  canSave: boolean;
  onAddDatasetLink: () => void;
};

export default function ReusesEditDatasetsActions({
  isSubmitting,
  canSave,
  onAddDatasetLink,
}: ReusesEditDatasetsActionsProps) {
  const { t } = useTranslation("admin-reuses");

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          appearance="outline"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={onAddDatasetLink}
        >
          {t("form.addDatasetLink")}
        </Button>
      </div>

      <div className="admin-page__actions flex justify-end gap-[18px]">
        <Button
          type="submit"
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
          disabled={!canSave || isSubmitting}
        >
          {isSubmitting ? t("edit.saving") : t("edit.save")}
        </Button>
      </div>
    </>
  );
}
