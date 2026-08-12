import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";

type DatasetsEditDeletePopupProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function DatasetsEditDeletePopup({
  onClose,
  onConfirm,
}: DatasetsEditDeletePopupProps) {
  const { t } = useTranslation("admin-datasets");

  return (
    <div className="flex flex-col gap-16">
      <p>{t("edit.deleteConfirm")}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {t("edit.cancel")}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {t("edit.confirmDelete")}
        </Button>
      </div>
    </div>
  );
}
