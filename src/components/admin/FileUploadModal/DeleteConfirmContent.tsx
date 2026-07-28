"use client";

import { useTranslation } from "react-i18next";
import { Button, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";

interface DeleteConfirmContentProps {
  name: string;
  onConfirm: () => void;
}

export function DeleteConfirmContent({ name, onConfirm }: DeleteConfirmContentProps) {
  const { t } = useTranslation("admin-common");
  const { hide } = usePopupContext();
  return (
    <div className="flex flex-col p-2">
      <StatusCard variant="informative" showIcon description={t("danger.irreversible")} />
      <p className="text-sm text-neutral-900" style={{ marginTop: "24px" }}>
        {t("fileUpload.deleteConfirm.message.before")}
        <span className="font-bold">{name}</span>
        {t("fileUpload.deleteConfirm.message.after")}
      </p>
      <div className="flex justify-end gap-[18px]" style={{ marginTop: "32px" }}>
        <Button variant="primary" appearance="outline" onClick={hide}>
          {t("actions.cancel")}
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
          {t("actions.delete")}
        </Button>
      </div>
    </div>
  );
}
