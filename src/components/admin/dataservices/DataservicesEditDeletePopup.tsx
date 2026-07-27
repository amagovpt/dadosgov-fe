import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";

type DataservicesEditDeletePopupProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function DataservicesEditDeletePopup({
  onClose,
  onConfirm,
}: DataservicesEditDeletePopupProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);

  return (
    <div className="flex flex-col gap-16">
      <p>{t("admin-dataservices:edit.deleteConfirm")}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {t("admin-common:actions.cancel")}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {t("admin-common:actions.delete")}
        </Button>
      </div>
    </div>
  );
}
